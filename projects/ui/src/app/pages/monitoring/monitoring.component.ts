import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HlmButtonDirective } from '@spartan-ng/helm/button';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideActivity,
  lucideCircleCheck,
  lucideChevronDown,
  lucideInfo,
  lucideTrendingUp,
  lucideTriangleAlert,
  lucideSparkles,
} from '@ng-icons/lucide';
import { ContextService } from '../../services/context.service';
import { getDeploymentsForProject } from '../../../api/project';
import { BrnSelectModule } from '@spartan-ng/brain/select';
import {
  HlmSelectContentDirective,
  HlmSelectTriggerComponent,
  HlmSelectOptionComponent,
} from '@spartan-ng/helm/select';
import { HlmIcon } from '@spartan-ng/helm/icon';
import { FormsModule } from '@angular/forms';
import { RelativeDatePipe } from '../../pipes/relative-date-pipe';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartData, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

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
    HlmIcon,
    FormsModule,
    RelativeDatePipe,
    BaseChartDirective,
  ],
  viewProviders: [
    provideIcons({
      lucideActivity,
      lucideCircleCheck,
      lucideChevronDown,
      lucideInfo,
      lucideTrendingUp,
      lucideTriangleAlert,
      lucideSparkles,
    }),
  ],
  template: `
    <div class="space-y-6">
      <!-- Pro Feature Banner -->
      <div
        class="relative overflow-hidden border border-border bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-lg"
      >
        <div
          class="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0"
        ></div>
        <div class="relative px-6 py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="rounded-lg bg-primary/10 p-2">
                <ng-icon
                  name="lucideSparkles"
                  class="h-5 w-5 text-primary"
                ></ng-icon>
              </div>
              <div>
                <p class="font-semibold text-foreground">Pro Feature</p>
                <p class="text-sm text-muted-foreground">
                  Unlock real-time metrics, alerts, and advanced monitoring
                  capabilities
                </p>
              </div>
            </div>
            <button
              hlmBtn
              variant="default"
              size="sm"
              class="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Upgrade to Pro
            </button>
          </div>
        </div>
      </div>

      <!-- Blurred Content Container -->
      <div class="relative p-2">
        <!-- Blur Overlay -->
        <div class="absolute inset-0 z-10 backdrop-blur-xs"></div>

        <!-- Content (non-interactive) -->
        <div class="pointer-events-none select-none">
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
                    Active Projects
                  </p>
                  <p class="text-2xl font-bold text-foreground">12</p>
                </div>
                <div
                  class="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center"
                >
                  <ng-icon
                    name="lucideActivity"
                    class="h-6 w-6 text-blue-600"
                  ></ng-icon>
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
                    name="lucideTrendingUp"
                    class="h-6 w-6 text-purple-600"
                  ></ng-icon>
                </div>
              </div>
            </div>

            <div class="bg-card border border-border rounded-lg p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-muted-foreground">
                    Alerts
                  </p>
                  <p class="text-2xl font-bold text-orange-600">3</p>
                </div>
                <div
                  class="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center"
                >
                  <ng-icon
                    name="lucideTriangleAlert"
                    class="h-6 w-6 text-orange-600"
                  ></ng-icon>
                </div>
              </div>
            </div>
          </div>

          <!-- Performance Charts -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="bg-card border border-border rounded-lg p-6">
              <h3 class="text-lg font-semibold text-foreground mb-4">
                CPU Usage
              </h3>
              <div class="h-64">
                <canvas
                  baseChart
                  [data]="cpuChartData"
                  [options]="cpuChartOptions"
                  [type]="'line'"
                  class="w-full h-full"
                ></canvas>
              </div>
            </div>

            <div class="bg-card border border-border rounded-lg p-6">
              <h3 class="text-lg font-semibold text-foreground mb-4">
                Memory Usage
              </h3>
              <div class="h-64">
                <canvas
                  baseChart
                  [data]="memoryChartData"
                  [options]="memoryChartOptions"
                  [type]="'line'"
                  class="w-full h-full"
                ></canvas>
              </div>
            </div>
          </div>

          <!-- Recent Alerts -->
          <div class="bg-card border border-border rounded-lg">
            <div class="p-6 border-b border-border">
              <h3 class="text-lg font-semibold text-foreground">
                Recent Alerts
              </h3>
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
                  <p class="text-xs text-muted-foreground">
                    Memory usage at 85%
                  </p>
                </div>
                <span class="text-xs text-muted-foreground"
                  >15 minutes ago</span
                >
              </div>

              <div class="p-4 flex items-center space-x-4">
                <div class="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div class="flex-1">
                  <p class="text-sm font-medium text-foreground">
                    Disk space low on mcp-server-03
                  </p>
                  <p class="text-xs text-muted-foreground">
                    Only 2GB remaining
                  </p>
                </div>
                <span class="text-xs text-muted-foreground">1 hour ago</span>
              </div>
            </div>
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

  // CPU Chart Configuration
  cpuChartData: ChartData<'line'> = {
    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
    datasets: [
      {
        label: 'CPU Usage (%)',
        data: [45, 52, 68, 75, 62, 58, 48],
        borderColor: 'rgb(79, 70, 229)',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  cpuChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (context) => {
            return `CPU: ${context.parsed.y}%`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgb(156, 163, 175)',
        },
      },
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          color: 'rgb(156, 163, 175)',
          callback: function (value) {
            return value + '%';
          },
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.1)',
        },
      },
    },
  };

  // Memory Chart Configuration
  memoryChartData: ChartData<'line'> = {
    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
    datasets: [
      {
        label: 'Memory Usage (GB)',
        data: [3.2, 3.5, 4.1, 4.8, 4.2, 3.9, 3.4],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  memoryChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (context) => {
            return `Memory: ${context.parsed.y} GB`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgb(156, 163, 175)',
        },
      },
      y: {
        beginAtZero: true,
        max: 8,
        ticks: {
          color: 'rgb(156, 163, 175)',
          callback: function (value) {
            return value + ' GB';
          },
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.1)',
        },
      },
    },
  };

  onDeploymentVersionChange(version: string) {
    this.selectedDeploymentVersion = version;
    // TODO: Implement logic to filter data based on selected version
  }
}
