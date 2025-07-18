import { httpResource } from '@angular/common/http';
import { Base } from './base';

export interface Project extends Base {
  name: string;
  organizationId: string;
  createdBy: string;
  latestDeploymentRevisionId: string;
  latestDeploymentRevisionEventId: string | undefined;
}

export function getProjects() {
  return httpResource(() => '/api/v1/projects', {
    parse: (value) => value as Project[],
  });
}
