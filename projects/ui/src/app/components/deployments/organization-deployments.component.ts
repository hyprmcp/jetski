import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HlmCardContent, HlmCard } from '@spartan-ng/helm/card';
import { HlmH3 } from '@spartan-ng/helm/typography';
import { getRecentDeployments } from '../../../api/dashboard';
import { Organization } from '../../../api/organization';
import { DeploymentRevisionComponent } from './deployment-revision.component';

@Component({
  selector: 'app-organization-deployments',
  standalone: true,
  imports: [
    CommonModule,
    HlmCard,
    HlmCardContent,
    HlmH3,
    DeploymentRevisionComponent,
  ],
  template: `
    <h3 hlmH3>Recent Deployments</h3>
    <section hlmCard>
      <div hlmCardContent>
        @if (deploymentRevisions.error(); as err) {
          <div class="text-red-600 text-sm">failed to load deployments</div>
        } @else {
          <div class="space-y-4">
            @for (revision of deploymentRevisions.value(); track revision.id) {
              <app-deployments-revision [deploymentRevision]="revision" />
            } @empty {
              <div class="text-muted-foreground text-sm">
                nothing deployed yet
              </div>
            }
          </div>
        }
      </div>
    </section>
  `,
})
export class OrganizationDeploymentsComponent {
  readonly organization = input<Organization>();
  readonly deploymentRevisions = getRecentDeployments(this.organization);
}
