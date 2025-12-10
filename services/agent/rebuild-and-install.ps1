# Lunaris Agent - Rebuild and Install Script
Write-Host "=== Lunaris Agent Rebuild and Install ===" -ForegroundColor Cyan
Write-Host ""

# Check for admin privileges
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: This script requires administrator privileges!" -ForegroundColor Red
    Write-Host "Please run PowerShell as Administrator" -ForegroundColor Yellow
    exit 1
}

Write-Host "Running with administrator privileges" -ForegroundColor Green
Write-Host ""

# Get current directory
$agentDir = $PSScriptRoot
Set-Location $agentDir

Write-Host "[1/5] Stopping existing service..." -ForegroundColor Yellow
$service = Get-Service -Name "LunarisAgentService" -ErrorAction SilentlyContinue
if ($service -and $service.Status -eq 'Running') {
    Stop-Service -Name "LunarisAgentService" -Force
    Write-Host "Service stopped successfully" -ForegroundColor Green
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "[2/5] Uninstalling existing service..." -ForegroundColor Yellow
$agentExe = Join-Path $agentDir "lunaris-agent.exe"
if (Test-Path $agentExe) {
    & $agentExe -uninstall 2>$null
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "[3/5] Checking Go installation..." -ForegroundColor Yellow
$goVersion = go version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Go is not installed!" -ForegroundColor Red
    exit 1
}
Write-Host "Found: $goVersion" -ForegroundColor Green

Write-Host ""
Write-Host "[4/5] Building agent..." -ForegroundColor Yellow
go mod tidy
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to download dependencies!" -ForegroundColor Red
    exit 1
}

go build -o lunaris-agent.exe ./cmd/lunaris-agent
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "Build successful!" -ForegroundColor Green

Write-Host ""
Write-Host "[5/5] Installing and starting service..." -ForegroundColor Yellow
& $agentExe -install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install service!" -ForegroundColor Red
    exit 1
}
Write-Host "Service installed successfully" -ForegroundColor Green

Start-Sleep -Seconds 2

& $agentExe -start
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to start service!" -ForegroundColor Red
    exit 1
}
Write-Host "Service started successfully" -ForegroundColor Green

Write-Host ""
Write-Host "=== Installation Complete ===" -ForegroundColor Green
Get-Service -Name "LunarisAgentService" | Select-Object Status, DisplayName
