# Build Lunaris Agent Installer Package
# This script builds the agent and creates an installer package

param(
    [string]$ApiUrl = "http://192.168.5.2:3001/api",
    [string]$OutputDir = ""
)

# Get script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if ($OutputDir -eq "") {
    $OutputDir = Join-Path $scriptDir "installer-package"
}
$OutputDir = [System.IO.Path]::GetFullPath($OutputDir)

Write-Host "=== Building Lunaris Agent Installer ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Build the agent
Write-Host "[1/4] Building agent executable..." -ForegroundColor Yellow
$env:GOOS = "windows"
$env:GOARCH = "amd64"
$env:CGO_ENABLED = "0"

go mod tidy
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to download dependencies!" -ForegroundColor Red
    exit 1
}

go build -ldflags="-s -w" -o lunaris-agent.exe ./cmd/lunaris-agent
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Build successful!" -ForegroundColor Green
Write-Host ""

# Step 2: Create installer package directory
Write-Host "[2/4] Creating installer package..." -ForegroundColor Yellow
if (Test-Path $OutputDir) {
    Remove-Item $OutputDir -Recurse -Force
}
New-Item -ItemType Directory -Path $OutputDir | Out-Null
New-Item -ItemType Directory -Path "$OutputDir\agent" | Out-Null
Write-Host "✓ Package directory created" -ForegroundColor Green
Write-Host ""

# Step 3: Copy files
Write-Host "[3/4] Copying files..." -ForegroundColor Yellow
Copy-Item "lunaris-agent.exe" -Destination "$OutputDir\agent\lunaris-agent.exe"
Copy-Item "install.ps1" -Destination "$OutputDir\install.ps1" -ErrorAction SilentlyContinue
Copy-Item "start-agent-background.ps1" -Destination "$OutputDir\agent\start-agent-background.ps1" -ErrorAction SilentlyContinue
Copy-Item "stop-agent.ps1" -Destination "$OutputDir\agent\stop-agent.ps1" -ErrorAction SilentlyContinue
Copy-Item "install-auto-start.ps1" -Destination "$OutputDir\agent\install-auto-start.ps1" -ErrorAction SilentlyContinue

# Create config file with API URL
$configJson = @{
    api_url = $ApiUrl
    heartbeat_interval_sec = 30
    update_scan_interval_min = 5
} | ConvertTo-Json

$configJson | Out-File -FilePath "$OutputDir\agent\config.json" -Encoding UTF8

Write-Host "✓ Files copied" -ForegroundColor Green
Write-Host ""

# Step 4: Create installer script
Write-Host "[4/4] Creating installer script..." -ForegroundColor Yellow
$installerScript = @"
# Lunaris Agent - Network Installer
# This installer configures the agent to connect to: $ApiUrl

Write-Host "=== Lunaris Agent Installer ===" -ForegroundColor Cyan
Write-Host ""

# Check for admin privileges
`$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

# Get installation directory
`$installDir = "C:\Program Files\Lunaris Agent"
`$agentDir = Join-Path `$installDir "agent"

Write-Host "Installation directory: `$installDir" -ForegroundColor Cyan
Write-Host "API Server: $ApiUrl" -ForegroundColor Cyan
Write-Host ""

