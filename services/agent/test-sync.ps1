# Test script to verify sync functionality
Write-Host "=== Lunaris Agent Sync Test ===" -ForegroundColor Cyan
Write-Host ""

# Check service status
Write-Host "1. Checking service status..." -ForegroundColor Yellow
$service = Get-Service -Name "LunarisAgentService" -ErrorAction SilentlyContinue
if ($service) {
    Write-Host "   Service Status: $($service.Status)" -ForegroundColor Green
} else {
    Write-Host "   Service not found!" -ForegroundColor Red
    exit 1
}

# Check executable
Write-Host "`n2. Checking executable..." -ForegroundColor Yellow
$exePath = ".\lunaris-agent.exe"
if (Test-Path $exePath) {
    $exeInfo = Get-Item $exePath
    Write-Host "   Executable: $($exeInfo.FullName)" -ForegroundColor Green
    Write-Host "   Last Modified: $($exeInfo.LastWriteTime)" -ForegroundColor Green
} else {
    Write-Host "   Executable not found!" -ForegroundColor Red
    exit 1
}

# Test scanner directly
Write-Host "`n3. Testing scanner directly..." -ForegroundColor Yellow
$testCode = @'
package main
import (
    "fmt"
    "github.com/lunaris/agent/internal/winget"
)
func main() {
    scanner := winget.NewScanner()
    updates, err := scanner.ScanUpdates()
    if err != nil {
        fmt.Printf("Error: %v\n", err)
        return
    }
    fmt.Printf("Found %d updates:\n", len(updates))
    for i, u := range updates {
        fmt.Printf("%d. %s (%s) - %s -> %s\n", i+1, u.PackageName, u.PackageIdentifier, u.InstalledVersion, u.AvailableVersion)
    }
}
'@
$testCode | Out-File -FilePath "test_scanner.go" -Encoding UTF8 -Force
$scannerOutput = go run test_scanner.go 2>&1
Remove-Item test_scanner.go -ErrorAction SilentlyContinue
Write-Host "   $scannerOutput" -ForegroundColor $(if ($scannerOutput -match "Found 3") { "Green" } else { "Yellow" })

# Check current updates in database
Write-Host "`n4. Checking current updates in database..." -ForegroundColor Yellow
$currentUpdates = curl -s "http://localhost:3001/api/updates?deviceId=6167a125-d2b8-4cee-8350-0e2233424655" | ConvertFrom-Json
$updateCount = ($currentUpdates | Measure-Object).Count
Write-Host "   Current updates in database: $updateCount" -ForegroundColor $(if ($updateCount -eq 3) { "Green" } else { "Yellow" })
if ($updateCount -gt 0) {
    $currentUpdates | Select-Object packageName, packageIdentifier | Format-Table -AutoSize
}

# Trigger sync
Write-Host "`n5. Triggering sync command..." -ForegroundColor Yellow
$syncResult = curl -s -X POST "http://localhost:3001/api/devices/6167a125-d2b8-4cee-8350-0e2233424655/sync" | ConvertFrom-Json
if ($syncResult.success) {
    Write-Host "   Sync command created: $($syncResult.commandId)" -ForegroundColor Green
} else {
    Write-Host "   Failed to create sync command!" -ForegroundColor Red
    exit 1
}

# Wait for agent to process
Write-Host "`n6. Waiting for agent to process command (15 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Check event logs
Write-Host "`n7. Checking recent event logs..." -ForegroundColor Yellow
$recentLogs = Get-EventLog -LogName Application -Source LunarisAgentService -Newest 30 | Where-Object {$_.TimeGenerated -gt (Get-Date).AddMinutes(-5)}
$relevantLogs = $recentLogs | Where-Object {$_.Message -like "*sync*" -or $_.Message -like "*command*" -or $_.Message -like "*scan*" -or $_.Message -like "*update*" -or $_.Message -like "*Found*" -or $_.Message -like "*Executing*" -or $_.Message -like "*Starting*" -or $_.Message -like "*Agent*"}
if ($relevantLogs) {
    Write-Host "   Recent relevant logs:" -ForegroundColor Green
    $relevantLogs | Select-Object TimeGenerated, Message | Format-List | Select-Object -First 20
} else {
    Write-Host "   No relevant logs found (agent may not be logging to Event Log yet)" -ForegroundColor Yellow
}

# Check updates after sync
Write-Host "`n8. Checking updates after sync..." -ForegroundColor Yellow
$updatesAfter = curl -s "http://localhost:3001/api/updates?deviceId=6167a125-d2b8-4cee-8350-0e2233424655" | ConvertFrom-Json
$updateCountAfter = ($updatesAfter | Measure-Object).Count
Write-Host "   Updates after sync: $updateCountAfter" -ForegroundColor $(if ($updateCountAfter -eq 3) { "Green" } else { "Yellow" })
if ($updateCountAfter -gt 0) {
    $updatesAfter | Select-Object packageName, packageIdentifier, installedVersion, availableVersion | Format-Table -AutoSize
}

# Summary
Write-Host "`n=== Test Summary ===" -ForegroundColor Cyan
if ($updateCountAfter -eq 3) {
    Write-Host "✓ All 3 updates detected and saved!" -ForegroundColor Green
} else {
    Write-Host "✗ Only $updateCountAfter updates found (expected 3)" -ForegroundColor Red
    Write-Host "  The agent may not be executing the sync command or reporting all updates." -ForegroundColor Yellow
}

