package types

import (
	"time"

	"github.com/google/uuid"
)

type Organization struct {
	ID        uuid.UUID            `db:"id" json:"id"`
	CreatedAt time.Time            `db:"created_at" json:"createdAt"`
	Name      string               `db:"name" json:"name"`
	Settings  OrganizationSettings `json:"settings"`
}

type OrganizationSettings struct {
	CustomDomain  *string                           `json:"customDomain"`
	Authorization OrganizationAuthorizationSettings `json:"authorization"`
}

type OrganizationAuthorizationSettings struct {
	DCRPublicClient bool `json:"dcrPublicClient"`
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
	ID            uuid.UUID `db:"id" json:"id"`
	CreatedAt     time.Time `db:"created_at" json:"createdAt"`
	CreatedBy     uuid.UUID `db:"created_by" json:"createdBy"`
	ProjectID     uuid.UUID `db:"project_id" json:"projectId"`
	Port          *int      `db:"port" json:"port"`
	OCIURL        *string   `db:"oci_url" json:"ociUrl"`
	Authenticated bool      `db:"authenticated" json:"authenticated"`
	ProxyURL      *string   `db:"proxy_url" json:"proxyUrl"`
	Telemetry     bool      `db:"telemetry" json:"telemetry"`
	BuildNumber   int       `db:"build_number" json:"buildNumber"`
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
