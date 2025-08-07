package types

type ProjectAnalytics struct {
	Overview         Overview         `json:"overview"`
	ToolsPerformance ToolsPerformance `json:"toolsPerformance"`
	ToolAnalytics    ToolAnalytics    `json:"toolAnalytics"`
	ClientUsage      ClientUsage      `json:"clientUsage"`
	RecentSessions   RecentSessions   `json:"recentSessions"`
}

// Overview represents the overview analytics data
type Overview struct {
	TotalSessionCount    int     `json:"totalSessionCount"`
	TotalSessionChange   float64 `json:"totalSessionChange"`
	TotalToolCallsCount  int     `json:"totalToolCallsCount"`
	TotalToolCallsChange float64 `json:"totalToolCallsChange"`
	UsersCount           int     `json:"usersCount"`
	UsersChange          float64 `json:"usersChange"`
	AvgLatencyValue      int     `json:"avgLatencyValue"`
	AvgLatencyChange     float64 `json:"avgLatencyChange"`
	ErrorRateValue       float64 `json:"errorRateValue"`
	ErrorRateChange      float64 `json:"errorRateChange"`
}

// ToolsPerformance represents tools performance analytics
type ToolsPerformance struct {
	TopPerformingTools      []PerformingTool `json:"topPerformingTools"`
	ToolsRequiringAttention []PerformingTool `json:"toolsRequiringAttention"`
}

type PerformingTool struct {
	Name        string  `json:"name"`
	Calls       int     `json:"calls"`
	SuccessRate float64 `json:"successRate"`
	AvgLatency  int     `json:"avgLatency"`
}

// ToolAnalytics represents detailed tool usage analytics
type ToolAnalytics struct {
	Tools []McpTool `json:"tools"`
}

type McpTool struct {
	Name       string          `json:"name"`
	Calls      int             `json:"calls"`
	Arguments []ToolArgument `json:"arguments"`
}

type ToolArgument struct {
	Name       string          `json:"name"`
	UsageCount int             `json:"usageCount"`
	Values     []ArgumentValue `json:"values"`
}

type ArgumentValue struct {
	Name  string `json:"name"`
	Count int    `json:"count"`
}

// ClientUsage represents client usage analytics
type ClientUsage struct {
	TotalSessions int                `json:"totalSessions"`
	Clients       []ClientUsageData  `json:"clients"`
}

type ClientUsageData struct {
	Name     string `json:"name"`
	Sessions int    `json:"sessions"`
}

// RecentSessions represents recent session data
type RecentSessions struct {
	Sessions []RecentSession `json:"sessions"`
}

type RecentSession struct {
	SessionID    string `json:"sessionId"`
	User         string `json:"user"`
	Duration     string `json:"duration"`
	Calls        int    `json:"calls"`
	Errors       int    `json:"errors"`
	LastToolCall string `json:"lastToolCall"`
	StartedAgo   string `json:"startedAgo"`
}
