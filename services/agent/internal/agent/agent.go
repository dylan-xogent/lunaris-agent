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

// Agent is the main agent controller
type Agent struct {
	config    *config.Config
	client    *api.Client
	scanner   *winget.Scanner
	installer *winget.Installer
	logger    *log.Logger
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

// sendHeartbeat sends a heartbeat to the backend
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

	resp, err := a.client.Heartbeat(req)
	if err != nil {
		a.logger.Printf("Heartbeat failed: %v", err)
		return
	}

	a.logger.Printf("Heartbeat OK (server time: %s)", resp.ServerTime)
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

	req := &api.UpdateReportRequest{
		DeviceID: a.config.DeviceID,
		Updates:  winget.ToAPIUpdates(updates),
	}

	resp, err := a.client.ReportUpdates(req)
	if err != nil {
		a.logger.Printf("Update report failed: %v", err)
		return
	}

	a.logger.Printf("Update report sent: %d updates received by server", resp.Received)
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
