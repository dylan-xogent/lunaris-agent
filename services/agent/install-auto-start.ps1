# Lunaris Agent - Install Auto-Start (Scheduled Task)
# This creates a scheduled task to start the agent on login (no admin needed for task creation)

Write-Host "=== Install Lunaris Agent Auto-Start ===" -ForegroundColor Cyan
Write-Host ""

$agentDir = $PSScriptRoot
$agentExe = Join-Path $agentDir "lunaris-agent.exe"
$startScript = Join-Path $agentDir "start-agent-background.ps1"

if (-not (Test-Path $agentExe)) {
    Write-Host "ERROR: lunaris-agent.exe not found!" -ForegroundColor Red
    exit 1
}

$taskName = "LunarisAgent"
$taskExists = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue

if ($taskExists) {
    Write-Host "Task already exists. Removing old task..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

Write-Host "Creating scheduled task to start agent on login..." -ForegroundColor Yellow

$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$startScript`""
$trigger = New-ScheduledTaskTrigger -AtLogOn
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable:$false

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description "Lunaris Agent - Starts automatically on user login"

Write-Host "✓ Auto-start installed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "The agent will now start automatically when you log in." -ForegroundColor Cyan
Write-Host "To remove auto-start: Unregister-ScheduledTask -TaskName $taskName" -ForegroundColor Gray
Write-Host ""

