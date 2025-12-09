package winget

import (
	"bufio"
	"bytes"
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
	// Run winget upgrade command
	cmd := exec.Command("winget", "upgrade", "--include-unknown")
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err := cmd.Run()
	// WinGet can return non-zero even with updates available
	// So we check if we got any output
	if stdout.Len() == 0 && err != nil {
		return nil, err
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

	for scanner.Scan() {
		line := scanner.Text()

		// Look for the separator line (-----)
		if headerPattern.MatchString(strings.TrimSpace(line)) {
			inData = true
			continue
		}

		if !inData {
			continue
		}

		// Skip empty lines and footer
		if strings.TrimSpace(line) == "" {
			continue
		}
		if strings.Contains(line, "upgrades available") {
			continue
		}

		// Parse the update line
		update := parseUpdateLine(line)
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

	// Split by multiple spaces (2 or more)
	parts := regexp.MustCompile(`\s{2,}`).Split(strings.TrimSpace(line), -1)

	if len(parts) < 4 {
		return nil
	}

	// Filter out empty parts
	var filtered []string
	for _, p := range parts {
		if strings.TrimSpace(p) != "" {
			filtered = append(filtered, strings.TrimSpace(p))
		}
	}

	if len(filtered) < 4 {
		return nil
	}

	return &Update{
		PackageName:       filtered[0],
		PackageIdentifier: filtered[1],
		InstalledVersion:  filtered[2],
		AvailableVersion:  filtered[3],
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

