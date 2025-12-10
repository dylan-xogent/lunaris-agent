# Lunaris Agent - Stop Background Process
Write-Host "=== Stopping Lunaris Agent ===" -ForegroundColor Cyan
Write-Host ""

$process = Get-Process -Name "lunaris-agent" -ErrorAction SilentlyContinue
if ($process) {
    Stop-Process -Name "lunaris-agent" -Force
    Write-Host "✓ Agent stopped" -ForegroundColor Green
} else {
    Write-Host "Agent is not running" -ForegroundColor Gray
}

