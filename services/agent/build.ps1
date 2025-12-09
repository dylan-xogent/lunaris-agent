# Lunaris Agent Build Script
# Builds the Windows agent with WebSocket support

Write-Host "=== Lunaris Agent Build Script ===" -ForegroundColor Cyan
Write-Host ""

# Check if Go is installed
Write-Host "Checking for Go installation..." -ForegroundColor Yellow
$goVersion = go version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Go is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Go from: https://go.dev/dl/" -ForegroundColor Yellow
    Write-Host "Recommended version: Go 1.21 or later" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "After installing Go, restart PowerShell and run this script again." -ForegroundColor Yellow
    exit 1
}

Write-Host "Found: $goVersion" -ForegroundColor Green
Write-Host ""

# Get current directory
$agentDir = $PSScriptRoot
Set-Location $agentDir

# Download dependencies
Write-Host "Downloading Go dependencies..." -ForegroundColor Yellow
go mod tidy
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to download dependencies!" -ForegroundColor Red
    exit 1
}
Write-Host "Dependencies downloaded successfully!" -ForegroundColor Green
Write-Host ""

# Build the agent
Write-Host "Building lunaris-agent.exe..." -ForegroundColor Yellow
$buildTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$outputPath = Join-Path $agentDir "lunaris-agent.exe"

go build -o $outputPath ./cmd/lunaris-agent
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Build successful!" -ForegroundColor Green
Write-Host "Output: $outputPath" -ForegroundColor Cyan
Write-Host ""

# Show file info
$fileInfo = Get-Item $outputPath
Write-Host "File size: $([math]::Round($fileInfo.Length / 1MB, 2)) MB" -ForegroundColor Cyan
Write-Host "Build time: $buildTime" -ForegroundColor Cyan
Write-Host ""

Write-Host "=== Build Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Stop existing agent: .\lunaris-agent.exe -stop" -ForegroundColor White
Write-Host "  2. Uninstall old version: .\lunaris-agent.exe -uninstall" -ForegroundColor White
Write-Host "  3. Install new version: .\lunaris-agent.exe -install" -ForegroundColor White
Write-Host "  4. Start agent: .\lunaris-agent.exe -start" -ForegroundColor White
Write-Host ""
Write-Host "Or run in console mode: .\lunaris-agent.exe" -ForegroundColor White
Write-Host ""
