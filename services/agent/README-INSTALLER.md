# Lunaris Agent - Complete Installer

## Quick Start

Run the installer:
```powershell
.\install.ps1
```

That's it! The installer will:
- ✅ Check Go installation
- ✅ Build the agent
- ✅ Detect if you have admin privileges
- ✅ Install as background app (recommended) or service
- ✅ Set up auto-start on login
- ✅ Configure everything automatically

## Installation Modes

### Background Application (Recommended)
- **No admin needed** to run
- Runs in your user context (can access winget)
- No service configuration issues
- Auto-starts on login via scheduled task

### Windows Service
- Requires admin for installation
- Needs additional configuration to run as user account
- More complex but runs even when logged out

## Command Line Options

```powershell
# Auto-detect mode (recommended)
.\install.ps1

# Force background mode
.\install.ps1 -Background

# Force service mode (requires admin)
.\install.ps1 -Service

# Enable auto-start explicitly
.\install.ps1 -AutoStart
```

## After Installation

1. Wait ~30 seconds for the agent to register
2. Open the web console
3. Click "Sync Now" on your device
4. Verify updates are detected

## Management

### Background Mode
```powershell
# Start agent
.\start-agent-background.ps1

# Stop agent
.\stop-agent.ps1

# Check if running
Get-Process -Name lunaris-agent
```

### Service Mode
```powershell
# Start service
Start-Service LunarisAgentService

# Stop service
Stop-Service LunarisAgentService

# Configure to run as user (after installation)
.\configure-service-as-user.ps1
```

## Troubleshooting

**Agent can't access winget:**
- If using service mode, run `.\configure-service-as-user.ps1`
- If using background mode, ensure you're logged in as the user

**Agent not starting:**
- Check if already running: `Get-Process -Name lunaris-agent`
- Check service status: `Get-Service LunarisAgentService`
- Check logs in Event Viewer (for service) or console output (for background)

**Build fails:**
- Ensure Go is installed: `go version`
- Ensure you're in the agent directory
- Run `go mod tidy` manually if needed

