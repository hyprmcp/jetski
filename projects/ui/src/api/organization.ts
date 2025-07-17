import { httpResource } from '@angular/common/http';

export interface Organization {
  id: string;
  createdAt: string;
  name: string;
}

export function getOrganizations() {
  return httpResource(() => '/api/v1/organizations', {
    parse: (value) => value as Organization[],
  });
}
