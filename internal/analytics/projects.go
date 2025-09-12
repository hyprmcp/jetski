package analytics

import (
	"context"
	"encoding/json"
	"fmt"
	"maps"
	"slices"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/hyprmcp/jetski/internal/db"
	"github.com/hyprmcp/jetski/internal/lists"
	"github.com/hyprmcp/jetski/internal/types"
	"github.com/hyprmcp/jetski/internal/util"
	"github.com/modelcontextprotocol/go-sdk/mcp"
	"github.com/sourcegraph/jsonrpc2"
)

// GetProjectAnalytics retrieves and aggregates analytics data for a project from the database
func GetProjectAnalytics(ctx context.Context, projectID uuid.UUID, startAt time.Time, buildNumber *int) (*types.ProjectAnalytics, error) {
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
func getAllLogsWithComparison(ctx context.Context, projectID uuid.UUID, startAt time.Time, buildNumber *int) ([]types.MCPServerLog, []types.MCPServerLog, error) {
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

func needsAttention(tool types.PerformingTool) bool {
	return tool.ErrorRate > 0.05 || tool.AvgLatency > time.Second.Milliseconds()
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

// calculateRecentSessions computes recent session data
func calculateRecentSessions(logs []types.MCPServerLog) types.RecentSessions {
	sessionData := make(map[string]*sessionInfo)

	for _, log := range logs {
		sessionID := getNormalizedSessionID(log)

		if sessionID == nil {
			continue
		}

		session, exists := sessionData[*sessionID]
		if !exists {
			session = &sessionInfo{
				sessionID:      *sessionID,
				firstStartedAt: log.StartedAt,
				lastStartedAt:  log.StartedAt,
				lastDuration:   log.Duration,
			}
			sessionData[*sessionID] = session
		} else if session.lastStartedAt.Add(session.lastDuration).Before(log.StartedAt.Add(log.Duration)) {
			session.lastStartedAt = log.StartedAt
			session.lastDuration = log.Duration
		}

		session.calls++

		if log.IsError() {
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
			User:         getNormalizedUserAgent(session.userAgent),
			Calls:        session.calls,
			Errors:       session.errors,
			LastToolCall: session.lastToolCall,
			StartedAt:    session.firstStartedAt,
			EndedAt:      session.lastStartedAt.Add(session.lastDuration),
		})
	}

	slices.SortFunc(sessions, func(a, b types.RecentSession) int {
		return int(b.EndedAt.Sub(a.EndedAt).Milliseconds())
	})

	return types.RecentSessions{
		Sessions: sessions,
	}
}

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
