import { Component, inject } from '@angular/core';
import { UsageCardComponent } from '../../components/usage-card/usage-card.component';
import { ProjectsGridComponent } from '../../components/projects-grid/projects-grid.component';
import { RecentDeploymentsComponent } from '../../components/recent-deployments/recent-deployments.component';
import { ContextService } from '../../services/context.service';
import { AsyncPipe, JsonPipe } from '@angular/common';

@Component({
  selector: 'app-organization-dashboard',
  imports: [
    UsageCardComponent,
    ProjectsGridComponent,
    RecentDeploymentsComponent,
    AsyncPipe,
    JsonPipe,
  ],
  template: `
    @let org = contextService.selectedOrg();
    @if (org) {
      {{ org | json }}
      <!-- Main content grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left column - Usage and Recent Previews -->
        <div class="lg:col-span-1 space-y-8">
          <app-usage-card></app-usage-card>
          <div class="mt-4"></div>
          <app-recent-deployments
            [organization]="org!"
          ></app-recent-deployments>
        </div>

        <!-- Right column - Projects -->
        <div class="lg:col-span-2">
          <app-projects-grid></app-projects-grid>
        </div>
      </div>
    }
  `,
})
export class OrganizationDashboardComponent {
  protected readonly contextService = inject(ContextService);
}
