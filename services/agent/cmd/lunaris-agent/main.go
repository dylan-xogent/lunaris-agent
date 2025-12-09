package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/lunaris/agent/internal/agent"
	"github.com/lunaris/agent/internal/config"
	"github.com/lunaris/agent/internal/service"
)

func main() {
	// Parse command line flags
	apiURL := flag.String("api", "", "API server URL (overrides config)")
	showVersion := flag.Bool("version", false, "Show version and exit")
	
	// Service management flags
	installService := flag.Bool("install", false, "Install as Windows service")
	uninstallService := flag.Bool("uninstall", false, "Uninstall Windows service")
	startService := flag.Bool("start", false, "Start the Windows service")
	stopService := flag.Bool("stop", false, "Stop the Windows service")
	debugService := flag.Bool("debug", false, "Run in debug mode (service simulation)")
	
	flag.Parse()

	if *showVersion {
		fmt.Printf("Lunaris Agent v%s\n", agent.AgentVersion)
		os.Exit(0)
	}

	// Handle service management commands
	if *installService {
		exePath, err := service.GetExecutablePath()
		if err != nil {
			log.Fatalf("Failed to get executable path: %v", err)
		}
		if err := service.InstallService(exePath); err != nil {
			log.Fatalf("Failed to install service: %v", err)
		}
		return
	}

	if *uninstallService {
		if err := service.UninstallService(); err != nil {
			log.Fatalf("Failed to uninstall service: %v", err)
		}
		return
	}

	if *startService {
		if err := service.StartService(); err != nil {
			log.Fatalf("Failed to start service: %v", err)
		}
		return
	}

	if *stopService {
		if err := service.StopService(); err != nil {
			log.Fatalf("Failed to stop service: %v", err)
		}
		return
	}

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Override API URL if provided
	if *apiURL != "" {
		cfg.APIURL = *apiURL
	}

	// Check if running as Windows service
	if service.IsWindowsService() {
		if err := service.RunService(cfg, false); err != nil {
			log.Fatalf("Service error: %v", err)
		}
		return
	}

	// Debug service mode
	if *debugService {
		if err := service.RunService(cfg, true); err != nil {
			log.Fatalf("Service debug error: %v", err)
		}
		return
	}

	// Run as console application
	runConsole(cfg)
}

// runConsole runs the agent as a console application
func runConsole(cfg *config.Config) {
	// Create agent
	agentInstance := agent.New(cfg)

	// Setup graceful shutdown
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-sigChan
		log.Println("Received shutdown signal")
		cancel()
	}()

	// Run agent
	if err := agentInstance.Run(ctx); err != nil {
		log.Fatalf("Agent error: %v", err)
	}

	log.Println("Agent stopped")
}
