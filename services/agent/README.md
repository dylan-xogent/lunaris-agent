# Lunaris Agent

Windows agent that monitors for available updates and reports to the Lunaris console.

## Features

- **Device Registration** - Auto-registers with backend using hostname, MAC address, OS info
- **Heartbeat** - Sends status every 30 seconds with CPU/Memory/Disk metrics
- **Update Scanning** - Scans WinGet for available updates every 5 minutes
- **Windows Service** - Can run as a Windows service for production deployments
- **Configuration** - Persistent config stored in `C:\ProgramData\LunarisAgent\config.json`

## Requirements

- Go 1.21 or later
- Windows 10/11 (for WinGet support)
- WinGet CLI installed

## Building

```bash
cd services/agent

# Download dependencies
go mod tidy

# Build for Windows
go build -o lunaris-agent.exe ./cmd/lunaris-agent

# Build with version info (optional)
go build -ldflags="-X main.version=1.0.0" -o lunaris-agent.exe ./cmd/lunaris-agent
```

## Usage

### Console Mode (Development/Testing)

```bash
# Run with default settings (API at localhost:3001)
.\lunaris-agent.exe

# Run with custom API URL
.\lunaris-agent.exe -api http://your-server:3001/api

# Show version
.\lunaris-agent.exe -version
```

### Windows Service Mode (Production)

```powershell
# Install service (run as Administrator)
.\lunaris-agent.exe -install

# Start service
.\lunaris-agent.exe -start
# Or: Start-Service LunarisAgentService

# Stop service
.\lunaris-agent.exe -stop
# Or: Stop-Service LunarisAgentService

# Uninstall service
.\lunaris-agent.exe -uninstall

# Debug mode (simulates service in console)
.\lunaris-agent.exe -debug
```

## Configuration

The agent stores its configuration in `C:\ProgramData\LunarisAgent\config.json`:

```json
{
  "api_url": "http://localhost:3001/api",
  "device_id": "auto-generated-uuid",
  "heartbeat_interval_sec": 30,
  "update_scan_interval_min": 5
}
```

### Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `api_url` | `http://localhost:3001/api` | Backend API endpoint |
| `device_id` | (auto) | Device UUID assigned by backend |
| `heartbeat_interval_sec` | 30 | Seconds between heartbeats |
| `update_scan_interval_min` | 5 | Minutes between update scans |
| `enrollment_secret` | (none) | Optional enrollment secret |

## API Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/agent/register` | POST | Register device |
| `/api/agent/heartbeat` | POST | Send heartbeat with metrics |
| `/api/agent/update-report` | POST | Report available updates |

## Logs

- **Console mode**: Logs to stdout
- **Service mode**: Logs to Windows Event Log (Application log, source: LunarisAgentService)

View service logs:
```powershell
Get-EventLog -LogName Application -Source LunarisAgentService -Newest 50
```

## Development

### Project Structure

```
services/agent/
├── cmd/
│   └── lunaris-agent/
│       └── main.go           # Entry point
├── internal/
│   ├── agent/
│   │   └── agent.go          # Main agent logic
│   ├── api/
│   │   └── client.go         # API client
│   ├── config/
│   │   └── config.go         # Configuration
│   ├── metrics/
│   │   └── collector.go      # System metrics
│   ├── service/
│   │   ├── service_windows.go # Windows service
│   │   └── service_other.go   # Non-Windows stub
│   └── winget/
│       └── scanner.go        # WinGet scanner
├── go.mod
└── README.md
```

### Testing

```bash
# Run tests
go test ./...

# Run with coverage
go test -cover ./...
```

## Troubleshooting

### Agent fails to register
- Check that the API server is running
- Verify the API URL is correct
- Ensure network connectivity

### No updates found
- Verify WinGet is installed: `winget --version`
- Run `winget upgrade` manually to check for updates
- Check Windows Update settings

### Service won't start
- Check Event Log for errors
- Verify config file is valid JSON
- Ensure agent has network access

