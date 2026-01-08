ALTER TABLE MCPServerLog ADD COLUMN project_id UUID REFERENCES Project(id);

CREATE INDEX fk_mcpserverlog_project_id ON MCPServerLog(project_id);

UPDATE MCPServerLog SET project_id = (SELECT project_id FROM DeploymentRevision WHERE id = deployment_revision_id);

ALTER TABLE MCPServerLog ALTER COLUMN project_id SET NOT NULL;
