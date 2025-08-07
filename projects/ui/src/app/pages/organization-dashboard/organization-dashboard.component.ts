import { Component, inject } from '@angular/core';
import { UsageCardComponent } from '../../components/usage-card/usage-card.component';
import { ProjectsGridComponent } from '../../components/projects-grid/projects-grid.component';
import { RecentDeploymentsComponent } from '../../components/recent-deployments/recent-deployments.component';
import { ContextService } from '../../services/context.service';
import { getRecentDeployments } from '../../../api/dashboard';
import { BrnSelectModule } from '@spartan-ng/brain/select';
import { provideIcons } from '@ng-icons/core';
import { lucideChevronDown } from '@ng-icons/lucide';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-organization-dashboard',
  imports: [
    UsageCardComponent,
    ProjectsGridComponent,
    RecentDeploymentsComponent,
    BrnSelectModule,
    FormsModule,
  ],
  providers: [provideIcons({ lucideChevronDown })],
  template: `
    <!-- Header with Filters -->
    <div class="flex flex-col justify-between gap-4 sm:flex-row mb-8">
      <div class="flex items-center justify-between grow">
        <div>
          <h1 class="text-2xl font-semibold text-foreground">
            {{ contextService.selectedOrg()?.name }}
          </h1>
          <p class="text-muted-foreground">Overview Dashboard</p>
        </div>
      </div>
    </div>

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
  selectedDeploymentVersion: string | null = null;
  readonly recentDeployments = getRecentDeployments(
    this.contextService.selectedOrg,
  );

  onDeploymentVersionChange(version: string) {
    this.selectedDeploymentVersion = version;
    // TODO: Implement logic to filter data based on selected version
  }
}
