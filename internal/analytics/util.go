package analytics

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/hyprmcp/jetski/internal/types"
	"github.com/hyprmcp/jetski/internal/util"
	"github.com/modelcontextprotocol/go-sdk/mcp"
	"github.com/sourcegraph/jsonrpc2"
)

// Helper types and functions

type toolPerformanceStats struct {
	totalCalls    int64
	errorCalls    int64
	totalDuration time.Duration
}

type toolAnalyticsData struct {
	calls     int
	arguments map[string]map[string]int
}

type sessionInfo struct {
	sessionID      string
	firstStartedAt time.Time
	lastStartedAt  time.Time
	lastDuration   time.Duration
	calls          int
	errors         int
	userAgent      string
	lastToolCall   string
}

// extractToolName extracts the tool name from an MCP request
func extractToolName(mcpRequest *jsonrpc2.Request) string {
	if mcpRequest == nil {
		return ""
	}

	if mcpRequest.Method == "tools/call" && mcpRequest.Params != nil {
		// Extract tool name from params
		var params mcp.CallToolParams
		if err := json.Unmarshal(*mcpRequest.Params, &params); err == nil {
			return params.Name
		}
	}

	return mcpRequest.Method
}

// extractArguments extracts arguments from an MCP request
func extractArguments(mcpRequest *jsonrpc2.Request) map[string]string {
	if mcpRequest != nil && mcpRequest.Method == "tools/call" && mcpRequest.Params != nil {
		var params mcp.CallToolParams
		if err := json.Unmarshal(*mcpRequest.Params, &params); err == nil {
			if args, ok := params.Arguments.(map[string]any); ok {
				strArgs := make(map[string]string, len(args))
				for key, val := range args {
					if strVal, ok := val.(string); ok {
						strArgs[key] = strVal
					} else if data, err := json.Marshal(val); err != nil {
						strArgs[key] = fmt.Sprintf("%v", val)
					} else {
						strArgs[key] = string(data)
					}
				}
				return strArgs
			}
		}
	}

	return nil
}

// getNormalizedSessionID extracts or generates a session ID from a log entry
func getNormalizedSessionID(log types.MCPServerLog) *string {
	if log.MCPSessionID != nil && *log.MCPSessionID != "" {
		return log.MCPSessionID
	}

	return nil
}

func getUserIDString(log types.MCPServerLog) *string {
	if log.UserAccountID != nil {
		return util.PtrTo(log.UserAccountID.String())
	}
	return nil
}

// getNormalizedUserAgent normalizes user agent strings to standard client names
func getNormalizedUserAgent(userAgent string) string {
	ua := strings.ToLower(userAgent)

	if strings.Contains(ua, "cursor") {
		return "cursor"
	}

	if strings.Contains(ua, "claude") {
		if strings.Contains(ua, "code") {
			return "claude_code"
		}

		return "claude_pro"
	}

	if strings.Contains(ua, "chatgpt") || strings.Contains(ua, "openai") {
		return "chatgpt"
	}

	if strings.Contains(ua, "node") {
		return "node"
	}

	return "other"
}

// countUniqueSessions counts unique sessions in the logs
func countUniqueSessions(logs []types.MCPServerLog) int {
	return countUniqueFunc(logs, getNormalizedSessionID)
}

// countUniqueUsers counts unique users in the logs
func countUniqueUsers(logs []types.MCPServerLog) int {
	return countUniqueFunc(logs, getUserIDString)
}

func countUniqueFunc[T any, P comparable](s []T, p func(v T) *P) int {
	c := make(map[P]struct{})
	for _, v := range s {
		if pv := p(v); pv != nil {
			c[*pv] = struct{}{}
		}
	}
	return len(c)
}
