import { httpResource } from '@angular/common/http';

export interface Project {
  id: string;
  createdAt: string;
  name: string;
  organizationId: string;
  createdBy: string;
  latestDeploymentRevisionId: string;
}

export function getProjects() {
  return httpResource(() => '/api/v1/projects', {
    parse: (value) => value as Project[],
  });
}
