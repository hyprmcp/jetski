import { httpResource } from '@angular/common/http';
import { UserAccount } from './user-account';
import { Organization } from './organization';
import { Project } from './project';
import { Signal } from '@angular/core';

export interface Context {
  user: UserAccount;
  organizations: Organization[];
  projects: Project[];
}

export function getContext(reloadTrigger?: Signal<unknown>) {
  return httpResource(
    () => {
      reloadTrigger?.();
      return '/api/v1/context';
    },
    {
      parse: (value) => value as Context,
    },
  );
}
