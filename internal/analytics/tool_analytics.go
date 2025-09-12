package analytics

import (
	"slices"
	"strings"

	"github.com/hyprmcp/jetski/internal/types"
)

// calculateToolAnalytics computes detailed tool usage analytics
func calculateToolAnalytics(logs []types.MCPServerLog) types.ToolAnalytics {
	toolData := make(map[string]*toolAnalyticsData)

	for _, log := range logs {
		toolName := extractToolName(log.MCPRequest)
		if toolName == "" {
			continue
		}

		if _, exists := toolData[toolName]; !exists {
			toolData[toolName] = &toolAnalyticsData{
				calls:     0,
				arguments: make(map[string]map[string]int),
			}
		}

		data := toolData[toolName]
		data.calls++

		// Extract arguments from the MCP request
		for argName, argValue := range extractArguments(log.MCPRequest) {
			if _, exists := data.arguments[argName]; !exists {
				data.arguments[argName] = make(map[string]int)
			}
			data.arguments[argName][argValue]++
		}
	}

	// Convert to the required structure
	tools := make([]types.McpTool, 0)
	for toolName, data := range toolData {
		arguments := make([]types.ToolArgument, 0)
		for argName, values := range data.arguments {
			argValues := make([]types.ArgumentValue, 0)
			totalUsage := 0
			for valueName, count := range values {
				argValues = append(argValues, types.ArgumentValue{
					Name:  valueName,
					Count: count,
				})
				totalUsage += count
			}
			arguments = append(arguments, types.ToolArgument{
				Name:       argName,
				UsageCount: totalUsage,
				Values:     argValues,
			})
		}

		tools = append(tools, types.McpTool{
			Name:      toolName,
			Calls:     data.calls,
			Arguments: arguments,
		})
	}

	slices.SortFunc(tools, func(a, b types.McpTool) int { return strings.Compare(a.Name, b.Name) })

	return types.ToolAnalytics{
		Tools: tools,
	}
}
