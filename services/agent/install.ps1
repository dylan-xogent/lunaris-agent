# Lunaris Agent - Complete Installer
# This script handles everything: build, install, and configure the agent

param(
    [switch]$Service,
    [switch]$Background,
    [switch]$AutoStart
)

Write-Host "=== Lunaris Agent - Complete Installer ===" -ForegroundColor Cyan
Write-Host ""

$agentDir = $PSScriptRoot
Set-Location $agentDir

# Step 1: Check Go installation
Write-Host "[1/5] Checking Go installation..." -ForegroundColor Yellow
$goVersion = go version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Go is not installed!" -ForegroundColor Red
    Write-Host "Please install Go from: https://go.dev/dl/" -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ Found: $goVersion" -ForegroundColor Green
Write-Host ""

# Step 2: Build the agent
Write-Host "[2/5] Building agent..." -ForegroundColor Yellow
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
Write-Host "✓ Build successful!" -ForegroundColor Green
Write-Host ""

# Step 3: Determine installation mode
Write-Host "[3/5] Determining installation mode..." -ForegroundColor Yellow
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

$installMode = "background"
if ($Service) {
    if (-not $isAdmin) {
        Write-Host "ERROR: Service installation requires administrator privileges!" -ForegroundColor Red
        Write-Host "Please run PowerShell as Administrator, or use -Background instead" -ForegroundColor Yellow
        exit 1
    }
    $installMode = "service"
} elseif ($Background) {
    $installMode = "background"
} else {
    # Auto-detect: use background if not admin, service if admin
    if ($isAdmin) {
        Write-Host "Admin privileges detected. Choose installation mode:" -ForegroundColor Cyan
        Write-Host "  1. Background Application (recommended - no service issues)" -ForegroundColor White
        Write-Host "  2. Windows Service (requires user account configuration)" -ForegroundColor White
        $choice = Read-Host "Enter choice (1 or 2, default: 1)"
        if ($choice -eq "2") {
            $installMode = "service"
        }
    } else {
        Write-Host "No admin privileges. Using background application mode." -ForegroundColor Cyan
    }
}

Write-Host "Installation mode: $installMode" -ForegroundColor Green
Write-Host ""

# Step 4: Install based on mode
Write-Host "[4/5] Installing agent..." -ForegroundColor Yellow

if ($installMode -eq "service") {
    # Service installation
    Write-Host "Installing as Windows service..." -ForegroundColor Cyan
    
    # Stop existing service
    $service = Get-Service -Name "LunarisAgentService" -ErrorAction SilentlyContinue
    if ($service -and $service.Status -eq 'Running') {
        Stop-Service -Name "LunarisAgentService" -Force
        Write-Host "  Stopped existing service" -ForegroundColor Gray
    }
    
    # Uninstall existing
    & .\lunaris-agent.exe -uninstall 2>$null
    
    # Install new
    & .\lunaris-agent.exe -install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Service installation failed!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✓ Service installed" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠ IMPORTANT: Service is running as LocalSystem by default." -ForegroundColor Yellow
    Write-Host "  To access winget, configure it to run as your user account:" -ForegroundColor Yellow
    Write-Host "  .\configure-service-as-user.ps1" -ForegroundColor White
    Write-Host ""
    
    # Start service
    Start-Service -Name "LunarisAgentService" -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    
    $service = Get-Service -Name "LunarisAgentService" -ErrorAction SilentlyContinue
    if ($service -and $service.Status -eq 'Running') {
        Write-Host "✓ Service started" -ForegroundColor Green
    } else {
        Write-Host "⚠ Service installed but may not be running" -ForegroundColor Yellow
    }
    
} else {
    # Background application installation
    Write-Host "Installing as background application..." -ForegroundColor Cyan
    
    # Stop existing agent process
    $process = Get-Process -Name "lunaris-agent" -ErrorAction SilentlyContinue
    if ($process) {
        Stop-Process -Name "lunaris-agent" -Force
        Write-Host "  Stopped existing agent" -ForegroundColor Gray
        Start-Sleep -Seconds 2
    }
    
    # Start new agent
    Start-Process -FilePath ".\lunaris-agent.exe" -WindowStyle Hidden
    Start-Sleep -Seconds 2
    
    $process = Get-Process -Name "lunaris-agent" -ErrorAction SilentlyContinue
    if ($process) {
        Write-Host "✓ Agent started (PID: $($process.Id))" -ForegroundColor Green
    } else {
        Write-Host "ERROR: Failed to start agent!" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# Step 5: Set up auto-start (optional)
Write-Host "[5/5] Setting up auto-start..." -ForegroundColor Yellow

if ($AutoStart -or $installMode -eq "background") {
    # For background mode, always set up auto-start
    if ($installMode -eq "background") {
        $taskName = "LunarisAgent"
        $taskExists = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
        
        if ($taskExists) {
            Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
        }
        
        $startScript = Join-Path $agentDir "start-agent-background.ps1"
        $action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$startScript`""
        $trigger = New-ScheduledTaskTrigger -AtLogOn
        $principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited
        $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable:$false
        
        Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description "Lunaris Agent - Starts automatically on user login" | Out-Null
        
        Write-Host "✓ Auto-start configured (starts on login)" -ForegroundColor Green
    } else {
        Write-Host "  Auto-start for services is handled by Windows Service Manager" -ForegroundColor Gray
    }
} else {
    Write-Host "  Auto-start skipped (use -AutoStart to enable)" -ForegroundColor Gray
}

Write-Host ""

# Final status
Write-Host "=== Installation Complete ===" -ForegroundColor Green
Write-Host ""

if ($installMode -eq "service") {
    Get-Service -Name "LunarisAgentService" | Select-Object Status, DisplayName, @{Name="RunAs";Expression={(Get-WmiObject Win32_Service -Filter "Name='LunarisAgentService'").StartName}} | Format-Table -AutoSize
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Configure service to run as your user: .\configure-service-as-user.ps1" -ForegroundColor White
    Write-Host "  2. Or use background mode instead: .\install.ps1 -Background" -ForegroundColor White
} else {
    Get-Process -Name "lunaris-agent" -ErrorAction SilentlyContinue | Select-Object Id, ProcessName, StartTime | Format-Table -AutoSize
    Write-Host ""
    Write-Host "Agent is running in background mode!" -ForegroundColor Cyan
    Write-Host "  - Runs in your user context (can access winget)" -ForegroundColor White
    Write-Host "  - Auto-starts on login" -ForegroundColor White
    Write-Host "  - No admin permissions needed" -ForegroundColor White
    Write-Host ""
    Write-Host "Management commands:" -ForegroundColor Yellow
    Write-Host "  Start: .\start-agent-background.ps1" -ForegroundColor White
    Write-Host "  Stop: .\stop-agent.ps1" -ForegroundColor White
}

Write-Host ""
Write-Host "Wait ~30 seconds for the agent to register, then test:" -ForegroundColor Cyan
Write-Host "  - Click 'Sync Now' in the web console" -ForegroundColor White
Write-Host "  - Verify updates are detected" -ForegroundColor White
Write-Host ""

