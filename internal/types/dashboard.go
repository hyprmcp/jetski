package types

type ProjectSummary struct {
	Project
	Organization                  Organization             `json:"organization"`
	LatestDeploymentRevision      *DeploymentRevision      `json:"latestDeploymentRevision,omitempty"`
	LatestDeploymentRevisionEvent *DeploymentRevisionEvent `json:"latestDeploymentRevisionEvent,omitempty"`
}

type DeploymentRevisionSummary struct {
	DeploymentRevision
	Project                              Project                 `json:"project"`
	Author                               UserAccount             `json:"author"`
	ProjectLatestDeploymentRevisionEvent DeploymentRevisionEvent `json:"projectLatestDeploymentRevisionEvent"`
}

type Usage struct {
	SessionCount int `db:"session_count" json:"sessionCount"`
	RequestCount int `db:"request_count" json:"requestCount"`
}
