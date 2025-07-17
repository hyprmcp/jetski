import { httpResource } from '@angular/common/http';
import { Base } from './base';

export interface Organization extends Base {
  name: string;
}

export function getOrganizations() {
  return httpResource(() => '/api/v1/organizations', {
    parse: (value) => value as Organization[],
  });
}
