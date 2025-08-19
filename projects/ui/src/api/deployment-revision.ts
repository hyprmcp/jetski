import { Base } from './base';

export interface DeploymentRevision extends Base {
  createdBy: string;
  projectId: string;
  port: number | undefined;
  ociUrl: string | undefined;
  buildNumber: number;
  authenticated: boolean;
  telemetry: boolean;
  proxyUrl: string | undefined;
}

type DeploymentRevisionEventType = 'ok' | 'progressing' | 'error';

export interface DeploymentRevisionEvent extends Base {
  deploymentRevisionId: string;
  type: DeploymentRevisionEventType;
}
