import { httpResource } from '@angular/common/http';
import { UserAccount } from './user-account';
import { Organization } from './organization';
import { Project } from './project';

export interface Context {
  user: UserAccount;
  organizations: Organization[];
  projects: Project[];
}

export function getContext() {
  return httpResource(() => '/api/v1/context', {
    parse: (value) => value as Context,
  });
}
