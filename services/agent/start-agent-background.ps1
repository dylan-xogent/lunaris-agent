# Lunaris Agent - Start as Background Application
# This runs the agent as a background process in the user context (no admin needed)

Write-Host "=== Starting Lunaris Agent (Background Mode) ===" -ForegroundColor Cyan
Write-Host ""

$agentDir = $PSScriptRoot
Set-Location $agentDir

$agentExe = Join-Path $agentDir "lunaris-agent.exe"
if (-not (Test-Path $agentExe)) {
    Write-Host "ERROR: lunaris-agent.exe not found!" -ForegroundColor Red
    Write-Host "Please build the agent first: go build -o lunaris-agent.exe ./cmd/lunaris-agent" -ForegroundColor Yellow
    exit 1
}

# Check if already running
$process = Get-Process -Name "lunaris-agent" -ErrorAction SilentlyContinue
if ($process) {
    Write-Host "Agent is already running (PID: $($process.Id))" -ForegroundColor Yellow
    Write-Host "To stop it, run: Stop-Process -Name lunaris-agent" -ForegroundColor Gray
    exit 0
}

Write-Host "Starting agent in background..." -ForegroundColor Green
Write-Host "The agent will run in your user context and can access winget." -ForegroundColor Cyan
Write-Host ""

# Start agent as background process
Start-Process -FilePath $agentExe -WindowStyle Hidden

Start-Sleep -Seconds 2

$process = Get-Process -Name "lunaris-agent" -ErrorAction SilentlyContinue
if ($process) {
    Write-Host "✓ Agent started successfully (PID: $($process.Id))" -ForegroundColor Green
    Write-Host ""
    Write-Host "The agent is now running in the background." -ForegroundColor Cyan
    Write-Host "It will continue running until you log out or stop it." -ForegroundColor Gray
    Write-Host ""
    Write-Host "To stop: Stop-Process -Name lunaris-agent" -ForegroundColor Yellow
    Write-Host "To view: Get-Process -Name lunaris-agent" -ForegroundColor Yellow
} else {
    Write-Host "✗ Failed to start agent" -ForegroundColor Red
    exit 1
}

