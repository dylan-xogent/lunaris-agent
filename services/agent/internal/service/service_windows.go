//go:build windows

package service

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"golang.org/x/sys/windows/svc"
	"golang.org/x/sys/windows/svc/debug"
	"golang.org/x/sys/windows/svc/eventlog"
	"golang.org/x/sys/windows/svc/mgr"

	"github.com/lunaris/agent/internal/agent"
	"github.com/lunaris/agent/internal/config"
)

const ServiceName = "LunarisAgentService"
const ServiceDisplayName = "Lunaris Agent Service"
const ServiceDescription = "Monitors Windows updates and reports to Lunaris console"

var elog debug.Log

// eventLogLogger adapts debug.Log to agent.Logger interface
type eventLogLogger struct {
	log debug.Log
}

func (e *eventLogLogger) Printf(format string, v ...interface{}) {
	msg := fmt.Sprintf(format, v...)
	e.log.Info(1, msg)
}

func (e *eventLogLogger) Println(v ...interface{}) {
	msg := fmt.Sprintln(v...)
	e.log.Info(1, strings.TrimSpace(msg))
}

// lunarisService implements svc.Handler
type lunarisService struct {
	cfg *config.Config
}

// Execute is the main service entry point
func (s *lunarisService) Execute(args []string, r <-chan svc.ChangeRequest, changes chan<- svc.Status) (ssec bool, errno uint32) {
	const cmdsAccepted = svc.AcceptStop | svc.AcceptShutdown

	changes <- svc.Status{State: svc.StartPending}
	elog.Info(1, fmt.Sprintf("Starting %s", ServiceName))

	// Create agent with event log logger
	eventLogger := &eventLogLogger{log: elog}
	agentInstance := agent.NewWithLogger(s.cfg, eventLogger)

	// Create context for graceful shutdown
	ctx, cancel := context.WithCancel(context.Background())

	// Start agent in goroutine
	agentDone := make(chan error, 1)
	go func() {
		agentDone <- agentInstance.Run(ctx)
	}()

	changes <- svc.Status{State: svc.Running, Accepts: cmdsAccepted}
	elog.Info(1, fmt.Sprintf("%s is now running", ServiceName))

loop:
	for {
		select {
		case err := <-agentDone:
			if err != nil {
				elog.Error(1, fmt.Sprintf("Agent error: %v", err))
			}
			break loop

		case c := <-r:
			switch c.Cmd {
			case svc.Interrogate:
				changes <- c.CurrentStatus
				time.Sleep(100 * time.Millisecond)
				changes <- c.CurrentStatus

			case svc.Stop, svc.Shutdown:
				elog.Info(1, fmt.Sprintf("Received stop/shutdown command"))
				cancel()
				// Wait for agent to stop
				select {
				case <-agentDone:
				case <-time.After(30 * time.Second):
					elog.Warning(1, "Agent did not stop in time")
				}
				break loop

			default:
				elog.Error(1, fmt.Sprintf("Unexpected control request #%d", c))
			}
		}
	}

	changes <- svc.Status{State: svc.StopPending}
	elog.Info(1, fmt.Sprintf("%s stopped", ServiceName))
	return
}

// RunService runs as a Windows service
func RunService(cfg *config.Config, isDebug bool) error {
	var err error
	if isDebug {
		elog = debug.New(ServiceName)
	} else {
		elog, err = eventlog.Open(ServiceName)
		if err != nil {
			return fmt.Errorf("failed to open event log: %w", err)
		}
	}
	defer elog.Close()

	elog.Info(1, fmt.Sprintf("Starting %s service", ServiceName))

	run := svc.Run
	if isDebug {
		run = debug.Run
	}

	err = run(ServiceName, &lunarisService{cfg: cfg})
	if err != nil {
		elog.Error(1, fmt.Sprintf("Service failed: %v", err))
		return err
	}

	elog.Info(1, fmt.Sprintf("%s service stopped", ServiceName))
	return nil
}

// IsWindowsService detects if running as a Windows service
func IsWindowsService() bool {
	isService, err := svc.IsWindowsService()
	if err != nil {
		return false
	}
	return isService
}

