package types

type OrganizationDashboardUsage struct {
	SessionCount int `db:"session_count" json:"sessionCount"`
	RequestCount int `db:"request_count" json:"requestCount"`
}
