package types

import (
	"fmt"
	"net/url"

	"github.com/hyprmcp/jetski/internal/env"
)

type ProjectSummary struct {
	Project
	Organization                  Organization             `json:"organization"`
	LatestDeploymentRevision      *DeploymentRevision      `json:"latestDeploymentRevision,omitempty"`
	LatestDeploymentRevisionEvent *DeploymentRevisionEvent `json:"latestDeploymentRevisionEvent,omitempty"`
}

func (ps *ProjectSummary) GetMCPURL() string {
	u := url.URL{
		Scheme: env.GatewayHostScheme(),
		Host:   fmt.Sprintf(env.GatewayHostFormat(), ps.Organization.Name),
		Path:   fmt.Sprintf(env.GatewayPathFormat(), ps.Name),
	}

	if customDomain := ps.Organization.Settings.CustomDomain; customDomain != nil {
		u.Host = *customDomain
	}

	return u.String()
}

type DeploymentRevisionSummary struct {
	DeploymentRevision
	Project                              Project                  `json:"project"`
	Author                               UserAccount              `json:"author"`
	ProjectLatestDeploymentRevisionEvent *DeploymentRevisionEvent `json:"projectLatestDeploymentRevisionEvent"`
}