# Create installation directory
Write-Host "[1/5] Creating installation directory..." -ForegroundColor Yellow
if (-not (Test-Path `$installDir)) {
    New-Item -ItemType Directory -Path `$installDir -Force | Out-Null
}
if (-not (Test-Path `$agentDir)) {
    New-Item -ItemType Directory -Path `$agentDir -Force | Out-Null
}
Write-Host "✓ Directory created" -ForegroundColor Green
Write-Host ""

# Copy agent files
Write-Host "[2/5] Copying agent files..." -ForegroundColor Yellow
`$scriptPath = Split-Path -Parent `$MyInvocation.MyCommand.Path
Copy-Item (Join-Path `$scriptPath "agent\*") -Destination `$agentDir -Recurse -Force
Write-Host "✓ Files copied" -ForegroundColor Green
Write-Host ""

# Create config directory and copy config
Write-Host "[3/5] Configuring agent..." -ForegroundColor Yellow
`$configDir = "C:\ProgramData\LunarisAgent"
if (-not (Test-Path `$configDir)) {
    New-Item -ItemType Directory -Path `$configDir -Force | Out-Null
}
Copy-Item (Join-Path `$scriptPath "agent\config.json") -Destination (Join-Path `$configDir "config.json") -Force
Write-Host "✓ Configuration created" -ForegroundColor Green
Write-Host ""

# Stop existing agent if running
Write-Host "[4/5] Stopping existing agent..." -ForegroundColor Yellow
`$process = Get-Process -Name "lunaris-agent" -ErrorAction SilentlyContinue
if (`$process) {
    Stop-Process -Name "lunaris-agent" -Force
    Write-Host "  Stopped existing agent" -ForegroundColor Gray
    Start-Sleep -Seconds 2
}
if (-not `$process) {
    Write-Host "  No existing agent running" -ForegroundColor Gray
}
Write-Host ""

# Start agent
Write-Host "[5/5] Starting agent..." -ForegroundColor Yellow
`$agentExe = Join-Path `$agentDir "lunaris-agent.exe"
Start-Process -FilePath `$agentExe -WindowStyle Hidden
Start-Sleep -Seconds 3

`$process = Get-Process -Name "lunaris-agent" -ErrorAction SilentlyContinue
if (`$process) {
    Write-Host "✓ Agent started (PID: `$(`$process.Id))" -ForegroundColor Green
}
if (-not `$process) {
    Write-Host "⚠ Agent may not have started. Check manually." -ForegroundColor Yellow
}
Write-Host ""

# Set up auto-start (optional)
Write-Host "Setting up auto-start..." -ForegroundColor Yellow
`$taskName = "Lunaris Agent"
`$startScript = Join-Path `$agentDir "start-agent-background.ps1"

`$existingTask = Get-ScheduledTask -TaskName `$taskName -ErrorAction SilentlyContinue
if (`$existingTask) {
    Unregister-ScheduledTask -TaskName `$taskName -Confirm:`$false
}

`$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument ('-NoProfile -ExecutionPolicy Bypass -File "' + `$startScript + '"')
`$trigger = New-ScheduledTaskTrigger -AtLogOn
`$principal = New-ScheduledTaskPrincipal -UserId `$env:USERNAME -LogonType Interactive -RunLevel Limited
`$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable:`$false

Register-ScheduledTask -TaskName `$taskName -Action `$action -Trigger `$trigger -Principal `$principal -Settings `$settings -Description "Lunaris Agent - Starts automatically on user login" | Out-Null
Write-Host "✓ Auto-start configured" -ForegroundColor Green
Write-Host ""

Write-Host "=== Installation Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Agent installed to: `$agentDir" -ForegroundColor Cyan
Write-Host "Configuration: `$configDir\config.json" -ForegroundColor Cyan
Write-Host "API Server: $ApiUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "The agent will automatically start on login." -ForegroundColor Yellow
Write-Host "Check the web console at http://192.168.5.2:3000 to see this device." -ForegroundColor Yellow
Write-Host ""
"@

$installerScript | Out-File -FilePath "$OutputDir\install.ps1" -Encoding UTF8

# Create README
$readme = @"
# Lunaris Agent Installer Package

## Installation

1. Extract this package to a temporary location
2. Right-click `install.ps1` and select "Run with PowerShell"
3. The installer will:
   - Copy agent files to `C:\Program Files\Lunaris Agent`
   - Configure the agent to connect to: $ApiUrl
   - Start the agent
   - Set up auto-start on login

## Manual Installation

If you prefer to install manually:

1. Copy the `agent` folder to `C:\Program Files\Lunaris Agent\agent`
2. Copy `agent\config.json` to `C:\ProgramData\LunarisAgent\config.json`
3. Run `agent\lunaris-agent.exe` to start the agent

## Configuration

The agent is configured to connect to: $ApiUrl

To change the API URL, edit: `C:\ProgramData\LunarisAgent\config.json`

## Management

- **Start agent**: Run `agent\lunaris-agent.exe` or use `agent\start-agent-background.ps1`
- **Stop agent**: Use `agent\stop-agent.ps1` or Task Manager
- **View logs**: Check Windows Event Viewer (if running as service) or console output

## Troubleshooting

- **Agent not connecting**: Verify the API server is accessible at $ApiUrl
- **Agent not starting**: Check Windows Event Viewer for errors
- **No updates detected**: Ensure WinGet is installed and accessible

## Files

- `agent\lunaris-agent.exe` - Main agent executable
- `agent\config.json` - Agent configuration
- `agent\start-agent-background.ps1` - Start script
- `agent\stop-agent.ps1` - Stop script
- `agent\install-auto-start.ps1` - Auto-start setup script
"@

$readme | Out-File -FilePath "$OutputDir\README.txt" -Encoding UTF8

Write-Host "✓ Installer script created" -ForegroundColor Green
Write-Host ""

# Create ZIP archive
Write-Host "Creating ZIP archive..." -ForegroundColor Yellow
$zipPath = Join-Path $scriptDir "Lunaris-Agent-Installer.zip"
if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($OutputDir, $zipPath)

Write-Host "✓ ZIP archive created: $zipPath" -ForegroundColor Green
Write-Host ""

Write-Host "=== Build Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Package location: $OutputDir" -ForegroundColor Cyan
Write-Host "ZIP archive: $zipPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "To distribute:" -ForegroundColor Yellow
Write-Host "  1. Share the ZIP file or the installer-package folder" -ForegroundColor White
Write-Host "  2. Extract on the target machine" -ForegroundColor White
Write-Host "  3. Run install.ps1 (right-click -> Run with PowerShell)" -ForegroundColor White
Write-Host ""
Write-Host "The agent will connect to: $ApiUrl" -ForegroundColor Cyan
Write-Host ""

