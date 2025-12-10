package winget

import (
	"bytes"
	"fmt"
	"os/exec"
	"strings"
)

// InstallResult represents the result of an install operation
type InstallResult struct {
	PackageIdentifier string
	Success           bool
	Message           string
	Error             error
}

// Installer handles winget package installations
type Installer struct{}

// NewInstaller creates a new winget installer
func NewInstaller() *Installer {
	return &Installer{}
}

// Uninstall uninstalls a package using winget
func (i *Installer) Uninstall(packageIdentifier string) error {
	wingetCmd := getWingetCommand()
	cmd := exec.Command(wingetCmd, "uninstall",
		"--id", packageIdentifier,
		"--silent",
		"--accept-package-agreements",
		"--accept-source-agreements",
	)

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err := cmd.Run()
	if err != nil {
		output := stdout.String()
		if stderr.Len() > 0 {
			output += "\n" + stderr.String()
		}
		return fmt.Errorf("winget uninstall failed: %w (output: %s)", err, output)
	}

	return nil
}

// Install installs a single package using winget
// retryAfterUninstall indicates if this is a retry after uninstalling (prevents infinite recursion)
func (i *Installer) Install(packageIdentifier string) *InstallResult {
	return i.installWithRetry(packageIdentifier, false)
}

// installWithRetry is the internal implementation that supports retry logic
func (i *Installer) installWithRetry(packageIdentifier string, retryAfterUninstall bool) *InstallResult {
	result := &InstallResult{
		PackageIdentifier: packageIdentifier,
	}

	// Get winget executable path
	wingetCmd := getWingetCommand()
	
	// Build winget install command
	// Use --silent for non-interactive installation
	// Use --accept-package-agreements and --accept-source-agreements to auto-accept
	cmd := exec.Command(wingetCmd, "install",
		"--id", packageIdentifier,
		"--silent",
		"--accept-package-agreements",
		"--accept-source-agreements",
	)

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err := cmd.Run()

	output := stdout.String()
	if stderr.Len() > 0 {
		output += "\n" + stderr.String()
	}

	result.Message = strings.TrimSpace(output)

	if err != nil {
		result.Success = false
		result.Error = fmt.Errorf("winget install failed: %w", err)

		// Check for common error messages
		if strings.Contains(output, "No applicable update found") {
			result.Message = "Package already up to date"
		} else if strings.Contains(output, "No package found") {
			result.Message = "Package not found in winget repository"
		} else if !retryAfterUninstall && (strings.Contains(output, "install technology is different") || 
			strings.Contains(output, "install technology is different from the current version")) {
			// Handle case where package needs to be uninstalled first
			// Error message: "A newer version was found, but the install technology is different from the current version installed. Please uninstall the package and install the newer version."
			result.Message = "Uninstalling old version (different install technology)..."
			
			// Attempt to uninstall the old version
			if uninstallErr := i.Uninstall(packageIdentifier); uninstallErr != nil {
				result.Message = fmt.Sprintf("Failed to uninstall old version: %v", uninstallErr)
				return result
			}
			
			// Retry installation after uninstall (with retry flag to prevent infinite recursion)
			result.Message = "Retrying installation after uninstall..."
			retryResult := i.installWithRetry(packageIdentifier, true)
			
			// Update result with retry attempt
			result.Success = retryResult.Success
			result.Message = retryResult.Message
			result.Error = retryResult.Error
			
			if retryResult.Success {
				result.Message = "Successfully installed (after uninstalling old version)"
			} else {
				result.Message = fmt.Sprintf("Failed after uninstall: %s", retryResult.Message)
			}
			
			return result
		}
	} else {
		result.Success = true
		// Simplify success message
		if strings.Contains(output, "Successfully installed") {
			result.Message = "Successfully installed"
		} else if strings.Contains(output, "No applicable update found") {
			result.Success = false
			result.Message = "Already up to date"
		}
	}

	return result
}

// InstallMultiple installs multiple packages
func (i *Installer) InstallMultiple(packageIdentifiers []string) []*InstallResult {
	results := make([]*InstallResult, 0, len(packageIdentifiers))

	for _, pkgID := range packageIdentifiers {
		result := i.Install(pkgID)
		results = append(results, result)
	}

	return results
}

// CanInstall checks if winget is available on the system
func (i *Installer) CanInstall() error {
	wingetCmd := getWingetCommand()
	cmd := exec.Command(wingetCmd, "--version")
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("winget is not available at %s: %w", wingetCmd, err)
	}
	return nil
}
