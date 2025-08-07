import { Base } from './base';
import { Signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { UserAccount } from './user-account';

export interface Organization extends Base {
  name: string;
}

export function getOrganizationMembers(org: Signal<Organization | undefined>) {
  return httpResource(
    () => {
      const p = org();
      if (p) {
        return {
          url: `/api/v1/organizations/${p.id}/members`,
        };
      }
      return undefined;
    },
    {
      parse: (value) => value as UserAccount[],
    },
  );
}
