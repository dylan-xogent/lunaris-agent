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

// Install installs a single package using winget
func (i *Installer) Install(packageIdentifier string) *InstallResult {
	result := &InstallResult{
		PackageIdentifier: packageIdentifier,
	}

	// Build winget install command
	// Use --silent for non-interactive installation
	// Use --accept-package-agreements and --accept-source-agreements to auto-accept
	cmd := exec.Command("winget", "install",
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
	cmd := exec.Command("winget", "--version")
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("winget is not available: %w", err)
	}
	return nil
}