// InstallService installs the Windows service to run as the current user
func InstallService(exePath string) error {
	m, err := mgr.Connect()
	if err != nil {
		return fmt.Errorf("failed to connect to service manager: %w", err)
	}
	defer m.Disconnect()

	s, err := m.OpenService(ServiceName)
	if err == nil {
		s.Close()
		return fmt.Errorf("service %s already exists", ServiceName)
	}

	s, err = m.CreateService(ServiceName, exePath, mgr.Config{
		DisplayName: ServiceDisplayName,
		Description: ServiceDescription,
		StartType:   mgr.StartAutomatic,
	})
	if err != nil {
		return fmt.Errorf("failed to create service: %w", err)
	}
	defer s.Close()

	// Get current user info for logging
	currentUser := os.Getenv("USERNAME")
	userDomain := os.Getenv("USERDOMAIN")
	var serviceUser string
	if userDomain != "" && userDomain != "." {
		serviceUser = fmt.Sprintf("%s\\%s", userDomain, currentUser)
	} else {
		serviceUser = fmt.Sprintf(".\\%s", currentUser)
	}

	// Note: Service is created as LocalSystem by default
	// To run as user, configure it after installation using:
	// sc.exe config LunarisAgentService obj= <user> password= <password>
	// Or use the configure-service-as-user.ps1 script
	log.Printf("Service %s installed successfully", ServiceName)
	log.Printf("To run as user account, configure it to run as: %s", serviceUser)

	// Set up event log
	err = eventlog.InstallAsEventCreate(ServiceName, eventlog.Error|eventlog.Warning|eventlog.Info)
	if err != nil {
		s.Delete()
		return fmt.Errorf("failed to setup event log: %w", err)
	}

	return nil
}

// UninstallService removes the Windows service
func UninstallService() error {
	m, err := mgr.Connect()
	if err != nil {
		return fmt.Errorf("failed to connect to service manager: %w", err)
	}
	defer m.Disconnect()

	s, err := m.OpenService(ServiceName)
	if err != nil {
		return fmt.Errorf("service %s not found: %w", ServiceName, err)
	}
	defer s.Close()

	err = s.Delete()
	if err != nil {
		return fmt.Errorf("failed to delete service: %w", err)
	}

	err = eventlog.Remove(ServiceName)
	if err != nil {
		log.Printf("Warning: failed to remove event log: %v", err)
	}

	log.Printf("Service %s uninstalled successfully", ServiceName)
	return nil
}

// StartService starts the Windows service
func StartService() error {
	m, err := mgr.Connect()
	if err != nil {
		return fmt.Errorf("failed to connect to service manager: %w", err)
	}
	defer m.Disconnect()

	s, err := m.OpenService(ServiceName)
	if err != nil {
		return fmt.Errorf("failed to open service: %w", err)
	}
	defer s.Close()

	err = s.Start()
	if err != nil {
		return fmt.Errorf("failed to start service: %w", err)
	}

	log.Printf("Service %s started", ServiceName)
	return nil
}

// StopService stops the Windows service
func StopService() error {
	m, err := mgr.Connect()
	if err != nil {
		return fmt.Errorf("failed to connect to service manager: %w", err)
	}
	defer m.Disconnect()

	s, err := m.OpenService(ServiceName)
	if err != nil {
		return fmt.Errorf("failed to open service: %w", err)
	}
	defer s.Close()

	status, err := s.Control(svc.Stop)
	if err != nil {
		return fmt.Errorf("failed to stop service: %w", err)
	}

	timeout := time.Now().Add(30 * time.Second)
	for status.State != svc.Stopped {
		if time.Now().After(timeout) {
			return fmt.Errorf("timeout waiting for service to stop")
		}
		time.Sleep(500 * time.Millisecond)
		status, err = s.Query()
		if err != nil {
			return fmt.Errorf("failed to query service: %w", err)
		}
	}

	log.Printf("Service %s stopped", ServiceName)
	return nil
}

// GetExecutablePath returns the path to the current executable
func GetExecutablePath() (string, error) {
	exe, err := os.Executable()
	if err != nil {
		return "", err
	}
	return filepath.Abs(exe)
}

