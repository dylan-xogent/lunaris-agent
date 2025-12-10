package agent

import (
	"context"
	"fmt"
	"log"
	"os"
	"runtime"
	"strings"
	"time"

	"github.com/lunaris/agent/internal/api"
	"github.com/lunaris/agent/internal/config"
	"github.com/lunaris/agent/internal/metrics"
	"github.com/lunaris/agent/internal/winget"
)

const AgentVersion = "1.0.0"

// Logger is an interface for logging
type Logger interface {
	Printf(format string, v ...interface{})
	Println(v ...interface{})
}

// Agent is the main agent controller
type Agent struct {
	config    *config.Config
	client    *api.Client
	scanner   *winget.Scanner
	installer *winget.Installer
	logger    Logger
}

// New creates a new agent instance
func New(cfg *config.Config) *Agent {
	logger := log.New(os.Stdout, "[Lunaris Agent] ", log.LstdFlags)

	return &Agent{
		config:    cfg,
		client:    api.NewClient(cfg.APIURL),
		scanner:   winget.NewScanner(),
		installer: winget.NewInstaller(),
		logger:    logger,
	}
}

// NewWithLogger creates a new agent instance with a custom logger
func NewWithLogger(cfg *config.Config, logger Logger) *Agent {
	return &Agent{
		config:    cfg,
		client:    api.NewClient(cfg.APIURL),
		scanner:   winget.NewScanner(),
		installer: winget.NewInstaller(),
		logger:    logger,
	}
}

// Run starts the agent main loop
func (a *Agent) Run(ctx context.Context) error {
	a.logger.Println("Starting Lunaris Agent v" + AgentVersion)
	a.logger.Printf("API URL: %s", a.config.APIURL)

	// Register device if not already registered
	if a.config.DeviceID == "" {
		if err := a.register(); err != nil {
			return fmt.Errorf("registration failed: %w", err)
		}
	} else {
		a.logger.Printf("Device already registered: %s", a.config.DeviceID)
	}

	// Start background tasks
	heartbeatTicker := time.NewTicker(time.Duration(a.config.HeartbeatIntervalSec) * time.Second)
	updateScanTicker := time.NewTicker(time.Duration(a.config.UpdateScanIntervalMin) * time.Minute)
	commandPollTicker := time.NewTicker(10 * time.Second) // Poll for commands every 10 seconds
	defer heartbeatTicker.Stop()
	defer updateScanTicker.Stop()
	defer commandPollTicker.Stop()

	// Initial heartbeat and scan
	a.sendHeartbeat()
	a.scanAndReportUpdates()

	a.logger.Println("Agent started - polling for commands every 10 seconds")

	// Main loop
	for {
		select {
		case <-ctx.Done():
			a.logger.Println("Agent shutting down...")
			return nil

		case <-heartbeatTicker.C:
			a.sendHeartbeat()

		case <-updateScanTicker.C:
			a.scanAndReportUpdates()

		case <-commandPollTicker.C:
			a.pollAndExecuteCommands()
		}
	}
}

// pollAndExecuteCommands polls for pending commands and executes them
func (a *Agent) pollAndExecuteCommands() {
	// Get pending commands from server
	cmdResp, err := a.client.GetPendingCommands(a.config.DeviceID)
	if err != nil {
		// Only log error if it's not a network timeout
		a.logger.Printf("Failed to poll commands: %v", err)
		return
	}

	if len(cmdResp.Commands) == 0 {
		return
	}

	a.logger.Printf("Received %d command(s) to execute", len(cmdResp.Commands))

	// Execute each command
	for _, cmd := range cmdResp.Commands {
		a.executeCommand(cmd)
	}
}

// executeCommand executes a single command
func (a *Agent) executeCommand(cmd api.Command) {
	a.logger.Printf("Executing command %s (type: %s)", cmd.ID, cmd.Type)

	switch cmd.Type {
	case "install_updates":
		a.executeInstallCommand(cmd)
	case "run_scan":
		a.executeSyncCommand(cmd)
	default:
		a.logger.Printf("Unknown command type: %s", cmd.Type)
		a.client.CompleteCommand(cmd.ID, false, fmt.Sprintf("Unknown command type: %s", cmd.Type))
	}
}

