import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HlmButtonDirective } from '@spartan-ng/helm/button';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideActivity,
  lucideCircleCheck,
  lucideChevronDown,
} from '@ng-icons/lucide';
import { ContextService } from '../../services/context.service';
import { getDeploymentsForProject } from '../../../api/project';
import { BrnSelectModule } from '@spartan-ng/brain/select';
import {
  HlmSelectContentDirective,
  HlmSelectTriggerComponent,
  HlmSelectOptionComponent,
} from '@spartan-ng/helm/select';
import { HlmIconDirective } from '@spartan-ng/helm/icon';
import { FormsModule } from '@angular/forms';
import { RelativeDatePipe } from '../../pipes/relative-date-pipe';

@Component({
  selector: 'app-monitoring',
  standalone: true,
  imports: [
    CommonModule,
    HlmButtonDirective,
    NgIcon,
    BrnSelectModule,
    HlmSelectContentDirective,
    HlmSelectTriggerComponent,
    HlmSelectOptionComponent,
    HlmIconDirective,
    FormsModule,
    RelativeDatePipe,
  ],
  viewProviders: [
    provideIcons({ lucideActivity, lucideCircleCheck, lucideChevronDown }),
  ],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-foreground">Monitoring</h1>
          <p class="text-muted-foreground">
            Real-time performance and health metrics
          </p>
        </div>
        <div class="flex items-center gap-2">
          <!-- Deployment Version Filter (only show in project context) -->
          @if (contextService.selectedProject()) {
            <div class="relative">
              <brn-select
                [ngModel]="selectedDeploymentVersion"
                (ngModelChange)="onDeploymentVersionChange($event)"
                class="w-32"
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
                  @for (
                    revision of deploymentRevisions.value();
                    track revision.id
                  ) {
                    <hlm-option [value]="revision.buildNumber">
                      <div class="flex items-center justify-between w-full">
                        <span>Version {{ revision.buildNumber }}</span>
                        <span class="text-xs text-muted-foreground">
                          {{ revision.createdAt | relativeDate }}
                        </span>
                      </div>
                    </hlm-option>
                  }
                </hlm-select-content>
              </brn-select>
            </div>
          }

          <button hlmBtn variant="outline">
            <ng-icon name="lucideActivity" class="h-4 w-4 mr-2"></ng-icon>
            Refresh
          </button>
        </div>
      </div>

      <!-- Status Overview -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted-foreground">
                System Status
              </p>
              <p class="text-2xl font-bold text-green-600">Healthy</p>
            </div>
            <div
              class="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center"
            >
              <ng-icon
                name="lucideCircleCheck"
                class="h-6 w-6 text-green-600"
              ></ng-icon>
            </div>
          </div>
        </div>

        <div class="bg-card border border-border rounded-lg p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted-foreground">
                Active Servers
              </p>
              <p class="text-2xl font-bold text-foreground">12</p>
            </div>
            <div
              class="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center"
            >
              <ng-icon name="activity" class="h-6 w-6 text-blue-600"></ng-icon>
            </div>
          </div>
        </div>

        <div class="bg-card border border-border rounded-lg p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted-foreground">
                Response Time
              </p>
              <p class="text-2xl font-bold text-foreground">245ms</p>
            </div>
            <div
              class="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center"
            >
              <ng-icon
                name="trending-up"
                class="h-6 w-6 text-purple-600"
              ></ng-icon>
            </div>
          </div>
        </div>

        <div class="bg-card border border-border rounded-lg p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted-foreground">Alerts</p>
              <p class="text-2xl font-bold text-orange-600">3</p>
            </div>
            <div
              class="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center"
            >
              <ng-icon
                name="alert-triangle"
                class="h-6 w-6 text-orange-600"
              ></ng-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- Performance Charts -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-lg font-semibold text-foreground mb-4">CPU Usage</h3>
          <div
            class="h-64 bg-muted/20 rounded-lg flex items-center justify-center"
          >
            <p class="text-muted-foreground">
              Chart placeholder - CPU usage over time
            </p>
          </div>
        </div>

        <div class="bg-card border border-border rounded-lg p-6">
          <h3 class="text-lg font-semibold text-foreground mb-4">
            Memory Usage
          </h3>
          <div
            class="h-64 bg-muted/20 rounded-lg flex items-center justify-center"
          >
            <p class="text-muted-foreground">
              Chart placeholder - Memory usage over time
            </p>
          </div>
        </div>
      </div>

      <!-- Recent Alerts -->
      <div class="bg-card border border-border rounded-lg">
        <div class="p-6 border-b border-border">
          <h3 class="text-lg font-semibold text-foreground">Recent Alerts</h3>
        </div>
        <div class="divide-y divide-border">
          <div class="p-4 flex items-center space-x-4">
            <div class="w-2 h-2 bg-red-500 rounded-full"></div>
            <div class="flex-1">
              <p class="text-sm font-medium text-foreground">
                High CPU usage on mcp-server-01
              </p>
              <p class="text-xs text-muted-foreground">
                CPU usage exceeded 90% threshold
              </p>
            </div>
            <span class="text-xs text-muted-foreground">2 minutes ago</span>
          </div>

          <div class="p-4 flex items-center space-x-4">
            <div class="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <div class="flex-1">
              <p class="text-sm font-medium text-foreground">
                Memory warning on mcp-server-02
              </p>
              <p class="text-xs text-muted-foreground">Memory usage at 85%</p>
            </div>
            <span class="text-xs text-muted-foreground">15 minutes ago</span>
          </div>

          <div class="p-4 flex items-center space-x-4">
            <div class="w-2 h-2 bg-orange-500 rounded-full"></div>
            <div class="flex-1">
              <p class="text-sm font-medium text-foreground">
                Disk space low on mcp-server-03
              </p>
              <p class="text-xs text-muted-foreground">Only 2GB remaining</p>
            </div>
            <span class="text-xs text-muted-foreground">1 hour ago</span>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class MonitoringComponent {
  contextService = inject(ContextService);
  selectedDeploymentVersion: string | null = null;
  readonly deploymentRevisions = getDeploymentsForProject(
    this.contextService.selectedProject,
  );

  onDeploymentVersionChange(version: string) {
    this.selectedDeploymentVersion = version;
    // TODO: Implement logic to filter data based on selected version
  }
}
