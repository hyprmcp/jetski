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
		if log.UserAgent == nil {
			continue
		}

		client := getNormalizedUserAgent(*log.UserAgent)
		usage, exists := clientUsageMap[client]
		if !exists {
			usage = types.ClientUsageData{Name: client, Requests: 1}
		} else {
			usage.Requests++
		}
		clientUsageMap[client] = usage
	}

	return types.ClientUsage{
		// TODO: Check why this is needed here again, it is calculated twice
		TotalSessions: countUniqueSessions(logs),
		Clients:       slices.Collect(maps.Values(clientUsageMap)),
	}
}