// executeInstallCommand executes an install_updates command
func (a *Agent) executeInstallCommand(cmd api.Command) {
	a.logger.Printf("Installing %d package(s): %v", len(cmd.PackageIdentifiers), cmd.PackageIdentifiers)

	// Install each package
	results := a.installer.InstallMultiple(cmd.PackageIdentifiers)

	// Log results
	successCount := 0
	failureCount := 0
	resultMessages := []string{}

	for _, result := range results {
		if result.Success {
			successCount++
			a.logger.Printf("  ✓ %s: %s", result.PackageIdentifier, result.Message)
			resultMessages = append(resultMessages, fmt.Sprintf("✓ %s: %s", result.PackageIdentifier, result.Message))
		} else {
			failureCount++
			a.logger.Printf("  ✗ %s: %s", result.PackageIdentifier, result.Message)
			resultMessages = append(resultMessages, fmt.Sprintf("✗ %s: %s", result.PackageIdentifier, result.Message))
			if result.Error != nil {
				a.logger.Printf("    Error: %v", result.Error)
			}
		}
	}

	a.logger.Printf("Install command completed: %d/%d successful", successCount, len(results))

	// Report command completion
	success := failureCount == 0
	resultText := fmt.Sprintf("%d/%d successful\n%s", successCount, len(results), strings.Join(resultMessages, "\n"))

	if err := a.client.CompleteCommand(cmd.ID, success, resultText); err != nil {
		a.logger.Printf("Failed to report command completion: %v", err)
	}

	// Trigger update scan to report new state
	go func() {
		time.Sleep(5 * time.Second) // Wait a bit for installations to complete
		a.scanAndReportUpdates()
	}()
}

// executeSyncCommand executes a run_scan command to force an immediate update scan
func (a *Agent) executeSyncCommand(cmd api.Command) {
	a.logger.Println("Executing sync command - triggering immediate update scan")

	// Run scan in a goroutine so we can report command completion
	go func() {
		updates, err := a.scanner.ScanUpdates()
		if err != nil {
			a.logger.Printf("Sync scan failed: %v", err)
			a.client.CompleteCommand(cmd.ID, false, fmt.Sprintf("Scan failed: %v", err))
			return
		}

		a.logger.Printf("Sync scan completed: found %d available updates", len(updates))
		for i, u := range updates {
			a.logger.Printf("  Update %d: %s (%s) - %s -> %s", i+1, u.PackageName, u.PackageIdentifier, u.InstalledVersion, u.AvailableVersion)
		}

		// Report updates to backend
		apiUpdates := winget.ToAPIUpdates(updates)
		a.logger.Printf("Reporting %d updates to backend...", len(apiUpdates))
		req := &api.UpdateReportRequest{
			DeviceID: a.config.DeviceID,
			Updates:  apiUpdates,
		}

		resp, err := a.client.ReportUpdates(req)
		if err != nil {
			a.logger.Printf("Failed to report updates: %v", err)
			a.client.CompleteCommand(cmd.ID, false, fmt.Sprintf("Failed to report updates: %v", err))
			return
		}

		a.logger.Printf("Sync completed: %d updates reported to server (response: %d received)", len(updates), resp.Received)
		resultText := fmt.Sprintf("Scan completed successfully. Found %d available updates.", len(updates))
		a.client.CompleteCommand(cmd.ID, true, resultText)
	}()
}

