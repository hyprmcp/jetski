package types

import (
	"time"

	"github.com/google/uuid"
)

type Organization struct {
	ID        uuid.UUID `db:"id" json:"id"`
	CreatedAt time.Time `db:"created_at" json:"createdAt"`
	Name      string    `db:"name" json:"name"`
}

type UserAccount struct {
	ID        uuid.UUID `db:"id" json:"id"`
	CreatedAt time.Time `db:"created_at" json:"createdAt"`
	Email     string    `db:"email" json:"email"`
}

type OrganizationUserAccount struct {
	OrganizationID uuid.UUID `db:"organization_id" json:"organizationId"`
	UserAccountID  uuid.UUID `db:"user_account_id" json:"userAccountId"`
	CreatedAt      time.Time `db:"created_at" json:"createdAt"`
}

type Project struct {
	ID                              uuid.UUID  `db:"id" json:"id"`
	CreatedAt                       time.Time  `db:"created_at" json:"createdAt"`
	CreatedBy                       uuid.UUID  `db:"created_by" json:"createdBy"`
	OrganizationID                  uuid.UUID  `db:"organization_id" json:"organizationId"`
	Name                            string     `db:"name" json:"name"`
	LatestDeploymentRevisionID      *uuid.UUID `db:"latest_deployment_revision_id" json:"latestDeploymentRevisionId,omitempty"`
	LatestDeploymentRevisionEventID *uuid.UUID `db:"latest_deployment_revision_event_id" json:"latestDeploymentRevisionEventId,omitempty"`
}

type DeploymentRevision struct {
	ID          uuid.UUID `db:"id" json:"id"`
	CreatedAt   time.Time `db:"created_at" json:"createdAt"`
	CreatedBy   uuid.UUID `db:"created_by" json:"createdBy"`
	ProjectID   uuid.UUID `db:"project_id" json:"projectId"`
	Port        int       `db:"port" json:"port"`
	OCIURL      string    `db:"oci_url" json:"ociUrl"`
	BuildNumber string    `db:"build_number" json:"buildNumber"`
}

type DeploymentRevisionEventType string

const (
	DeploymentRevisionEventTypeOK          DeploymentRevisionEventType = "ok"
	DeploymentRevisionEventTypeError       DeploymentRevisionEventType = "error"
	DeploymentRevisionEventTypeProgressing DeploymentRevisionEventType = "progressing"
)

type DeploymentRevisionEvent struct {
	ID                   uuid.UUID                   `db:"id" json:"id"`
	CreatedAt            time.Time                   `db:"created_at" json:"createdAt"`
	DeploymentRevisionID uuid.UUID                   `db:"deployment_revision_id" json:"deploymentRevisionId"`
	Type                 DeploymentRevisionEventType `db:"type" json:"type"`
}

type MCPServerLog struct {
	ID                   uuid.UUID     `db:"id" json:"id"`
	UserAccountID        *uuid.UUID    `db:"user_account_id" json:"userAccountId"`
	MCPSessionID         *string       `db:"mcp_session_id" json:"mcpSessionId"`
	StartedAt            time.Time     `db:"started_at" json:"startedAt"`
	Duration             time.Duration `db:"duration" json:"duration"`
	DeploymentRevisionID uuid.UUID     `db:"deployment_revision_id" json:"deploymentRevisionId"`
	AuthTokenDigest      *string       `db:"auth_token_digest" json:"authTokenDigest"`
	MCPRequest           any           `db:"mcp_request" json:"mcpRequest,omitempty"`
	MCPResponse          any           `db:"mcp_response" json:"mcpResponse,omitempty"`
	UserAgent            *string       `db:"user_agent" json:"userAgent,omitempty"`
	HttpStatusCode       *int          `db:"http_status_code" json:"httpStatusCode,omitempty"`
	HttpError            *string       `db:"http_error" json:"httpError,omitempty"`
}

type ContextPropertyType string

const (
	ContextPropertyTypeString  ContextPropertyType = "string"
	ContextPropertyTypeNumber  ContextPropertyType = "number"
	ContextPropertyTypeBoolean ContextPropertyType = "boolean"
)

type ContextProperty struct {
	ID        uuid.UUID           `db:"id" json:"id"`
	CreatedAt time.Time           `db:"created_at" json:"createdAt"`
	ProjectID uuid.UUID           `db:"project_id" json:"projectId"`
	Type      ContextPropertyType `db:"type" json:"type"`
	Name      string              `db:"name" json:"name"`
	Required  bool                `db:"required" json:"required"`
}

type Context struct {
	ID                   uuid.UUID `db:"id" json:"id"`
	CreatedAt            time.Time `db:"created_at" json:"createdAt"`
	AuthTokenDigest      string    `db:"auth_token_digest" json:"authTokenDigest"`
	UserAccountID        uuid.UUID `db:"user_account_id" json:"userAccountId"`
	ContextPropertyID    uuid.UUID `db:"context_property_id" json:"contextPropertyId"`
	ContextPropertyValue any       `db:"context_property_value" json:"contextPropertyValue"`
}

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
