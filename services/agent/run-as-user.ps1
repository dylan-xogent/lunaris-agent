# Lunaris Agent - Run as User (No Admin Required)
# This script runs the agent as a regular user process without requiring admin or service installation

Write-Host "=== Lunaris Agent - User Mode ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Running agent in user mode (no service, no admin required)" -ForegroundColor Green
Write-Host ""

# Get current directory
$agentDir = $PSScriptRoot
Set-Location $agentDir

# Check if agent exe exists
$agentExe = Join-Path $agentDir "lunaris-agent.exe"
if (-not (Test-Path $agentExe)) {
    Write-Host "ERROR: lunaris-agent.exe not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please build the agent first:" -ForegroundColor Yellow
    Write-Host "  go build -o lunaris-agent.exe ./cmd/lunaris-agent" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "Starting agent in user mode..." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

# Run agent in user mode
& $agentExe -user

