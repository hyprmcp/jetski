package analytics

import (
	"time"

	"github.com/hyprmcp/jetski/internal/types"
)

// calculateOverviewWithComparison computes overview metrics from logs with comparison to previous period
func calculateOverviewWithComparison(currentLogs []types.MCPServerLog, previousLogs []types.MCPServerLog) types.Overview {
	// Current period metrics
	currentTotalSessions := countUniqueSessions(currentLogs)
	currentTotalToolCalls := len(currentLogs)
	currentUniqueUsers := countUniqueUsers(currentLogs)
	currentAvgLatency, currentErrorRate := calculateLatencyAndErrorRate(currentLogs)

	// Previous period metrics
	previousTotalSessions := countUniqueSessions(previousLogs)
	previousTotalToolCalls := len(previousLogs)
	previousUniqueUsers := countUniqueUsers(previousLogs)
	previousAvgLatency, previousErrorRate := calculateLatencyAndErrorRate(previousLogs)

	// Calculate percentage changes
	sessionChange := calculatePercentageChange(previousTotalSessions, currentTotalSessions)
	toolCallsChange := calculatePercentageChange(previousTotalToolCalls, currentTotalToolCalls)
	usersChange := calculatePercentageChange(previousUniqueUsers, currentUniqueUsers)
	latencyChange := calculatePercentageChange(previousAvgLatency, currentAvgLatency)
	errorRateChange := calculatePercentageChange(previousErrorRate, currentErrorRate)

	return types.Overview{
		TotalSessionCount:    currentTotalSessions,
		TotalSessionChange:   sessionChange,
		TotalToolCallsCount:  currentTotalToolCalls,
		TotalToolCallsChange: toolCallsChange,
		UsersCount:           currentUniqueUsers,
		UsersChange:          usersChange,
		AvgLatencyValue:      currentAvgLatency,
		AvgLatencyChange:     latencyChange,
		ErrorRateValue:       currentErrorRate,
		ErrorRateChange:      errorRateChange,
	}
}

// calculateLatencyAndErrorRate calculates average latency and error rate from logs
func calculateLatencyAndErrorRate(logs []types.MCPServerLog) (int, float64) {
	if len(logs) == 0 {
		return 0, 0.0
	}

	// Calculate average latency (duration in milliseconds)
	var totalDuration time.Duration
	for _, log := range logs {
		totalDuration += log.Duration
	}
	avgLatency := int(totalDuration.Milliseconds()) / len(logs)

	// Calculate error rate
	errorCount := 0
	for _, log := range logs {
		if log.IsError() {
			errorCount++
		}
	}

	errorRate := float64(errorCount) / float64(len(logs))

	return avgLatency, errorRate
}

// calculatePercentageChange calculates percentage change between previous and current values
func calculatePercentageChange[T int | float64](previous, current T) float64 {
	if previous == 0 {
		if current == 0 {
			return 0
		}
		return 1 // If previous was 0 and current > 0, show 100% increase
	}
	return float64(current-previous) / float64(previous)
}
