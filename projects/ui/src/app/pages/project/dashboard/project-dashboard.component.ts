import { BrnSelectImports } from '@spartan-ng/brain/select';
import { Component, inject, signal } from '@angular/core';
import { ContextService } from '../../../services/context.service';
import {
  getAnalyticsForProject,
  getDeploymentsForProject,
  getProjectUrl,
} from '../../../../api/project';

import {
  HlmSelectContent,
  HlmSelectOption,
  HlmSelectTrigger,
} from '@spartan-ng/helm/select';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChevronDown,
  lucideChevronLeft,
  lucideChevronRight,
  lucideCircleAlert,
  lucideClock,
  lucideFileChartColumn,
  lucideTrendingUp,
  lucideUsers,
  lucideZap,
} from '@ng-icons/lucide';
import { HlmIcon } from '@spartan-ng/helm/icon';
import { FormsModule } from '@angular/forms';
import { RelativeDatePipe } from '../../../pipes/relative-date-pipe';
import { type Overview } from './analytics/overview';
import { OverviewComponent } from './analytics/overview.component';
import { type ToolsPerformance } from './analytics/tools-performance';
import { ToolsPerformanceComponent } from './analytics/tools-performance.component';
import { type ToolAnalytics } from './analytics/tool-analytics';
import { ToolAnalyticsComponent } from './analytics/tool-analytics.component';
import { type ClientUsage } from './analytics/client-usage';
import { ClientUsageComponent } from './analytics/client-usage.component';
import { type RecentSessions } from './analytics/recent-sessions';
import { RecentSessionsComponent } from './analytics/recent-sessions.component';
import { PromptAnalytics } from './analytics/prompty-analytics';
import { PromptAnalyticsComponent } from './analytics/prompt-analytics.component';