// register registers the device with the backend
func (a *Agent) register() error {
	hostname, err := os.Hostname()
	if err != nil {
		hostname = "unknown"
	}

	macAddr := metrics.GetPrimaryMAC()
	if macAddr == "" {
		return fmt.Errorf("could not determine MAC address")
	}

	osName, osVersion := getOSInfo()

	req := &api.RegisterRequest{
		Hostname:     hostname,
		OS:           osName,
		OSVersion:    osVersion,
		MACAddress:   macAddr,
		AgentVersion: AgentVersion,
	}

	a.logger.Printf("Registering device: %s (%s)", hostname, macAddr)

	resp, err := a.client.Register(req)
	if err != nil {
		return err
	}

	a.config.DeviceID = resp.DeviceID
	if err := a.config.Save(); err != nil {
		a.logger.Printf("Warning: failed to save config: %v", err)
	}

	a.logger.Printf("Device registered successfully: %s", resp.DeviceID)
	return nil
}

// sendHeartbeat sends a heartbeat to the backend with retry logic
func (a *Agent) sendHeartbeat() {
	sysMetrics, err := metrics.Collect()
	if err != nil {
		a.logger.Printf("Warning: failed to collect metrics: %v", err)
	}

	ipAddr := metrics.GetPrimaryIP()

	req := &api.HeartbeatRequest{
		DeviceID:  a.config.DeviceID,
		IPAddress: ipAddr,
	}

	if sysMetrics != nil {
		req.CPUUsage = &sysMetrics.CPUUsage
		req.MemoryUsage = &sysMetrics.MemoryUsage
		req.DiskUsage = &sysMetrics.DiskUsage
	}

	// Retry logic with exponential backoff
	maxRetries := 3
	retryDelay := 5 * time.Second

	var resp *api.HeartbeatResponse
	var lastErr error

	for attempt := 0; attempt <= maxRetries; attempt++ {
		if attempt > 0 {
			// Exponential backoff: 5s, 10s, 20s
			delay := time.Duration(attempt) * retryDelay
			a.logger.Printf("Retrying heartbeat in %v (attempt %d/%d)...", delay, attempt, maxRetries)
			time.Sleep(delay)
		}

		resp, err = a.client.Heartbeat(req)
		if err == nil {
			// Success
			a.logger.Printf("Heartbeat OK (server time: %s)", resp.ServerTime)
			return
		}

		lastErr = err
		a.logger.Printf("Heartbeat attempt %d failed: %v", attempt+1, err)
	}

	// All retries exhausted
	a.logger.Printf("Heartbeat failed after %d attempts: %v", maxRetries+1, lastErr)
}

// scanAndReportUpdates scans for updates and reports them
func (a *Agent) scanAndReportUpdates() {
	a.logger.Println("Scanning for updates...")

	updates, err := a.scanner.ScanUpdates()
	if err != nil {
		a.logger.Printf("Update scan failed: %v", err)
		return
	}

	a.logger.Printf("Found %d available updates", len(updates))
	for i, u := range updates {
		a.logger.Printf("  Update %d: %s (%s) - %s -> %s", i+1, u.PackageName, u.PackageIdentifier, u.InstalledVersion, u.AvailableVersion)
	}

	apiUpdates := winget.ToAPIUpdates(updates)
	a.logger.Printf("Reporting %d updates to backend...", len(apiUpdates))
	req := &api.UpdateReportRequest{
		DeviceID: a.config.DeviceID,
		Updates:  apiUpdates,
	}

	resp, err := a.client.ReportUpdates(req)
	if err != nil {
		a.logger.Printf("Update report failed: %v", err)
		return
	}

	a.logger.Printf("Update report sent: %d updates received by server (reported %d)", resp.Received, len(updates))
}

// getOSInfo returns OS name and version
func getOSInfo() (string, string) {
	switch runtime.GOOS {
	case "windows":
		return "Windows", getWindowsVersion()
	case "darwin":
		return "macOS", runtime.GOARCH
	case "linux":
		return "Linux", runtime.GOARCH
	default:
		return runtime.GOOS, runtime.GOARCH
	}
}

// getWindowsVersion attempts to get Windows version info
func getWindowsVersion() string {
	// This is a simplified version - in production you'd use
	// golang.org/x/sys/windows to get detailed version info
	return "10/11"
}
