CREATE TABLE Organization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  name TEXT NOT NULL
);

CREATE TABLE UserAccount (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  email TEXT NOT NULL
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
  name TEXT NOT NULL
);
CREATE INDEX fk_Project_organization_id ON Project (organization_id);

CREATE TABLE DeploymentRevision (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  created_by UUID NOT NULL REFERENCES UserAccount (id),
  project_id UUID NOT NULL REFERENCES Project (id),
  port INT NOT NULL,
  oci_url TEXT NOT NULL
);
CREATE INDEX fk_DeploymentRevision_project_id ON DeploymentRevision (project_id);

CREATE TYPE DEPLOYMENT_REVISION_EVENT_TYPE AS ENUM ('ok', 'error', 'progressing');

CREATE TABLE DeploymentRevisionEvent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
  deployment_revision_id UUID NOT NULL REFERENCES DeploymentRevision (id),
  type DEPLOYMENT_REVISION_EVENT_TYPE NOT NULL
);
CREATE INDEX fk_DeploymentRevisionEvent_deployment_revision_id ON DeploymentRevisionEvent (deployment_revision_id);

CREATE TABLE MCPServerLog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMP NOT NULL,
  duration_ms BIGINT NOT NULL,
  organization_id UUID NOT NULL REFERENCES Organization (id),
  deployment_revision_id UUID NOT NULL REFERENCES DeploymentRevision (id),
  auth_token_digest TEXT,
  user_account_id UUID REFERENCES UserAccount (id),
  tool_name TEXT NOT NULL,
  tool_values TEXT,
  tool_response TEXT,
  user_agent TEXT
);
CREATE INDEX fk_MCPServerLog_deployment_revision_id ON MCPServerLog (deployment_revision_id);
CREATE INDEX fk_MCPServerLog_organization_id ON MCPServerLog (organization_id);
CREATE INDEX fk_MCPServerLog_user_account_id ON MCPServerLog (user_account_id);
