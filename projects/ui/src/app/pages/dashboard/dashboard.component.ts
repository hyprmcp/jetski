import { Component } from '@angular/core';
import { UsageCardComponent } from '../../components/usage-card/usage-card.component';
import { ProjectsGridComponent } from '../../components/projects-grid/projects-grid.component';
import { RecentDeploymentsComponent } from '../../components/recent-deployments/recent-deployments.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
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
        <app-usage-card></app-usage-card>
        <div class="mt-4"></div>
        <app-recent-deployments></app-recent-deployments>
      </div>

      <!-- Right column - Projects -->
      <div class="lg:col-span-2">
        <app-projects-grid></app-projects-grid>
      </div>
    </div>
  `,
})
export class DashboardComponent {}
