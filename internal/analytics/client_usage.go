package analytics

import (
	"maps"
	"slices"

	"github.com/hyprmcp/jetski/internal/types"
)

// calculateClientUsage computes client usage statistics
func calculateClientUsage(logs []types.MCPServerLog) types.ClientUsage {
	clientUsageMap := make(map[string]types.ClientUsageData)
	for _, log := range logs {
		client := "unknown"
		if log.UserAgent != nil {
			client = getNormalizedUserAgent(*log.UserAgent)
		}

		usage, exists := clientUsageMap[client]
		if !exists {
			usage = types.ClientUsageData{Name: client, Requests: 1}
		} else {
			usage.Requests++
		}
		clientUsageMap[client] = usage
	}

	return types.ClientUsage{
		TotalRequests: len(logs),
		Clients:       slices.Collect(maps.Values(clientUsageMap)),
	}
}
