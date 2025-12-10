# Lunaris Agent - Install Service as User Account
# This script installs the service to run as the current user (requires admin for installation only)

Write-Host "=== Lunaris Agent - Install Service as User ===" -ForegroundColor Cyan
Write-Host ""

# Check for admin privileges
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: Installing a service requires administrator privileges!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please run PowerShell as Administrator and try again:" -ForegroundColor Yellow
    Write-Host "  Right-click PowerShell -> Run as Administrator" -ForegroundColor White
    Write-Host ""
    Write-Host "OR use run-as-user.ps1 to run without a service (no admin needed)" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

Write-Host "✓ Running with administrator privileges" -ForegroundColor Green
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

# Get current user info
$currentUser = $env:USERNAME
$userDomain = $env:USERDOMAIN
if ($userDomain -and $userDomain -ne ".") {
    $fullUserName = "$userDomain\$currentUser"
}
if (-not $fullUserName) {
    $fullUserName = ".\$currentUser"
}

Write-Host "Current user: $fullUserName" -ForegroundColor Cyan
Write-Host "Service will be configured to run as this user account" -ForegroundColor Cyan
Write-Host ""

# Step 1: Stop existing service
Write-Host "[1/3] Stopping existing service..." -ForegroundColor Yellow
$service = Get-Service -Name "LunarisAgentService" -ErrorAction SilentlyContinue
$serviceRunning = $false
if ($service) {
    $serviceRunning = ($service.Status -eq 'Running')
}
if ($serviceRunning) {
    Stop-Service -Name "LunarisAgentService" -Force
    Write-Host "✓ Service stopped" -ForegroundColor Green
    Start-Sleep -Seconds 2
}
if (-not $serviceRunning -and $service) {
    Write-Host "  Service not running" -ForegroundColor Gray
}
if (-not $service) {
    Write-Host "  Service not found" -ForegroundColor Gray
}

# Step 2: Uninstall existing service
Write-Host ""
Write-Host "[2/3] Uninstalling existing service..." -ForegroundColor Yellow
& $agentExe -uninstall 2>$null
Start-Sleep -Seconds 2

# Step 3: Install service
Write-Host ""
Write-Host "[3/3] Installing service as user account..." -ForegroundColor Yellow
& $agentExe -install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install service!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Service installed" -ForegroundColor Green

# Start the service
Write-Host ""
Write-Host "Starting service..." -ForegroundColor Yellow
Start-Service -Name "LunarisAgentService" -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

$service = Get-Service -Name "LunarisAgentService" -ErrorAction SilentlyContinue
$serviceRunning = $false
if ($service) {
    $serviceRunning = ($service.Status -eq 'Running')
}
if ($serviceRunning) {
    Write-Host "✓ Service started successfully" -ForegroundColor Green
}
if (-not $serviceRunning -and $service) {
    Write-Host "⚠ Service installed but may need password configuration" -ForegroundColor Yellow
    Write-Host "  If service doesn't start, run configure-service-as-user.ps1" -ForegroundColor Yellow
}
if (-not $service) {
    Write-Host "⚠ Service not found after installation" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Installation Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Service is configured to run as: $fullUserName" -ForegroundColor Cyan
Write-Host ""
Write-Host "Service status:" -ForegroundColor Yellow
Get-Service -Name "LunarisAgentService" | Select-Object Status, DisplayName, @{Name="RunAs";Expression={(Get-WmiObject Win32_Service -Filter "Name='LunarisAgentService'").StartName}} | Format-Table -AutoSize
Write-Host ""
Write-Host "Note: If the service fails to start, you may need to:" -ForegroundColor Yellow
Write-Host "  1. Run configure-service-as-user.ps1 to set the password" -ForegroundColor White
Write-Host "  2. Or use run-as-user.ps1 to run without a service" -ForegroundColor White
Write-Host ""
