# Lunaris Agent - Windows Update Monitor

The Lunaris Agent is a Windows service that monitors available updates using WinGet and reports them to the Lunaris backend platform. It now includes **WebSocket support for remote update installation**.

## Features

- ✅ **Automatic Device Registration**: Self-registers with the backend using MAC address
- ✅ **Update Scanning**: Scans for Windows updates using WinGet
- ✅ **Heartbeat Monitoring**: Regular heartbeats with system metrics (CPU, Memory, Disk)
- ✅ **WebSocket Remote Commands**: Receives and executes install commands from the console
- ✅ **Automatic Reconnection**: Reconnects WebSocket if connection drops
- ✅ **Windows Service**: Can run as a background Windows service
- ✅ **Update Installation**: Executes `winget install` commands remotely

## Prerequisites

- Windows 10/11
- WinGet installed (comes with Windows 11, or install from Microsoft Store)
- Go 1.21+ for building

## Building

### Build the Agent

```powershell
cd services/agent
go mod tidy
go build -o lunaris-agent.exe ./cmd/lunaris-agent
```

## Usage

### Run as Console Application

```powershell
# Run with default config
.\lunaris-agent.exe

# Override API URL
.\lunaris-agent.exe -api http://localhost:3001/api
```

### Install as Windows Service

```powershell
# Install and start service (requires admin)
.\lunaris-agent.exe -install
.\lunaris-agent.exe -start
```

## Remote Update Installation

The agent connects to the backend WebSocket server at startup and listens for `install_updates` commands.

### Example Install Flow

```
[WebSocket] Connected to server
[WebSocket] Received install_updates event
Executing install command abc-123 for 1 package(s)
  ✓ Anthropic.Claude: Successfully installed
Install command abc-123 completed: 1/1 successful
```

## Configuration

Configuration file: `C:\ProgramData\LunarisAgent\config.json`

```json
{
  "api_url": "http://localhost:3001/api",
  "device_id": "auto-generated",
  "heartbeat_interval_sec": 30,
  "update_scan_interval_min": 5
}
```
