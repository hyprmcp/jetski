import { Base } from './base';
import { Signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { UserAccount } from './user-account';

export interface Organization extends Base {
  id: string;
  createdAt: string;
  name: string;
  settings: OrganizationSettings;
}

export interface OrganizationSettings {
  authorization: OrganizationSettingsAuthorization;
}

export interface OrganizationSettingsAuthorization {
  dcrPublicClient: boolean;
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
