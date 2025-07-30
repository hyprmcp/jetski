import { Component, inject } from '@angular/core';
import { UsageCardComponent } from '../../components/usage-card/usage-card.component';
import { ProjectsGridComponent } from '../../components/projects-grid/projects-grid.component';
import { RecentDeploymentsComponent } from '../../components/recent-deployments/recent-deployments.component';
import { ContextService } from '../../services/context.service';
import { getRecentDeployments } from '../../../api/dashboard';
import { BrnSelectModule } from '@spartan-ng/brain/select';
import {
  HlmSelectDirective,
  HlmSelectContentDirective,
  HlmSelectTriggerComponent,
  HlmSelectOptionComponent,
} from '@spartan-ng/helm/select';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronDown } from '@ng-icons/lucide';
import { HlmIconDirective } from '@spartan-ng/helm/icon';
import { FormsModule } from '@angular/forms';
import { RelativeDatePipe } from '../../pipes/relative-date-pipe';

@Component({
  selector: 'app-organization-dashboard',
  imports: [
    UsageCardComponent,
    ProjectsGridComponent,
    RecentDeploymentsComponent,
    BrnSelectModule,
    HlmSelectDirective,
    HlmSelectContentDirective,
    HlmSelectTriggerComponent,
    HlmSelectOptionComponent,
    FormsModule,
    NgIcon,
    HlmIconDirective,
    RelativeDatePipe,
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
      <div class="flex items-center gap-2">
        <!-- Time Filter -->
        <select
          class="w-32 px-3 py-2 border border-border rounded-md bg-background"
        >
          <option value="24h">Last 24h</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>

        <!-- Deployment Version Filter -->
        <div class="relative">
          <brn-select
            [ngModel]="selectedDeploymentVersion"
            (ngModelChange)="onDeploymentVersionChange($event)"
            class="w-40"
          >
            <hlm-select-trigger>
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium">
                  {{
                    selectedDeploymentVersion
                      ? 'v' + selectedDeploymentVersion
                      : 'All Versions'
                  }}
                </span>
                <ng-icon hlm name="lucideChevronDown" size="sm" />
              </div>
            </hlm-select-trigger>
            <hlm-select-content>
              <hlm-option value="">
                <div class="flex items-center justify-between w-full">
                  <span>All Versions</span>
                </div>
              </hlm-option>
              @for (revision of recentDeployments.value(); track revision.id) {
                <hlm-option [value]="revision.buildNumber">
                  <div class="flex flex-col w-full">
                    <div class="flex items-center justify-between">
                      <span>Version {{ revision.buildNumber }}</span>
                    </div>
                    <div class="flex items-center justify-between mt-1">
                      <span class="text-xs text-muted-foreground">
                        {{ revision.createdAt | relativeDate }}
                      </span>
                    </div>
                  </div>
                </hlm-option>
              }
            </hlm-select-content>
          </brn-select>
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