@Component({
  template: `
    @if (contextService.selectedProject(); as proj) {
      <div class="space-y-6 mb-24">
        <!-- Header -->
        <div class="flex flex-col justify-between gap-4 sm:flex-row">
          <div class="flex items-center justify-between grow gap-4">
            <div>
              <h1 class="text-2xl font-semibold text-foreground">
                {{ proj.name }}
              </h1>
              <p class="text-muted-foreground">Analytics Dashboard</p>
            </div>
            @if (contextService.selectedOrg(); as org) {
              <div
                class="rounded-lg border border-border bg-muted/50 px-4 py-2"
              >
                <div class="text-xs text-muted-foreground mb-1">
                  MCP Server URL
                </div>
                @if (getProjectUrl(org, proj); as projectUrl) {
                  <a
                    [href]="projectUrl"
                    class="text-sm font-mono text-foreground hover:text-primary transition-colors"
                  >
                    {{ projectUrl }}
                  </a>
                }
              </div>
            }
            <div class="flex items-center gap-2">
              <!-- Time Filter -->
              <div class="relative">
                <brn-select
                  [ngModel]="selectedTimeFilter()"
                  (ngModelChange)="onTimeFilterChange($event)"
                  class="w-40"
                >
                  <hlm-select-trigger>
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-medium">
                        {{ getTimeFilterLabel(selectedTimeFilter()) }}
                      </span>
                      <ng-icon hlm name="lucideChevronDown" size="sm" />
                    </div>
                  </hlm-select-trigger>
                  <hlm-select-content>
                    <hlm-option [value]="getTimestampFor24h()"
                      >Last 24h</hlm-option
                    >
                    <hlm-option [value]="getTimestampFor7d()"
                      >Last 7 days</hlm-option
                    >
                    <hlm-option [value]="getTimestampFor30d()"
                      >Last 30 days</hlm-option
                    >
                    <hlm-option [value]="getTimestampFor90d()"
                      >Last 90 days</hlm-option
                    >
                  </hlm-select-content>
                </brn-select>
              </div>

              <!-- Deployment Version Filter -->
              <div class="relative">
                <brn-select
                  [ngModel]="selectedDeploymentVersion()"
                  (ngModelChange)="onDeploymentVersionChange($event)"
                  class="w-40"
                >
                  <hlm-select-trigger>
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-medium">
                        {{
                          selectedDeploymentVersion()
                            ? 'v' + selectedDeploymentVersion()
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
                        <div class="flex flex-col w-full">
                          <div class="flex items-center justify-between">
                            <span>Version #{{ revision.buildNumber }}</span>
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
        </div>

        @if (projectAnalytics.value(); as analytics) {
          <!-- Overview Cards -->
          <div>
            <app-project-analytics-overview
              [data]="analytics.overview"
            ></app-project-analytics-overview>
          </div>

          <!-- Prompt Analytics -->
          <div>
            <app-prompt-analytics
              [data]="analytics.promptAnalytics"
            ></app-prompt-analytics>
          </div>

          <!-- Tools Performance Chart -->
          <div>
            <app-tools-performance
              [data]="analytics.toolsPerformance"
            ></app-tools-performance>
          </div>

          <!-- Tool Analytics -->
          <div>
            <app-tool-analytics
              [data]="analytics.toolAnalytics"
            ></app-tool-analytics>
          </div>

          <!-- Client Usage -->
          <div>
            <app-client-usage [data]="analytics.clientUsage"></app-client-usage>
          </div>

          <!-- Recent Sessions Table -->
          <div>
            <app-recent-sessions
              [data]="analytics.recentSessions"
            ></app-recent-sessions>
          </div>
        }
      </div>
    }
  `,
  imports: [
    BrnSelectImports,
    HlmSelectContent,
    HlmSelectTrigger,
    HlmSelectOption,
    FormsModule,
    NgIcon,
    HlmIcon,
    RelativeDatePipe,
    OverviewComponent,
    ToolsPerformanceComponent,
    ToolAnalyticsComponent,
    ClientUsageComponent,
    RecentSessionsComponent,
    PromptAnalyticsComponent,
  ],
  providers: [
    provideIcons({
      lucideCircleAlert,
      lucideFileChartColumn,
      lucideChevronDown,
      lucideChevronLeft,
      lucideChevronRight,
      lucideClock,
      lucideTrendingUp,
      lucideUsers,
      lucideZap,
    }),
  ],
})
export class ProjectDashboardComponent {
  readonly contextService = inject(ContextService);
  selectedDeploymentVersion = signal<number | undefined>(undefined);
  selectedTimeFilter = signal<number>(this.getTimestampFor24h());

  readonly deploymentRevisions = getDeploymentsForProject(
    this.contextService.selectedProject,
  );

  readonly projectAnalytics = getAnalyticsForProject(
    this.contextService.selectedProject,
    this.selectedTimeFilter,
    this.selectedDeploymentVersion,
  );

  onDeploymentVersionChange(version: string) {
    this.selectedDeploymentVersion.set(version ? parseInt(version) : undefined);
  }

  onTimeFilterChange(timeFilter: string) {
    this.selectedTimeFilter.set(parseInt(timeFilter));
  }

  getTimeFilterLabel(timeFilter: number): string {
    const now = Date.now() / 1000; // Current timestamp in seconds
    const diff = now - timeFilter;
    const days = Math.floor(diff / (24 * 60 * 60));

    if (days >= 90) return 'Last 90 days';
    if (days >= 30) return 'Last 30 days';
    if (days >= 7) return 'Last 7 days';
    return 'Last 24h';
  }

  getTimestampFor24h(): number {
    return Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
  }

  getTimestampFor7d(): number {
    return Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);
  }

  getTimestampFor30d(): number {
    return Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
  }

  getTimestampFor90d(): number {
    return Math.floor((Date.now() - 90 * 24 * 60 * 60 * 1000) / 1000);
  }

  protected readonly getProjectUrl = getProjectUrl;
}

export interface ProjectAnalytics {
  overview: Overview;
  toolsPerformance: ToolsPerformance;
  toolAnalytics: ToolAnalytics;
  promptAnalytics: PromptAnalytics;
  clientUsage: ClientUsage;
  recentSessions: RecentSessions;
}
