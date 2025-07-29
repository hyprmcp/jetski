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
