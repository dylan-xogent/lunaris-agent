package winget

import (
	"bufio"
	"bytes"
	"fmt"
	"os/exec"
	"regexp"
	"strings"

	"github.com/lunaris/agent/internal/api"
)

// Scanner handles WinGet update scanning
type Scanner struct{}

// NewScanner creates a new WinGet scanner
func NewScanner() *Scanner {
	return &Scanner{}
}

// Update represents an available update from WinGet
type Update struct {
	PackageIdentifier string
	PackageName       string
	InstalledVersion  string
	AvailableVersion  string
}

// ScanUpdates runs winget upgrade and parses available updates
func (s *Scanner) ScanUpdates() ([]Update, error) {
	// Get winget executable path
	wingetCmd := getWingetCommand()
	
	// Run winget upgrade command
	cmd := exec.Command(wingetCmd, "upgrade", "--include-unknown")
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err := cmd.Run()
	// WinGet can return non-zero even with updates available
	// So we check if we got any output
	if stdout.Len() == 0 && err != nil {
		return nil, fmt.Errorf("winget command failed: %w (stderr: %s)", err, stderr.String())
	}

	return parseWingetOutput(stdout.String()), nil
}

// parseWingetOutput parses the output of winget upgrade command
func parseWingetOutput(output string) []Update {
	var updates []Update
	scanner := bufio.NewScanner(strings.NewReader(output))

	// Skip header lines until we find the separator
	inData := false
	headerPattern := regexp.MustCompile(`^-+$`)
	
	var currentLine strings.Builder

	for scanner.Scan() {
		line := scanner.Text()

		// Look for the separator line (-----)
		if headerPattern.MatchString(strings.TrimSpace(line)) {
			inData = true
			// If we have a buffered line, parse it before moving on
			if currentLine.Len() > 0 {
				update := parseUpdateLine(currentLine.String())
				if update != nil {
					updates = append(updates, *update)
				}
				currentLine.Reset()
			}
			continue
		}

		if !inData {
			continue
		}

		// Skip empty lines and footer
		trimmed := strings.TrimSpace(line)
		if trimmed == "" {
			// Empty line might indicate end of current entry
			if currentLine.Len() > 0 {
				update := parseUpdateLine(currentLine.String())
				if update != nil {
					updates = append(updates, *update)
				}
				currentLine.Reset()
			}
			continue
		}
		if strings.Contains(line, "upgrades available") {
			// Parse any remaining buffered line
			if currentLine.Len() > 0 {
				update := parseUpdateLine(currentLine.String())
				if update != nil {
					updates = append(updates, *update)
				}
				currentLine.Reset()
			}
			continue
		}

		// Join continuation lines - if current line doesn't end with "winget", it's incomplete
		if currentLine.Len() > 0 {
			currentStr := strings.TrimSpace(currentLine.String())
			// Check if current line is complete (ends with "winget")
			if strings.HasSuffix(currentStr, "winget") {
				// Current line is complete, parse it and start new one
				update := parseUpdateLine(currentStr)
				if update != nil {
					updates = append(updates, *update)
				}
				currentLine.Reset()
				currentLine.WriteString(trimmed)
			} else {
				// Append to current line (continuation) - join with space
				currentLine.WriteString(" ")
				currentLine.WriteString(trimmed)
			}
		} else {
			// Start new line
			currentLine.WriteString(trimmed)
		}
	}

	// Parse any remaining buffered line
	if currentLine.Len() > 0 {
		update := parseUpdateLine(strings.TrimSpace(currentLine.String()))
		if update != nil {
			updates = append(updates, *update)
		}
	}

	return updates
}

// parseUpdateLine parses a single line from winget upgrade output
// Format: Name    Id    Version    Available    Source
func parseUpdateLine(line string) *Update {
	// WinGet output is space-aligned, we need to parse carefully
	// The columns are: Name, Id, Version, Available, Source
	// Package names can contain spaces, so we parse from the end backwards

	line = strings.TrimRight(line, " \t")
	if line == "" {
		return nil
	}

	// Parse from the end backwards since the last columns are more predictable
	// Source is always "winget" (or similar), then Available, then Version, then Id, then Name (which can have spaces)

	// Find the last field (Source) - it's typically "winget" and separated by 1+ spaces
	// Look for the pattern: 1+ spaces, then a word (Source), then optional trailing spaces
	sourcePattern := regexp.MustCompile(`\s+(\w+)\s*$`)
	sourceMatch := sourcePattern.FindStringSubmatch(line)
	if len(sourceMatch) < 2 {
		return nil
	}
	// Remove source from line by finding the start position of the match
	sourceStart := sourcePattern.FindStringIndex(line)
	if sourceStart == nil {
		return nil
	}
	line = strings.TrimRight(line[:sourceStart[0]], " \t")

	// Now find Available version (before Source)
	// Look for the last occurrence of 1+ spaces followed by a version-like string
	// Version strings can contain dots, letters, numbers, hyphens, and may be truncated with …
	versionPattern := regexp.MustCompile(`\s+([^\s]+)\s*$`)
	availableMatch := versionPattern.FindStringSubmatch(line)
	if len(availableMatch) < 2 {
		return nil
	}
	availableVersion := strings.TrimSpace(availableMatch[1])
	availableStart := versionPattern.FindStringIndex(line)
	if availableStart == nil {
		return nil
	}
	line = strings.TrimRight(line[:availableStart[0]], " \t")

	// Find Installed Version (before Available)
	installedMatch := versionPattern.FindStringSubmatch(line)
	if len(installedMatch) < 2 {
		return nil
	}
	installedVersion := strings.TrimSpace(installedMatch[1])
	installedStart := versionPattern.FindStringIndex(line)
	if installedStart == nil {
		return nil
	}
	line = strings.TrimRight(line[:installedStart[0]], " \t")

	// Find Package Identifier (before Version)
	// Package IDs are typically in format like "Publisher.Package" or "Publisher.Package.Version"
	// They may also be truncated with …
	idMatch := versionPattern.FindStringSubmatch(line)
	if len(idMatch) < 2 {
		return nil
	}
	packageID := strings.TrimSpace(idMatch[1])
	idStart := versionPattern.FindStringIndex(line)
	if idStart == nil {
		return nil
	}
	line = strings.TrimRight(line[:idStart[0]], " \t")

	// Remaining part is the Package Name (can contain spaces)
	packageName := strings.TrimSpace(line)

	// Validate we have all required fields
	if packageName == "" || packageID == "" || installedVersion == "" || availableVersion == "" {
		// Log for debugging - but we can't use logger here, so just return nil
		return nil
	}

	return &Update{
		PackageName:       packageName,
		PackageIdentifier: packageID,
		InstalledVersion:  installedVersion,
		AvailableVersion:  availableVersion,
	}
}

// ToAPIUpdates converts scanner updates to API update items
func ToAPIUpdates(updates []Update) []api.UpdateItem {
	items := make([]api.UpdateItem, len(updates))
	for i, u := range updates {
		installed := u.InstalledVersion
		items[i] = api.UpdateItem{
			PackageIdentifier: u.PackageIdentifier,
			PackageName:       u.PackageName,
			InstalledVersion:  &installed,
			AvailableVersion:  u.AvailableVersion,
			Source:            "winget",
		}
	}
	return items
}

