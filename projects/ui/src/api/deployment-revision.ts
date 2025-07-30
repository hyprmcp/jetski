import { Base } from './base';

export interface DeploymentRevision extends Base {
  createdBy: string;
  projectId: string;
  port: number;
  ociUrl: string;
  buildNumber: number;
}

type DeploymentRevisionEventType = 'ok' | 'progressing' | 'error';

export interface DeploymentRevisionEvent extends Base {
  deploymentRevisionId: string;
  type: DeploymentRevisionEventType;
}
