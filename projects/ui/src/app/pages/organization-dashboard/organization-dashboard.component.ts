import { Component, inject } from '@angular/core';
import { UsageCardComponent } from '../../components/usage-card/usage-card.component';
import { ProjectsGridComponent } from '../../components/projects-grid/projects-grid.component';
import { RecentDeploymentsComponent } from '../../components/recent-deployments/recent-deployments.component';
import { ContextService } from '../../services/context.service';

@Component({
  selector: 'app-organization-dashboard',
  imports: [
    UsageCardComponent,
    ProjectsGridComponent,
    RecentDeploymentsComponent,
  ],
  template: `
    <!-- Main content grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Left column - Usage and Recent Previews -->
      <div class="lg:col-span-1 space-y-8">
        <app-usage-card
          [organization]="contextService.selectedOrg()"
        ></app-usage-card>
        <div class="mt-4"></div>
        <app-recent-deployments
          [organization]="contextService.selectedOrg()"
        ></app-recent-deployments>
      </div>

      <!-- Right column - Projects -->
      <div class="lg:col-span-2">
        <app-projects-grid
          [organization]="contextService.selectedOrg()"
        ></app-projects-grid>
      </div>
    </div>
  `,
})
export class OrganizationDashboardComponent {
  protected readonly contextService = inject(ContextService);
}
