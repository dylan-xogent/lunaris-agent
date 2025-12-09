# Lunaris Agent - Installation Guide

## Quick Start (Automated)

### Prerequisites

1. **Install Go** (if not already installed):
   - Download from: https://go.dev/dl/
   - Recommended: Go 1.21 or later
   - After install, restart your terminal

2. **Ensure Docker containers are running**:
   ```powershell
   docker-compose up -d
   ```

### Build and Install

Open **PowerShell as Administrator** and run:

```powershell
# Navigate to agent directory
cd "c:\Users\DylanJohnston\OneDrive - XOGENT INC\Desktop\Lunaris-Agent\services\agent"

# Build the agent
.\build.ps1

# Install and start the service
.\install-and-start.ps1
```

That's it! The agent will:
- Download dependencies
- Build the executable
- Stop old version (if exists)
- Install as Windows service
- Start the service
- Connect to WebSocket server

---

## Manual Installation

If you prefer manual control:

### 1. Build the Agent

```powershell
cd services/agent
go mod tidy
go build -o lunaris-agent.exe ./cmd/lunaris-agent
```

### 2. Stop Existing Service (if running)

```powershell
.\lunaris-agent.exe -stop
```

### 3. Uninstall Old Version (if exists)

```powershell
.\lunaris-agent.exe -uninstall
```

### 4. Install New Version

```powershell
.\lunaris-agent.exe -install
```

### 5. Start the Service

```powershell
.\lunaris-agent.exe -start
```

---

## Verification

### Check Service Status

```powershell
Get-Service -Name "LunarisAgentService"
```

Expected output:
```
Status   Name                   DisplayName
------   ----                   -----------
Running  LunarisAgentService    Lunaris Agent Service
```

### Check Web Console

1. Open browser: http://localhost:3000
2. Navigate to "Devices" page
3. Your device should appear within 30 seconds

### Check Logs

Service logs are written to:
```
C:\ProgramData\LunarisAgent\agent.log
```

View real-time logs:
```powershell
Get-Content "C:\ProgramData\LunarisAgent\agent.log" -Wait -Tail 20
```

---

## Testing WebSocket Features

### Test Remote Installation

1. **Open Web Console**: http://localhost:3000
2. **Navigate to your device**: Devices → [Your Device]
3. **View available updates**: Should show packages like "Anthropic.Claude"
4. **Click "Install"**: On any update
5. **Confirm**: Accept the confirmation dialog
6. **Watch the logs**:

```powershell
Get-Content "C:\ProgramData\LunarisAgent\agent.log" -Wait -Tail 50
```

Expected log output:
```
[WebSocket] Received install_updates event
Executing install command abc-123 for 1 package(s)
  ✓ Anthropic.Claude: Successfully installed
Install command abc-123 completed: 1/1 successful
Scanning for updates...
Update report sent: 0 updates received by server
```

---

## Troubleshooting

### Go Not Found

**Error**: `go : The term 'go' is not recognized...`

**Solution**:
1. Install Go from https://go.dev/dl/
2. Restart PowerShell
3. Verify: `go version`

### Permission Denied

**Error**: `Access is denied` or `requires administrator privileges`

**Solution**:
1. Close PowerShell
2. Right-click PowerShell
3. Select "Run as Administrator"
4. Try again

### Service Won't Start

**Error**: Service fails to start

**Solution**:
1. Check if port 3001 is reachable:
   ```powershell
   Test-NetConnection -ComputerName localhost -Port 3001
   ```
2. Verify Docker containers are running:
   ```powershell
   docker-compose ps
   ```
3. Check configuration:
   ```powershell
   Get-Content "C:\ProgramData\LunarisAgent\config.json"
   ```

### WebSocket Not Connecting

**Error**: `Warning: WebSocket connection failed`

**Solution**:
1. Check backend logs:
   ```powershell
   docker-compose logs api --tail=20
   ```
2. Verify WebSocket gateway initialized
3. Check firewall settings
4. Ensure API URL is correct in config

### Device Not Appearing in Console

**Solution**:
1. Check service is running:
   ```powershell
   Get-Service LunarisAgentService
   ```
2. Check logs for errors:
   ```powershell
   Get-Content "C:\ProgramData\LunarisAgent\agent.log" -Tail 50
   ```
3. Verify heartbeats are being sent (should see every 30 seconds)

---

## Uninstalling

To completely remove the agent:

```powershell
# Stop service
.\lunaris-agent.exe -stop

# Uninstall service
.\lunaris-agent.exe -uninstall

# Remove config directory (optional)
Remove-Item -Path "C:\ProgramData\LunarisAgent" -Recurse -Force
```

---

## Running in Console Mode (Debug)

For testing without installing as service:

```powershell
# Run in foreground
.\lunaris-agent.exe

# Or with custom API URL
.\lunaris-agent.exe -api http://localhost:3001/api
```

Press `Ctrl+C` to stop.

---

## Next Steps

Once the agent is installed and running:

1. ✅ **View Dashboard**: http://localhost:3000
2. ✅ **Check Device Details**: Click on your device name
3. ✅ **View System Metrics**: See CPU, Memory, Disk usage
4. ✅ **Test Remote Install**: Click "Install" on an update
5. ✅ **Watch Real-time Updates**: See last seen time update automatically

The Lunaris Agent is now fully operational with WebSocket remote management! 🚀
