package types

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/modelcontextprotocol/go-sdk/mcp"
	"github.com/sourcegraph/jsonrpc2"
)

type MCPServerLog struct {
	ID                   uuid.UUID          `db:"id" json:"id"`
	UserAccountID        *uuid.UUID         `db:"user_account_id" json:"userAccountId"`
	MCPSessionID         *string            `db:"mcp_session_id" json:"mcpSessionId"`
	StartedAt            time.Time          `db:"started_at" json:"startedAt"`
	Duration             time.Duration      `db:"duration" json:"duration"`
	DeploymentRevisionID uuid.UUID          `db:"deployment_revision_id" json:"deploymentRevisionId"`
	AuthTokenDigest      *string            `db:"auth_token_digest" json:"authTokenDigest"`
	MCPRequest           *jsonrpc2.Request  `db:"mcp_request" json:"mcpRequest,omitempty"`
	MCPResponse          *jsonrpc2.Response `db:"mcp_response" json:"mcpResponse,omitempty"`
	UserAgent            *string            `db:"user_agent" json:"userAgent,omitempty"`
	HttpStatusCode       *int               `db:"http_status_code" json:"httpStatusCode,omitempty"`
	HttpError            *string            `db:"http_error" json:"httpError,omitempty"`
}

func (log *MCPServerLog) IsError() bool {
	if log.HttpStatusCode != nil && *log.HttpStatusCode >= 400 {
		// HTTP error
		return true
	}

	if log.MCPResponse != nil {
		if log.MCPResponse.Error != nil {
			// JSON-RPC error
			return true
		}

		if log.MCPRequest.Method == "tools/call" && log.MCPResponse.Result != nil {
			var result mcp.CallToolResult
			if err := json.Unmarshal(*log.MCPResponse.Result, &result); err == nil {
				// MCP error
				return result.IsError
			}
		}
	}

	return false
}

type MCPServerLogPromptData struct {
	ID        uuid.UUID `json:"id"`
	StartedAt time.Time `json:"startedAt"`
	Method    string    `json:"method"`
	ToolName  string    `json:"toolName"`
	Prompt    string    `json:"prompt"`
}
