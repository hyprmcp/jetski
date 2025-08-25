package analytics

import (
	"context"
	"fmt"
	"slices"
	"sort"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/hyprmcp/jetski/internal/db"
	"github.com/hyprmcp/jetski/internal/lists"
	"github.com/hyprmcp/jetski/internal/types"
)

// GetProjectAnalytics retrieves and aggregates analytics data for a project from the database
func GetProjectAnalytics(ctx context.Context, projectID uuid.UUID, startAt *time.Time, buildNumber *int) (*types.ProjectAnalytics, error) {
	// Get current period logs and previous period logs for comparison
	currentLogs, previousLogs, err := getAllLogsWithComparison(ctx, projectID, startAt, buildNumber)
	if err != nil {
		return nil, fmt.Errorf("failed to get logs for project: %w", err)
	}

	// Aggregate the logs into analytics data
	analytics := aggregateLogsToAnalyticsWithComparison(currentLogs, previousLogs)
	return analytics, nil
}

// getAllLogsWithComparison gets logs for current period and previous period for comparison
func getAllLogsWithComparison(ctx context.Context, projectID uuid.UUID, startAt *time.Time, buildNumber *int) ([]types.MCPServerLog, []types.MCPServerLog, error) {
	// Use a high pagination count to get all logs and sort by started_at ASC
	pagination := lists.Pagination{Count: 1000000}

	sorting := lists.Sorting{
		SortBy:    "started_at",
		SortOrder: lists.SortOrderAsc,
	}

	logs, err := db.GetLogsForProject(ctx, projectID, pagination, sorting)
	if err != nil {
		return nil, nil, err
	}

	if startAt == nil {
		// If no startAt provided, return all logs as current and empty previous
		return logs, []types.MCPServerLog{}, nil
	}

	now := time.Now()
	currentPeriodStart := *startAt
	periodDuration := now.Sub(currentPeriodStart)
	previousPeriodStart := currentPeriodStart.Add(-periodDuration) // Double the period backwards
	previousPeriodEnd := currentPeriodStart

	currentLogs := make([]types.MCPServerLog, 0)
	previousLogs := make([]types.MCPServerLog, 0)

	for _, log := range logs {
		if log.StartedAt.After(currentPeriodStart) || log.StartedAt.Equal(currentPeriodStart) {
			// Current period: from startAt to now
			currentLogs = append(currentLogs, log)
		} else if log.StartedAt.After(previousPeriodStart) || log.StartedAt.Equal(previousPeriodStart) {
			// Previous period: from (startAt - period_duration) to startAt
			if log.StartedAt.Before(previousPeriodEnd) {
				previousLogs = append(previousLogs, log)
			}
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
		ClientUsage:      calculateClientUsage(currentLogs),
		RecentSessions:   calculateRecentSessions(currentLogs),
	}
	return analytics
}

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
	errorRateChange := calculatePercentageChange(int(previousErrorRate*100), int(currentErrorRate*100))

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
		if log.HttpStatusCode != nil && *log.HttpStatusCode >= 400 {
			errorCount++
		}
	}
	errorRate := float64(errorCount) / float64(len(logs)) * 100

	return avgLatency, errorRate
}

