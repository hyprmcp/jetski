package analytics

import (
	"slices"
	"time"

	"github.com/hyprmcp/jetski/internal/types"
)

// calculateToolsPerformance computes tools performance metrics
func calculateToolsPerformance(logs []types.MCPServerLog) types.ToolsPerformance {
	toolStats := make(map[string]*toolPerformanceStats)

	for _, log := range logs {
		toolName := extractToolName(log.MCPRequest)
		if toolName == "" {
			continue
		}

		if _, exists := toolStats[toolName]; !exists {
			toolStats[toolName] = &toolPerformanceStats{}
		}

		stats := toolStats[toolName]
		stats.totalCalls++
		stats.totalDuration += log.Duration

		if log.IsError() {
			stats.errorCalls++
		}
	}

	// Convert to slice for sorting
	allTools := make([]types.PerformingTool, 0, len(toolStats))
	toolsNeedingAttention := make([]types.PerformingTool, 0)

	for toolName, stats := range toolStats {
		tool := types.PerformingTool{
			Name:       toolName,
			TotalCalls: stats.totalCalls,
		}

		if stats.totalCalls > 0 {
			tool.ErrorRate = float64(stats.errorCalls) / float64(stats.totalCalls)
			tool.AvgLatency = stats.totalDuration.Milliseconds() / stats.totalCalls
		}

		allTools = append(allTools, tool)

		if needsAttention(tool) {
			toolsNeedingAttention = append(toolsNeedingAttention, tool)
		}
	}

	// Sort by successful calls (descending) and then by avg latency (ascending)
	slices.SortFunc(allTools, func(a, b types.PerformingTool) int { return int(b.TotalCalls) - int(a.TotalCalls) })
	slices.SortFunc(toolsNeedingAttention, func(a, b types.PerformingTool) int { return int(a.ErrorRate*100) - int(b.ErrorRate*100) })

	var topPerforming []types.PerformingTool
	if len(allTools) < 5 {
		topPerforming = allTools[:]
	} else {
		topPerforming = allTools[:5]
	}

	return types.ToolsPerformance{
		TopPerformingTools:      topPerforming,
		ToolsRequiringAttention: toolsNeedingAttention,
	}
}

// needsAttention checks if a tool should be listed under the "operations requiring attention" view.
//
// Don't forget to update the UI code when changing this function.
func needsAttention(tool types.PerformingTool) bool {
	return tool.ErrorRate > 0.05 || tool.AvgLatency > time.Second.Milliseconds()
}
