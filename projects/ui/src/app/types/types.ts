export interface Base {
  id: string;
  createdAt: string;
}

export interface DeploymentRevision extends Base {
  createdBy: string;
  projectId: string;
  port: number;
  ociUrl: string;
  buildNumber: string;
}

type DeploymentRevisionEventType = 'ok' | 'progressing' | 'error';

export interface DeploymentRevisionEvent extends Base {
  deploymentRevisionId: string;
  type: DeploymentRevisionEventType;
}

export interface Organization extends Base {
  name: string;
}

export interface UserAccount extends Base {
  email: string;
}

export interface Project extends Base {
  createdBy: string;
  name: string;
  latestDeploymentRevisionId: string | undefined;
  latestDeploymentRevisionEventId: string | undefined;
}
