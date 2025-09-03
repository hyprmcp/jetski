import { Base } from './base';
import { inject, Injectable, Signal } from '@angular/core';
import { HttpClient, httpResource } from '@angular/common/http';
import { UserAccount } from './user-account';
import { Observable } from 'rxjs';

export interface Organization extends Base {
  id: string;
  createdAt: string;
  name: string;
  settings: OrganizationSettings;
}

export interface OrganizationDomainSettings {
  customDomain?: string;
}

export interface OrganizationAuthSettings {
  authorization: OrganizationSettingsAuthorization;
}

export type OrganizationSettings = OrganizationDomainSettings &
  OrganizationAuthSettings;

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

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private readonly httpClient = inject(HttpClient);

  public updateSettings(
    id: string,
    settings: Required<OrganizationDomainSettings>,
  ): Observable<Organization>;
  public updateSettings(
    id: string,
    settings: OrganizationAuthSettings,
  ): Observable<Organization>;
  public updateSettings(
    id: string,
    settings: unknown,
  ): Observable<Organization> {
    return this.httpClient.put<Organization>(`/api/v1/organizations/${id}`, {
      settings,
    });
  }
}
