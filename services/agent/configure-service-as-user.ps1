# Lunaris Agent - Configure Service to Run as Current User
# This script configures the service to run as the current user so it can access winget

Write-Host "=== Configure Lunaris Agent Service to Run as User ===" -ForegroundColor Cyan
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

# Get current user info
$currentUser = $env:USERNAME
$userDomain = $env:USERDOMAIN
$fullUserName = "$userDomain\$currentUser"

Write-Host "Current user: $fullUserName" -ForegroundColor Cyan
Write-Host ""

# Step 1: Stop the service
Write-Host "[1/4] Stopping service..." -ForegroundColor Yellow
$service = Get-Service -Name "LunarisAgentService" -ErrorAction SilentlyContinue
if ($service -and $service.Status -eq 'Running') {
    Stop-Service -Name "LunarisAgentService" -Force
    Write-Host "✓ Service stopped" -ForegroundColor Green
    Start-Sleep -Seconds 2
} else {
    Write-Host "  Service already stopped" -ForegroundColor Gray
}

# Step 2: Get user credentials
Write-Host ""
Write-Host "[2/4] Getting user credentials..." -ForegroundColor Yellow
Write-Host "Please enter your password to run the service as your user account:" -ForegroundColor White
$cred = Get-Credential -UserName $fullUserName -Message "Enter password for $fullUserName"
if (-not $cred) {
    Write-Host "ERROR: Credentials required!" -ForegroundColor Red
    exit 1
}
$password = $cred.GetNetworkCredential().Password

# Step 3: Configure service to run as user
Write-Host ""
Write-Host "[3/4] Configuring service to run as user account..." -ForegroundColor Yellow
$result = sc.exe config LunarisAgentService obj= "$fullUserName" password= "$password" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Service configured to run as $fullUserName" -ForegroundColor Green
} else {
    Write-Host "ERROR: Failed to configure service!" -ForegroundColor Red
    Write-Host "Output: $result" -ForegroundColor Red
    exit 1
}

# Step 4: Start the service
Write-Host ""
Write-Host "[4/4] Starting service..." -ForegroundColor Yellow
Start-Service -Name "LunarisAgentService" -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

$service = Get-Service -Name "LunarisAgentService" -ErrorAction SilentlyContinue
if ($service -and $service.Status -eq 'Running') {
    Write-Host "✓ Service started successfully" -ForegroundColor Green
} else {
    Write-Host "ERROR: Service failed to start!" -ForegroundColor Red
    Write-Host "Check Event Viewer for details" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "=== Configuration Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "The service is now running as $fullUserName" -ForegroundColor Cyan
Write-Host "This allows it to access winget from your user profile." -ForegroundColor Cyan
Write-Host ""
Write-Host "Service status:" -ForegroundColor Yellow
Get-Service -Name "LunarisAgentService" | Select-Object Status, DisplayName, @{Name="RunAs";Expression={(Get-WmiObject Win32_Service -Filter "Name='LunarisAgentService'").StartName}} | Format-Table -AutoSize
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Wait ~10 seconds for the agent to initialize" -ForegroundColor White
Write-Host "  2. Test the Sync Now button in the web console" -ForegroundColor White
Write-Host "  3. Verify commands complete successfully" -ForegroundColor White
Write-Host ""

