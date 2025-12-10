# Lunaris Agent - Install Service as User Account
Write-Host "=== Lunaris Agent - Install Service as User ===" -ForegroundColor Cyan
Write-Host ""

$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: Requires administrator privileges!" -ForegroundColor Red
    Write-Host "Run PowerShell as Administrator" -ForegroundColor Yellow
    exit 1
}

Write-Host "Admin check passed" -ForegroundColor Green
Write-Host ""

$agentDir = $PSScriptRoot
Set-Location $agentDir
$agentExe = Join-Path $agentDir "lunaris-agent.exe"

if (-not (Test-Path $agentExe)) {
    Write-Host "ERROR: lunaris-agent.exe not found!" -ForegroundColor Red
    exit 1
}

$currentUser = $env:USERNAME
$userDomain = $env:USERDOMAIN
if ($userDomain -and $userDomain -ne ".") {
    $fullUserName = "$userDomain\$currentUser"
} else {
    $fullUserName = ".\$currentUser"
}

Write-Host "Current user: $fullUserName" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/3] Stopping service..." -ForegroundColor Yellow
$service = Get-Service -Name "LunarisAgentService" -ErrorAction SilentlyContinue
if ($service) {
    if ($service.Status -eq 'Running') {
        Stop-Service -Name "LunarisAgentService" -Force
        Write-Host "Service stopped" -ForegroundColor Green
        Start-Sleep -Seconds 2
    }
}

Write-Host "[2/3] Uninstalling service..." -ForegroundColor Yellow
& $agentExe -uninstall 2>$null
Start-Sleep -Seconds 2

Write-Host "[3/3] Installing service..." -ForegroundColor Yellow
& $agentExe -install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install service!" -ForegroundColor Red
    exit 1
}
Write-Host "Service installed" -ForegroundColor Green

Write-Host ""
Write-Host "Starting service..." -ForegroundColor Yellow
Start-Service -Name "LunarisAgentService" -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

$service = Get-Service -Name "LunarisAgentService" -ErrorAction SilentlyContinue
if ($service) {
    if ($service.Status -eq 'Running') {
        Write-Host "Service started successfully" -ForegroundColor Green
    } else {
        Write-Host "Service installed but may need password configuration" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== Complete ===" -ForegroundColor Green
Get-Service -Name "LunarisAgentService" | Format-Table Status, DisplayName
