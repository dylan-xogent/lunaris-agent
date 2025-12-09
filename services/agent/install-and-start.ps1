# Lunaris Agent Installation Script
# Stops, uninstalls, reinstalls, and starts the agent service

Write-Host "=== Lunaris Agent Installation Script ===" -ForegroundColor Cyan
Write-Host ""

# Check for admin privileges
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: This script requires administrator privileges!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please run PowerShell as Administrator and try again:" -ForegroundColor Yellow
    Write-Host "  Right-click PowerShell -> Run as Administrator" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Get agent path
$agentDir = $PSScriptRoot
$agentExe = Join-Path $agentDir "lunaris-agent.exe"

# Check if agent exe exists
if (-not (Test-Path $agentExe)) {
    Write-Host "ERROR: lunaris-agent.exe not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please build the agent first:" -ForegroundColor Yellow
    Write-Host "  .\build.ps1" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Step 1: Stop existing service
Write-Host "[1/4] Stopping existing service..." -ForegroundColor Yellow
& $agentExe -stop 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Service stopped successfully" -ForegroundColor Green
} else {
    Write-Host "Service not running (this is OK if first install)" -ForegroundColor Gray
}
Start-Sleep -Seconds 2

# Step 2: Uninstall existing service
Write-Host ""
Write-Host "[2/4] Uninstalling existing service..." -ForegroundColor Yellow
& $agentExe -uninstall 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Service uninstalled successfully" -ForegroundColor Green
} else {
    Write-Host "Service not installed (this is OK if first install)" -ForegroundColor Gray
}
Start-Sleep -Seconds 2

# Step 3: Install new service
Write-Host ""
Write-Host "[3/4] Installing new service..." -ForegroundColor Yellow
& $agentExe -install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install service!" -ForegroundColor Red
    exit 1
}
Write-Host "Service installed successfully" -ForegroundColor Green
Start-Sleep -Seconds 2

# Step 4: Start service
Write-Host ""
Write-Host "[4/4] Starting service..." -ForegroundColor Yellow
& $agentExe -start
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to start service!" -ForegroundColor Red
    exit 1
}
Write-Host "Service started successfully" -ForegroundColor Green

Write-Host ""
Write-Host "=== Installation Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "The Lunaris Agent is now running as a Windows service!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Verify installation:" -ForegroundColor Yellow
Write-Host "  1. Check Windows Services: services.msc" -ForegroundColor White
Write-Host "  2. Look for 'LunarisAgentService'" -ForegroundColor White
Write-Host "  3. Check logs in: C:\ProgramData\LunarisAgent\" -ForegroundColor White
Write-Host "  4. View web console: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "The agent should appear in the console within 30 seconds!" -ForegroundColor Cyan
Write-Host ""
