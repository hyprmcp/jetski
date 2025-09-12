package analytics

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/hyprmcp/jetski/internal/db"
	"github.com/hyprmcp/jetski/internal/lists"
	"github.com/hyprmcp/jetski/internal/types"
)

// GetProjectAnalytics retrieves and aggregates analytics data for a project from the database
func GetProjectAnalytics(ctx context.Context, projectID uuid.UUID, startAt time.Time) (*types.ProjectAnalytics, error) {
	// Get current period logs and previous period logs for comparison
	currentLogs, previousLogs, err := getAllLogsWithComparison(ctx, projectID, startAt)
	if err != nil {
		return nil, fmt.Errorf("failed to get logs for project: %w", err)
	}

	// Aggregate the logs into analytics data
	analytics := aggregateLogsToAnalyticsWithComparison(currentLogs, previousLogs)
	return analytics, nil
}

// getAllLogsWithComparison gets logs for current period and previous period for comparison
func getAllLogsWithComparison(ctx context.Context, projectID uuid.UUID, startAt time.Time) ([]types.MCPServerLog, []types.MCPServerLog, error) {
	// Use a high pagination count to get all logs and sort by started_at ASC
	pagination := lists.Pagination{Count: 1000000}

	sorting := lists.Sorting{
		SortBy:    "started_at",
		SortOrder: lists.SortOrderAsc,
	}

	logs, err := db.GetLogsForProject(ctx, projectID, pagination, sorting, nil, nil)
	if err != nil {
		return nil, nil, err
	}

	curentPeriodEnd := time.Now()
	currentPeriodStart := startAt
	periodDuration := curentPeriodEnd.Sub(currentPeriodStart)
	previousPeriodStart := currentPeriodStart.Add(-periodDuration) // Double the period backwards
	previousPeriodEnd := currentPeriodStart

	currentLogs := make([]types.MCPServerLog, 0)
	previousLogs := make([]types.MCPServerLog, 0)

	for _, log := range logs {
		if !log.StartedAt.Before(currentPeriodStart) {
			// Current period: from currentPeriodStart to now
			currentLogs = append(currentLogs, log)
		} else if !log.StartedAt.Before(previousPeriodStart) && log.StartedAt.Before(previousPeriodEnd) {
			// Previous period: from (currentPeriodStart - periodDuration) to currentPeriodStart
			previousLogs = append(previousLogs, log)
		}
	}

	return currentLogs, previousLogs, nil
}

// aggregateLogsToAnalyticsWithComparison converts raw MCP server logs into aggregated analytics data with period comparison
func aggregateLogsToAnalyticsWithComparison(currentLogs []types.MCPServerLog, previousLogs []types.MCPServerLog) *types.ProjectAnalytics {
	// Initialize analytics structure
	analytics := &types.ProjectAnalytics{
		Overview:         calculateOverviewWithComparison(currentLogs, previousLogs),
		ToolsPerformance: calculateToolsPerformance(currentLogs),
		ToolAnalytics:    calculateToolAnalytics(currentLogs),
		PromptAnalytics:  calculatePromptAnalytics(currentLogs),
		ClientUsage:      calculateClientUsage(currentLogs),
		RecentSessions:   calculateRecentSessions(currentLogs),
	}
	return analytics
}
