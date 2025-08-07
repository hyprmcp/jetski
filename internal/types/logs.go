package types

type MCPServerLogWithBuildNumber struct {
	MCPServerLog
	BuildNumber int `json:"buildNumber"`
}
