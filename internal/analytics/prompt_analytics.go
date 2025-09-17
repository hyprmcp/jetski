package analytics

import (
	"encoding/json"
	"slices"

	"github.com/hyprmcp/jetski/internal/types"
	"github.com/modelcontextprotocol/go-sdk/mcp"
)

func calculatePromptAnalytics(logs []types.MCPServerLog) types.PromptAnalytics {
	const maxResults = 25
	result := make([]types.MCPPrompt, 0, maxResults)

	for _, log := range slices.Backward(logs) {
		if log.MCPRequest != nil && log.MCPRequest.Method == "tools/call" && log.MCPRequest.Params != nil {
			var toolParams mcp.CallToolParams
			if err := json.Unmarshal(*log.MCPRequest.Params, &toolParams); err != nil {
				continue
			}

			if argMap, ok := toolParams.Arguments.(map[string]any); ok {
				if prompt, ok := argMap["hyprmcpPromptAnalytics"].(string); ok {
					result = append(result, types.MCPPrompt{
						ID:       log.ID,
						ToolName: toolParams.Name,
						Prompt:   prompt,
					})

					if len(result) >= maxResults {
						break
					}
				}
			}
		}
	}

	return types.PromptAnalytics{Prompts: result}
}