// calculatePercentageChange calculates percentage change between previous and current values
func calculatePercentageChange(previous, current int) float64 {
	if previous == 0 {
		if current == 0 {
			return 0.0
		}
		return 1 // If previous was 0 and current > 0, show 100% increase
	}
	return float64(current-previous) / float64(previous)
}

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
		stats.calls++
		stats.totalDuration += log.Duration

		if log.HttpStatusCode == nil || *log.HttpStatusCode < 400 {
			stats.successfulCalls++
		}
	}

	// Convert to slice for sorting
	allTools := make([]types.PerformingTool, 0, len(toolStats))
	for toolName, stats := range toolStats {
		successRate := 0.0
		if stats.calls > 0 {
			successRate = float64(stats.successfulCalls) / float64(stats.calls) * 100
		}

		avgLatency := 0
		if stats.calls > 0 {
			avgLatency = int(stats.totalDuration.Milliseconds()) / stats.calls
		}

		tool := types.PerformingTool{
			Name:        toolName,
			Calls:       stats.successfulCalls, // Use successful calls for sorting
			SuccessRate: successRate,
			AvgLatency:  avgLatency,
		}

		allTools = append(allTools, tool)
	}

	// Sort by successful calls (descending) and then by avg latency (ascending)
	sort.Slice(allTools, func(i, j int) bool {
		if allTools[i].Calls != allTools[j].Calls {
			return allTools[i].Calls > allTools[j].Calls
		}
		return allTools[i].AvgLatency < allTools[j].AvgLatency
	})

	// Restore original calls count after sorting
	for i := range allTools {
		toolName := allTools[i].Name
		allTools[i].Calls = toolStats[toolName].calls
	}

	var topPerforming []types.PerformingTool
	var needingAttention []types.PerformingTool

	totalTools := len(allTools)
	if totalTools < 50 {
		// If less than 50 tools, split in half
		midPoint := totalTools / 2
		topPerforming = allTools[:midPoint]
		needingAttention = allTools[midPoint:]
	} else {
		// Take top 25 and bottom 25
		topPerforming = allTools[:25]
		needingAttention = allTools[totalTools-25:]
	}

	// Reverse the needingAttention array so worst performing appear first
	for i, j := 0, len(needingAttention)-1; i < j; i, j = i+1, j-1 {
		needingAttention[i], needingAttention[j] = needingAttention[j], needingAttention[i]
	}

	return types.ToolsPerformance{
		TopPerformingTools:      topPerforming,
		ToolsRequiringAttention: needingAttention,
	}
}

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
		args := extractArguments(log.MCPRequest)
		for argName, argValue := range args {
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

// calculateClientUsage computes client usage statistics
func calculateClientUsage(logs []types.MCPServerLog) types.ClientUsage {
	clientSessions := make(map[string]map[string]bool) // client -> sessions

	for _, log := range logs {
		if log.UserAgent == nil {
			continue
		}

		client := normalizeUserAgent(*log.UserAgent)
		sessionID := getSessionID(log)

		if _, exists := clientSessions[client]; !exists {
			clientSessions[client] = make(map[string]bool)
		}
		clientSessions[client][sessionID] = true
	}

	clients := make([]types.ClientUsageData, 0)
	totalSessions := 0

	for client, sessions := range clientSessions {
		sessionCount := len(sessions)
		totalSessions += sessionCount
		clients = append(clients, types.ClientUsageData{
			Name:     client,
			Sessions: sessionCount,
		})
	}

	return types.ClientUsage{
		TotalSessions: totalSessions,
		Clients:       clients,
	}
}

// calculateRecentSessions computes recent session data
func calculateRecentSessions(logs []types.MCPServerLog) types.RecentSessions {
	sessionData := make(map[string]*sessionInfo)

	for _, log := range logs {
		sessionID := getSessionID(log)

		session, exists := sessionData[sessionID]
		if !exists {
			session = &sessionInfo{
				sessionID:      sessionID,
				firstStartedAt: log.StartedAt,
				lastStartedAt:  log.StartedAt,
				lastDuration:   log.Duration,
			}
			sessionData[sessionID] = session
		} else if session.lastStartedAt.Add(session.lastDuration).Before(log.StartedAt.Add(log.Duration)) {
			session.lastStartedAt = log.StartedAt
			session.lastDuration = log.Duration
		}

		session.calls++

		if log.HttpStatusCode != nil && *log.HttpStatusCode >= 400 {
			session.errors++
		}

		if log.UserAgent != nil {
			session.userAgent = *log.UserAgent
		}

		toolName := extractToolName(log.MCPRequest)
		if toolName != "" {
			session.lastToolCall = toolName
		}
	}

	// Convert to required format and get recent sessions
	sessions := make([]types.RecentSession, 0)
	for _, session := range sessionData {
		sessions = append(sessions, types.RecentSession{
			SessionID:    session.sessionID,
			User:         normalizeUserAgent(session.userAgent),
			Calls:        session.calls,
			Errors:       session.errors,
			LastToolCall: session.lastToolCall,
			StartedAt:    session.firstStartedAt,
			EndedAt:      session.lastStartedAt.Add(session.lastDuration),
		})
	}

	return types.RecentSessions{
		Sessions: sessions,
	}
}

// Helper types and functions

type toolPerformanceStats struct {
	calls           int
	successfulCalls int
	totalDuration   time.Duration
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
func extractToolName(mcpRequest any) string {
	if mcpRequest == nil {
		return ""
	}

	// Try to parse as JSON and extract method or tool name
	requestMap, ok := mcpRequest.(map[string]any)
	if !ok {
		return ""
	}

	// Check for method field (for tools/call requests)
	if method, exists := requestMap["method"]; exists {
		if methodStr, ok := method.(string); ok {
			if methodStr == "tools/call" {
				// Extract tool name from params
				if params, exists := requestMap["params"]; exists {
					if paramsMap, ok := params.(map[string]interface{}); ok {
						if name, exists := paramsMap["name"]; exists {
							if nameStr, ok := name.(string); ok {
								return nameStr
							}
						}
					}
				}
			}
			return methodStr
		}
	}

	return ""
}

// extractArguments extracts arguments from an MCP request
func extractArguments(mcpRequest any) map[string]string {
	args := make(map[string]string)

	if mcpRequest == nil {
		return args
	}

	requestMap, ok := mcpRequest.(map[string]any)
	if !ok {
		return args
	}

	// Extract arguments from tools/call request
	if paramsField, exists := requestMap["params"]; exists {
		if paramsMap, ok := paramsField.(map[string]any); ok {
			if arguments, exists := paramsMap["arguments"]; exists {
				if argsMap, ok := arguments.(map[string]any); ok {
					for key, value := range argsMap {
						args[key] = fmt.Sprintf("%v", value)
					}
				}
			}
		}
	}

	return args
}

// getSessionID extracts or generates a session ID from a log entry
func getSessionID(log types.MCPServerLog) string {
	if log.MCPSessionID != nil && *log.MCPSessionID != "" {
		return *log.MCPSessionID
	}

	// Generate a session ID based on user and time
	if log.UserAccountID != nil {
		return fmt.Sprintf("%s_%d", log.UserAccountID.String()[:8], log.StartedAt.Unix()/3600) // Group by hour
	}

	return fmt.Sprintf("session_%d", log.StartedAt.Unix()/3600)
}

// normalizeUserAgent normalizes user agent strings to standard client names
func normalizeUserAgent(userAgent string) string {
	ua := strings.ToLower(userAgent)

	if strings.Contains(ua, "cursor") {
		return "cursor"
	}
	if strings.Contains(ua, "claude") {
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
	sessions := make(map[string]bool)
	for _, log := range logs {
		sessionID := getSessionID(log)
		sessions[sessionID] = true
	}
	return len(sessions)
}

// countUniqueUsers counts unique users in the logs
func countUniqueUsers(logs []types.MCPServerLog) int {
	users := make(map[string]bool)
	for _, log := range logs {
		if log.UserAccountID != nil {
			users[log.UserAccountID.String()] = true
		}
	}
	return len(users)
}
