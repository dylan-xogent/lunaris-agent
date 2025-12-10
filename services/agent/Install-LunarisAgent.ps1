<#
.SYNOPSIS
    Lunaris Agent Installer for Windows

.DESCRIPTION
    Installs and configures the Lunaris Agent as a Windows service.
    Can be used for manual installation or RMM deployment (NinjaRMM, etc.)

.PARAMETER ApiUrl
    The URL of the Lunaris API server (default: http://localhost:3001/api/agent)

.PARAMETER DownloadUrl
    URL to download the agent executable from (optional, uses GitHub releases if not specified)

.PARAMETER Version
    Version to install (default: latest)

.PARAMETER InstallPath
    Installation directory (default: C:\Program Files\Lunaris Agent)

.PARAMETER HeartbeatInterval
    Heartbeat interval in seconds (default: 30)

.PARAMETER UpdateScanInterval
    Update scan interval in minutes (default: 60)

.PARAMETER ForceReinstall
    Force reinstallation even if already installed

.PARAMETER Uninstall
    Uninstall the Lunaris Agent

.EXAMPLE
    .\Install-LunarisAgent.ps1 -ApiUrl "https://lunaris.yourdomain.com/api/agent"

.EXAMPLE
    .\Install-LunarisAgent.ps1 -ApiUrl "https://lunaris.yourdomain.com/api/agent" -ForceReinstall

.EXAMPLE
    .\Install-LunarisAgent.ps1 -Uninstall

.NOTES
    Author: Lunaris Team
    Version: 1.0.0
    Requires: PowerShell 5.1+, Administrator privileges
#>

[CmdletBinding()]
param(
    [Parameter()]
    [string]$ApiUrl = "http://localhost:3001/api/agent",

    [Parameter()]
    [string]$DownloadUrl = "",

    [Parameter()]
    [string]$Version = "latest",

    [Parameter()]
    [string]$InstallPath = "C:\Program Files\Lunaris Agent",

    [Parameter()]
    [int]$HeartbeatInterval = 30,

    [Parameter()]
    [int]$UpdateScanInterval = 60,

    [Parameter()]
    [switch]$ForceReinstall,

    [Parameter()]
    [switch]$Uninstall
)

#Requires -RunAsAdministrator

# Script configuration
$ErrorActionPreference = "Stop"
$ServiceName = "LunarisAgent"
$ServiceDisplayName = "Lunaris Agent"
$ServiceDescription = "Monitors and manages Windows updates for Lunaris platform"
$ExecutableName = "lunaris-agent.exe"
$ConfigFileName = "config.json"
$GitHubRepo = "dylan-xogent/lunaris-agent"

# Logging function
function Write-Log {
    param(
        [string]$Message,
        [ValidateSet('Info', 'Warning', 'Error', 'Success')]
        [string]$Level = 'Info'
    )

    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $color = switch ($Level) {
        'Info'    { 'White' }
        'Warning' { 'Yellow' }
        'Error'   { 'Red' }
        'Success' { 'Green' }
    }

    $prefix = switch ($Level) {
        'Info'    { '[INFO]' }
        'Warning' { '[WARN]' }
        'Error'   { '[ERROR]' }
        'Success' { '[OK]' }
    }

    Write-Host "$timestamp $prefix $Message" -ForegroundColor $color
}

# Check if running as administrator
function Test-Administrator {
    $user = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($user)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Uninstall function
function Uninstall-LunarisAgent {
    Write-Log "Starting Lunaris Agent uninstallation..." -Level Info

    # Stop service if running
    $service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    if ($service) {
        if ($service.Status -eq 'Running') {
            Write-Log "Stopping service..." -Level Info
            Stop-Service -Name $ServiceName -Force
            Start-Sleep -Seconds 2
        }

        Write-Log "Removing service..." -Level Info
        & sc.exe delete $ServiceName
        if ($LASTEXITCODE -eq 0) {
            Write-Log "Service removed successfully" -Level Success
        }
    } else {
        Write-Log "Service not found, skipping removal" -Level Warning
    }

    # Remove installation directory
    if (Test-Path $InstallPath) {
        Write-Log "Removing installation directory: $InstallPath" -Level Info
        Remove-Item -Path $InstallPath -Recurse -Force -ErrorAction SilentlyContinue
        Write-Log "Installation directory removed" -Level Success
    }

    Write-Log "Uninstallation completed successfully!" -Level Success
}

# Download agent executable
function Download-Agent {
    param(
        [string]$Url,
        [string]$OutputPath
    )

    Write-Log "Downloading agent from: $Url" -Level Info

    try {
        # Use TLS 1.2
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

        $webClient = New-Object System.Net.WebClient
        $webClient.DownloadFile($Url, $OutputPath)

        if (Test-Path $OutputPath) {
            $fileInfo = Get-Item $OutputPath
            Write-Log "Downloaded successfully ($([math]::Round($fileInfo.Length / 1MB, 2)) MB)" -Level Success
            return $true
        } else {
            throw "File not found after download"
        }
    } catch {
        Write-Log "Download failed: $_" -Level Error
        return $false
    }
}

# Create configuration file
function New-ConfigFile {
    param(
        [string]$Path,
        [string]$ApiUrl,
        [int]$HeartbeatInterval,
        [int]$UpdateScanInterval
    )

    $config = @{
        apiURL = $ApiUrl
        heartbeatIntervalSec = $HeartbeatInterval
        updateScanIntervalMin = $UpdateScanInterval
        deviceID = ""
    }

    $configJson = $config | ConvertTo-Json -Depth 10
    $configJson | Out-File -FilePath $Path -Encoding UTF8 -Force

    Write-Log "Configuration file created: $Path" -Level Success
}

# Install Windows service
function Install-Service {
    param(
        [string]$ExecutablePath,
        [string]$ServiceName,
        [string]$DisplayName,
        [string]$Description
    )

    Write-Log "Installing Windows service..." -Level Info

    # Create service using sc.exe for better control
    # Note: The agent automatically detects if it's running as a service, no -service flag needed
    $result = & sc.exe create $ServiceName binPath= "`"$ExecutablePath`"" start= auto DisplayName= "`"$DisplayName`"" obj= LocalSystem

    if ($LASTEXITCODE -ne 0) {
        throw "Failed to create service: $result"
    }

    # Set description
    & sc.exe description $ServiceName $Description

    # Set recovery options (restart on failure)
    & sc.exe failure $ServiceName reset= 86400 actions= restart/5000/restart/10000/restart/30000

    Write-Log "Service installed successfully" -Level Success
}

# Main installation function
function Install-LunarisAgent {
    Write-Log "=== Lunaris Agent Installation ===" -Level Info
    Write-Log "Version: $Version" -Level Info
    Write-Log "API URL: $ApiUrl" -Level Info
    Write-Log "Install Path: $InstallPath" -Level Info

    # Check if already installed
    $service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    if ($service -and -not $ForceReinstall) {
        Write-Log "Lunaris Agent is already installed. Use -ForceReinstall to reinstall." -Level Warning
        Write-Log "Current status: $($service.Status)" -Level Info
        return
    }

    # If force reinstall, uninstall first
    if ($service -and $ForceReinstall) {
        Write-Log "Force reinstall requested, removing existing installation..." -Level Warning
        Uninstall-LunarisAgent
        Start-Sleep -Seconds 2
    }

    # Create installation directory
    if (-not (Test-Path $InstallPath)) {
        Write-Log "Creating installation directory..." -Level Info
        New-Item -ItemType Directory -Path $InstallPath -Force | Out-Null
    }

    $executablePath = Join-Path $InstallPath $ExecutableName
    $configPath = Join-Path $InstallPath $ConfigFileName

    # Determine download URL
    $downloadSource = $DownloadUrl
    if ([string]::IsNullOrEmpty($downloadSource)) {
        # Try to use GitHub releases
        if ($Version -eq "latest") {
            $downloadSource = "https://github.com/$GitHubRepo/releases/latest/download/$ExecutableName"
        } else {
            $downloadSource = "https://github.com/$GitHubRepo/releases/download/$Version/$ExecutableName"
        }
        Write-Log "Using GitHub releases: $downloadSource" -Level Info
    }

    # Check if local executable exists (for local installs)
    $localExe = Join-Path $PSScriptRoot $ExecutableName
    if (Test-Path $localExe) {
        Write-Log "Found local executable, copying to installation directory..." -Level Info
        Copy-Item -Path $localExe -Destination $executablePath -Force
        Write-Log "Executable copied successfully" -Level Success
    } else {
        # Download from URL
        if (-not (Download-Agent -Url $downloadSource -OutputPath $executablePath)) {
            Write-Log "Failed to download agent. Please check the URL or place $ExecutableName in the same directory as this script." -Level Error
            return
        }
    }

    # Verify executable
    if (-not (Test-Path $executablePath)) {
        Write-Log "Executable not found at: $executablePath" -Level Error
        return
    }

    # Create configuration file
    Write-Log "Creating configuration file..." -Level Info
    New-ConfigFile -Path $configPath -ApiUrl $ApiUrl -HeartbeatInterval $HeartbeatInterval -UpdateScanInterval $UpdateScanInterval

    # Install service
    try {
        Install-Service -ExecutablePath $executablePath -ServiceName $ServiceName -DisplayName $ServiceDisplayName -Description $ServiceDescription
    } catch {
        Write-Log "Service installation failed: $_" -Level Error
        return
    }

    # Start service
    Write-Log "Starting service..." -Level Info
    try {
        Start-Service -Name $ServiceName
        Start-Sleep -Seconds 2

        $service = Get-Service -Name $ServiceName
        if ($service.Status -eq 'Running') {
            Write-Log "Service started successfully!" -Level Success
        } else {
            Write-Log "Service is in $($service.Status) state" -Level Warning
        }
    } catch {
        Write-Log "Failed to start service: $_" -Level Error
        Write-Log "You can start it manually later with: Start-Service -Name $ServiceName" -Level Info
    }

    # Display installation summary
    Write-Log "" -Level Info
    Write-Log "=== Installation Summary ===" -Level Success
    Write-Log "Installation Path: $InstallPath" -Level Info
    Write-Log "Executable: $executablePath" -Level Info
    Write-Log "Configuration: $configPath" -Level Info
    Write-Log "Service Name: $ServiceName" -Level Info
    Write-Log "Service Status: $((Get-Service -Name $ServiceName).Status)" -Level Info
    Write-Log "" -Level Info
    Write-Log "Installation completed successfully!" -Level Success
    Write-Log "" -Level Info
    Write-Log "The agent will automatically register with the API server and start monitoring updates." -Level Info
    Write-Log "Check the Windows Event Viewer (Application log) for agent activity." -Level Info
}

# Main script execution
try {
    # Check administrator privileges
    if (-not (Test-Administrator)) {
        Write-Log "This script must be run as Administrator!" -Level Error
        exit 1
    }

    # Execute requested action
    if ($Uninstall) {
        Uninstall-LunarisAgent
    } else {
        Install-LunarisAgent
    }

} catch {
    Write-Log "An unexpected error occurred: $_" -Level Error
    Write-Log "Stack Trace: $($_.ScriptStackTrace)" -Level Error
    exit 1
}
