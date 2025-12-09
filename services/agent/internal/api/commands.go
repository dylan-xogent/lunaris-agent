package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

// Command represents a command from the server
type Command struct {
	ID                 string   `json:"id"`
	Type               string   `json:"type"`
	PackageIdentifiers []string `json:"packageIdentifiers"`
	CreatedAt          string   `json:"createdAt"`
}

// CommandsResponse represents the response from polling for commands
type CommandsResponse struct {
	Commands []Command `json:"commands"`
}

// CompleteCommandRequest represents a command completion request
type CompleteCommandRequest struct {
	Success bool   `json:"success"`
	Result  string `json:"result,omitempty"`
}

// GetPendingCommands polls for pending commands from the server
func (c *Client) GetPendingCommands(deviceID string) (*CommandsResponse, error) {
	url := fmt.Sprintf("%s/agent/commands/%s", c.baseURL, deviceID)

	resp, err := http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to get commands: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("get commands failed with status: %d", resp.StatusCode)
	}

	var cmdResp CommandsResponse
	if err := json.NewDecoder(resp.Body).Decode(&cmdResp); err != nil {
		return nil, fmt.Errorf("failed to decode commands: %w", err)
	}

	return &cmdResp, nil
}

// CompleteCommand marks a command as completed
func (c *Client) CompleteCommand(commandID string, success bool, result string) error {
	url := fmt.Sprintf("%s/agent/commands/%s/complete", c.baseURL, commandID)

	reqBody := CompleteCommandRequest{
		Success: success,
		Result:  result,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequest(http.MethodPatch, url, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to complete command: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("complete command failed with status: %d", resp.StatusCode)
	}

	return nil
}
