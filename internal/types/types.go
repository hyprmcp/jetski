package types

import (
	"github.com/google/uuid"
	"time"
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
	ID             uuid.UUID `db:"id" json:"id"`
	CreatedAt      time.Time `db:"created_at" json:"createdAt"`
	CreatedBy      uuid.UUID `db:"created_by" json:"createdBy"`
	OrganizationID uuid.UUID `db:"organization_id" json:"organizationId"`
	Name           string    `db:"name" json:"name"`
}

type DeploymentRevision struct {
	ID        uuid.UUID `db:"id" json:"id"`
	CreatedAt time.Time `db:"created_at" json:"createdAt"`
	CreatedBy uuid.UUID `db:"created_by" json:"createdBy"`
	ProjectID uuid.UUID `db:"project_id" json:"projectId"`
	Port      int       `db:"port" json:"port"`
	OCIURL    string    `db:"oci_url" json:"ociUrl"`
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
	ID                   uuid.UUID  `db:"id" json:"id"`
	StartedAt            time.Time  `db:"started_at" json:"startedAt"`
	DurationMs           int64      `db:"duration_ms" json:"durationMs"`
	OrganizationID       uuid.UUID  `db:"organization_id" json:"organizationId"`
	DeploymentRevisionID uuid.UUID  `db:"deployment_revision_id" json:"deploymentRevisionId"`
	AuthTokenDigest      *string    `db:"auth_token_digest" json:"authTokenDigest"`
	UserAccountID        *uuid.UUID `db:"user_account_id" json:"userAccountId"`
	ToolName             string     `db:"tool_name" json:"toolName"`
	ToolValues           *string    `db:"tool_values" json:"toolValues"`
	ToolResponse         *string    `db:"tool_response" json:"-"`
	UserAgent            *string    `db:"user_agent" json:"userAgent"`
}
