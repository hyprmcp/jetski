CREATE TABLE Organization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE UserAccount (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  email TEXT NOT NULL UNIQUE
);

CREATE TABLE Organization_UserAccount (
  organization_id UUID NOT NULL REFERENCES Organization (id),
  user_account_id UUID NOT NULL REFERENCES UserAccount (id),
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  PRIMARY KEY (organization_id, user_account_id)
);
CREATE INDEX fk_Organization_UserAccount_organization_id ON Organization_UserAccount (organization_id);
CREATE INDEX fk_Organization_UserAccount_useraccount_id ON Organization_UserAccount (user_account_id);

CREATE TABLE Project (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  created_by UUID NOT NULL REFERENCES UserAccount (id),
  organization_id UUID NOT NULL REFERENCES Organization (id),
  name TEXT NOT NULL,
  CONSTRAINT project_name_unique UNIQUE (organization_id, name)
);
CREATE INDEX fk_Project_organization_id ON Project (organization_id);

-- TODO build number where?

CREATE TABLE DeploymentRevision (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  created_by UUID NOT NULL REFERENCES UserAccount (id),
  project_id UUID NOT NULL REFERENCES Project (id),
  port INT NOT NULL,
  oci_url TEXT NOT NULL
);
CREATE INDEX fk_DeploymentRevision_project_id ON DeploymentRevision (project_id);
ALTER TABLE Project ADD COLUMN latest_deployment_revision_id UUID REFERENCES DeploymentRevision (id);
CREATE INDEX fk_Project_latest_deployment_revision_id ON Project (latest_deployment_revision_id);

CREATE TYPE DEPLOYMENT_REVISION_EVENT_TYPE AS ENUM ('ok', 'error', 'progressing');

CREATE TABLE DeploymentRevisionEvent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  deployment_revision_id UUID NOT NULL REFERENCES DeploymentRevision (id),
  type DEPLOYMENT_REVISION_EVENT_TYPE NOT NULL
);
CREATE INDEX fk_DeploymentRevisionEvent_deployment_revision_id ON DeploymentRevisionEvent (deployment_revision_id);
ALTER TABLE Project ADD COLUMN latest_deployment_revision_event_id UUID REFERENCES DeploymentRevisionEvent (id);
CREATE INDEX fk_Project_latest_deployment_revision_event_id ON Project (latest_deployment_revision_event_id);

CREATE TABLE MCPServerLog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_account_id UUID REFERENCES UserAccount (id),
  mcp_session_id TEXT,
  started_at TIMESTAMP NOT NULL,
  duration INTERVAL NOT NULL,
  deployment_revision_id UUID NOT NULL REFERENCES DeploymentRevision (id),
  auth_token_digest TEXT,
  mcp_request JSONB,
  mcp_response JSONB,
  user_agent TEXT,
  http_status_code INT,
  http_error TEXT
);
CREATE INDEX fk_MCPServerLog_deployment_revision_id ON MCPServerLog (deployment_revision_id);
CREATE INDEX fk_MCPServerLog_user_account_id ON MCPServerLog (user_account_id);

CREATE TYPE CONTEXT_PROPERTY_TYPE AS ENUM ('string', 'number', 'boolean');

CREATE TABLE ContextProperty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  project_id UUID NOT NULL REFERENCES Project (id),
  type CONTEXT_PROPERTY_TYPE NOT NULL,
  name TEXT NOT NULL,
  required BOOL NOT NULL DEFAULT FALSE
);
CREATE INDEX fk_ContextProperty_project_id ON ContextProperty (project_id);

CREATE TABLE Context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  auth_token_digest TEXT NOT NULL,
  user_account_id UUID NOT NULL REFERENCES UserAccount (id),
  context_property_id UUID NOT NULL REFERENCES ContextProperty(id),
  context_property_value JSONB
);
CREATE INDEX fk_Context_user_account_id ON Context (user_account_id);
CREATE INDEX fk_Context_context_property_id ON Context (context_property_id);
