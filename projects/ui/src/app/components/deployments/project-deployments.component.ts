import { Component, inject } from '@angular/core';
import { HlmH3 } from '@spartan-ng/helm/typography';
import { getDeploymentsForProject } from '../../../api/project';
import { ContextService } from '../../services/context.service';
import { DeploymentRevisionComponent } from './deployment-revision.component';
import { UpsellWrapperComponent } from '../upsell-wrapper/upsell-wrapper.component';

@Component({
  template: `
    <app-upsell-wrapper
      description="Host your MCP server on HyprMCP Cloud with a Vercel like expirience."
    >
      @if (contextService.selectedProject(); as proj) {
        <div class="space-y-4">
          <div class="flex flex-col justify-between gap-4 sm:flex-row">
            <div class="flex items-center justify-between grow">
              <div>
                <h1 class="text-2xl font-semibold text-foreground">
                  {{ proj.name }}
                </h1>
                <p class="text-muted-foreground">Deployments</p>
              </div>
            </div>
          </div>
          <div>
            <h3 hlmH3>Deployment History</h3>
            @if (deploymentRevisions.error(); as err) {
              <div class="text-red-600 text-sm">failed to load deployments</div>
            } @else {
              <div class="space-y-4">
                @for (
                  revision of deploymentRevisions.value();
                  track revision.id
                ) {
                  <app-deployments-revision [deploymentRevision]="revision" />
                } @empty {
                  <div class="text-muted-foreground text-sm">
                    nothing deployed yet
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }
    </app-upsell-wrapper>
  `,
  imports: [HlmH3, DeploymentRevisionComponent, UpsellWrapperComponent],
})
export class ProjectDeploymentsComponent {
  readonly contextService = inject(ContextService);
  readonly deploymentRevisions = getDeploymentsForProject(
    this.contextService.selectedProject,
  );
}
