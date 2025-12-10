# Lunaris Agent - Rebuild and Restart Service (Admin Required)
# This script will rebuild the agent and restart the service with the new executable

Write-Host "=== Lunaris Agent Rebuild and Restart ===" -ForegroundColor Cyan
Write-Host ""

# Check for admin privileges
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: This script requires administrator privileges!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please run PowerShell as Administrator and try again:" -ForegroundColor Yellow
    Write-Host "  Right-click PowerShell -> Run as Administrator" -ForegroundColor White
    Write-Host ""
    Write-Host "Or, this script will attempt to elevate privileges..." -ForegroundColor Yellow
    Write-Host ""
    
    # Attempt to elevate
    $scriptPath = $MyInvocation.MyCommand.Path
    Start-Process powershell -Verb RunAs -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`""
    exit
}

Write-Host "✓ Running with administrator privileges" -ForegroundColor Green
Write-Host ""

# Get current directory
$agentDir = $PSScriptRoot
Set-Location $agentDir

Write-Host "[1/4] Stopping service..." -ForegroundColor Yellow
$service = Get-Service -Name "LunarisAgentService" -ErrorAction SilentlyContinue
if ($service) {
    if ($service.Status -eq 'Running') {
        Stop-Service -Name "LunarisAgentService" -Force
        Write-Host "✓ Service stopped" -ForegroundColor Green
        Start-Sleep -Seconds 3
    }
}

Write-Host ""
Write-Host "[2/4] Uninstalling service..." -ForegroundColor Yellow
$agentExe = Join-Path $agentDir "lunaris-agent.exe"
if (Test-Path $agentExe) {
    & $agentExe -uninstall 2>$null
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "[3/4] Building agent..." -ForegroundColor Yellow
go mod tidy
go build -o lunaris-agent.exe ./cmd/lunaris-agent
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Build successful" -ForegroundColor Green

Write-Host ""
Write-Host "[4/4] Installing and starting service..." -ForegroundColor Yellow
& $agentExe -install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install service!" -ForegroundColor Red
    exit 1
}
Start-Sleep -Seconds 2

Start-Service -Name "LunarisAgentService"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to start service!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Service started" -ForegroundColor Green

Write-Host ""
Write-Host "=== Complete ===" -ForegroundColor Green
Write-Host "Service has been rebuilt and restarted with winget path fix!" -ForegroundColor Cyan
