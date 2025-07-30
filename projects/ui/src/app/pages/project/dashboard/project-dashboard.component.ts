import { Component, inject, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { ContextService } from '../../../services/context.service';
import { HlmH3Directive, HlmH4Directive } from '@spartan-ng/helm/typography';
import {
  HlmCardDirective,
  HlmCardContentDirective,
  HlmCardHeaderDirective,
  HlmCardTitleDirective,
} from '@spartan-ng/helm/card';
import { HlmButtonDirective } from '@spartan-ng/helm/button';
import { HlmInputDirective } from '@spartan-ng/helm/input';
import { getDeploymentsForProject } from '../../../../api/project';
import { BrnSelectModule } from '@spartan-ng/brain/select';
import {
  HlmSelectDirective,
  HlmSelectContentDirective,
  HlmSelectTriggerComponent,
  HlmSelectOptionComponent,
} from '@spartan-ng/helm/select';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronDown, lucideTrendingUp, lucideChevronLeft, lucideChevronRight } from '@ng-icons/lucide';
import { HlmIconDirective } from '@spartan-ng/helm/icon';
import { FormsModule } from '@angular/forms';
import { RelativeDatePipe } from '../../../pipes/relative-date-pipe';
import { Chart, ChartConfiguration, ChartType } from 'chart.js';
import { registerables } from 'chart.js';

@Component({
  template: `
    @if (contextService.selectedProject(); as proj) {
      <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col justify-between gap-4 sm:flex-row">
          <div class="flex items-center justify-between grow">
            <div>
              <h1 class="text-2xl font-semibold text-foreground">
                {{ proj.name }}
              </h1>
              <p class="text-muted-foreground">Analytics Dashboard</p>
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
                      {{ selectedDeploymentVersion ? 'v' + selectedDeploymentVersion : 'All Versions' }}
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
                  @for (revision of deploymentRevisions.value(); track revision.id) {
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

        <!-- Overview Cards -->
        <div class="flex gap-4">
          <div hlmCard class="flex-1">
            <div hlmCardContent class="p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-muted-foreground">
                    Total Sessions
                  </p>
                  <p class="text-2xl font-bold">12,847</p>
                  <p class="text-xs text-green-600">+12.5% from last period</p>
                </div>
                <div
                  class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center"
                >
                  <svg
                    class="w-4 h-4 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    ></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div hlmCard class="flex-1">
            <div hlmCardContent class="p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-muted-foreground">
                    Total Tool Calls
                  </p>
                  <p class="text-2xl font-bold">89,234</p>
                  <p class="text-xs text-green-600">+8.2% from last period</p>
                </div>
                <div
                  class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center"
                >
                  <svg
                    class="w-4 h-4 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    ></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div hlmCard class="flex-1">
            <div hlmCardContent class="p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-muted-foreground">
                    Users
                  </p>
                  <p class="text-2xl font-bold">1,247</p>
                  <p class="text-xs text-green-600">+15.3% from last period</p>
                </div>
                <div
                  class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center"
                >
                  <svg
                    class="w-4 h-4 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    ></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div hlmCard class="flex-1">
            <div hlmCardContent class="p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-muted-foreground">
                    Avg Latency
                  </p>
                  <p class="text-2xl font-bold">142ms</p>
                  <p class="text-xs text-red-600">+5.3% from last period</p>
                </div>
                <div
                  class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center"
                >
                  <svg
                    class="w-4 h-4 text-yellow-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div hlmCard>
            <div hlmCardContent class="p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-muted-foreground">
                    Error Rate
                  </p>
                  <p class="text-2xl font-bold">0.8%</p>
                  <p class="text-xs text-green-600">-0.3% from last period</p>
                </div>
                <div
                  class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center"
                >
                  <svg
                    class="w-4 h-4 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tools Performance Chart -->
        <div hlmCard>
          <div hlmCardHeader>
            <div hlmCardTitle>Tools Performance</div>
            <p class="text-sm text-muted-foreground">
              Performance insights and optimization opportunities
            </p>
          </div>
          <div hlmCardContent>
            <div class="space-y-6">
              <!-- Top 3 Performing Tools -->
              <div>
                <h4 hlmH4 class="mb-3 text-green-700">Top Performing Tools</h4>
                <!-- Tool 1 -->
                <div
                  class="flex items-center justify-between p-4 bg-muted/50 rounded-lg mb-3"
                >
                  <div class="flex items-center space-x-4">
                    <div
                      class="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center"
                    >
                      <span class="text-yellow-600 font-bold text-base ml-0.5">1.</span>
                    </div>
                    <div>
                      <p class="font-medium">Code Generation</p>
                    </div>
                  </div>
                  <div class="flex items-center space-x-6">
                    <div class="text-right">
                      <p class="font-medium">2,847 calls</p>
                      <p class="text-sm text-muted-foreground">98.2% success</p>
                    </div>
                    <div class="text-right">
                      <p class="font-medium">156ms</p>
                      <p class="text-sm text-muted-foreground">avg latency</p>
                    </div>
                  </div>
                </div>

                <!-- Tool 2 -->
                <div
                  class="flex items-center justify-between p-4 bg-muted/50 rounded-lg mb-3"
                >
                  <div class="flex items-center space-x-4">
                    <div
                      class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center"
                    >
                      <span class="text-gray-600 font-bold text-base ml-0.5">2.</span>
                    </div>
                    <div>
                      <p class="font-medium">Chat Completion</p>
                    </div>
                  </div>
                  <div class="flex items-center space-x-6">
                    <div class="text-right">
                      <p class="font-medium">1,923 calls</p>
                      <p class="text-sm text-muted-foreground">99.1% success</p>
                    </div>
                    <div class="text-right">
                      <p class="font-medium">234ms</p>
                      <p class="text-sm text-muted-foreground">avg latency</p>
                    </div>
                  </div>
                </div>

                <!-- Tool 3 -->
                <div
                  class="flex items-center justify-between p-4 bg-muted/50 rounded-lg mb-3"
                >
                  <div class="flex items-center space-x-4">
                    <div
                      class="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center"
                    >
                      <span class="text-orange-600 font-bold text-base ml-0.5">3.</span>
                    </div>
                    <div>
                      <p class="font-medium">File Operations</p>
                    </div>
                  </div>
                  <div class="flex items-center space-x-6">
                    <div class="text-right">
                      <p class="font-medium">1,456 calls</p>
                      <p class="text-sm text-muted-foreground">97.8% success</p>
                    </div>
                    <div class="text-right">
                      <p class="font-medium">89ms</p>
                      <p class="text-sm text-muted-foreground">avg latency</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Tools Requiring Attention -->
              <div class="mt-6">
                <h4 hlmH4 class="mb-3 text-red-700">
                  Tools Requiring Attention
                </h4>
                <!-- Tool with Warning 1 -->
                <div
                  class="flex items-center justify-between p-4 bg-muted/50 rounded-lg mb-3"
                >
                  <div class="flex items-center space-x-4">
                    <div
                      class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center"
                    >
                      <svg
                        class="w-5 h-5 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                        ></path>
                      </svg>
                    </div>
                    <div>
                      <p class="font-medium">Database Operations</p>
                    </div>
                  </div>
                                      <div class="flex items-center space-x-6">
                      <div class="text-right">
                        <p class="font-medium">892 calls</p>
                        <p class="text-sm text-red-600 font-medium">
                          85.2% success
                        </p>
                      </div>
                      <div class="text-right">
                        <p class="font-medium">342ms</p>
                        <p class="text-sm text-muted-foreground">avg latency</p>
                      </div>
                    </div>
                </div>

                <!-- Tool with Warning 2 -->
                <div
                  class="flex items-center justify-between p-4 bg-muted/50 rounded-lg mb-3"
                >
                  <div class="flex items-center space-x-4">
                    <div
                      class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center"
                    >
                      <svg
                        class="w-5 h-5 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                        ></path>
                      </svg>
                    </div>
                    <div>
                      <p class="font-medium">External API Calls</p>
                    </div>
                  </div>
                                      <div class="flex items-center space-x-6">
                      <div class="text-right">
                        <p class="font-medium">567 calls</p>
                        <p class="text-sm text-red-600 font-medium">
                          91.3% success
                        </p>
                      </div>
                      <div class="text-right">
                        <p class="font-medium">567ms</p>
                        <p class="text-sm text-muted-foreground">avg latency</p>
                      </div>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tool Analytics -->
        <div hlmCard>
          <div hlmCardHeader>
            <div class="flex items-center justify-between">
              <div>
                <div hlmCardTitle>Tool Analytics</div>
                <p class="text-sm text-muted-foreground">
                  Parameter usage insights for your MCP tools
                </p>
              </div>
              <!-- Select Tool Dropdown -->
              <div class="relative">
                <brn-select
                  [ngModel]="selectedTool"
                  (ngModelChange)="onToolChange($event)"
                  class="min-w-[200px]"
                >
                  <hlm-select-trigger>
                    <div class="flex items-center justify-between w-full">
                      <div class="flex items-center gap-2">
                        <span class="text-sm font-medium">{{ selectedTool.name }}</span>
                        <span class="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full font-medium">
                          {{ selectedTool.calls }} calls
                        </span>
                      </div>
                      <ng-icon hlm name="lucideChevronDown" size="sm" class="text-muted-foreground" />
                    </div>
                  </hlm-select-trigger>
                  <hlm-select-content>
                    @for (tool of availableTools; track tool.name) {
                      <hlm-option [value]="tool">
                        <div class="flex items-center justify-between w-full">
                          <div class="flex items-center gap-2">
                            <span class="text-sm font-medium">{{ tool.name }}</span>
                            <span class="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full font-medium">
                              {{ tool.calls }} calls
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
          <div hlmCardContent>
            <div class="space-y-6">

              <!-- Parameter Usage Distribution -->
              <div class="space-y-6">
                <!-- Parameter Cards -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  @for (parameter of visibleParameters; track parameter.name) {
                    <div hlmCard class="p-5">
                      <div hlmCardHeader class="pb-3">
                        <div hlmCardTitle class="text-base">{{ parameter.name }}</div>
                        <p class="text-sm text-muted-foreground">Parameter {{ currentParameterIndex + $index + 1 }}</p>
                      </div>
                      <div hlmCardContent class="space-y-3">
                        @for (value of parameter.values; track value.name) {
                          <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-3 min-w-0 flex-1">
                              <div
                                class="w-3 h-3 rounded-full flex-shrink-0"
                                [style.background-color]="value.color"
                              ></div>
                              <span class="text-sm font-medium truncate">{{ value.name }}</span>
                            </div>
                            <div class="flex items-center space-x-3 flex-shrink-0">
                              <div class="w-24 bg-gray-200 rounded-full h-2.5">
                                <div
                                  class="h-2.5 rounded-full"
                                  [style.background-color]="value.color"
                                  [style.width]="value.percentage + '%'"
                                ></div>
                              </div>
                              <span class="text-sm font-bold w-12 text-right">{{ value.percentage }}%</span>
                            </div>
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>

                <!-- Navigation Controls -->
                <div class="flex items-center justify-center">
                  <div class="flex items-center space-x-3">
                    <button
                      hlmButton
                      variant="outline"
                      size="sm"
                      [disabled]="currentParameterIndex === 0"
                      (click)="previousParameter()"
                    >
                      <ng-icon hlm name="lucideChevronLeft" size="sm" />
                    </button>
                    <span class="text-sm text-muted-foreground min-w-[60px] text-center">
                      {{ currentParameterIndex + 1 }} of {{ parameters.length }}
                    </span>
                    <button
                      hlmButton
                      variant="outline"
                      size="sm"
                      [disabled]="currentParameterIndex === parameters.length - 1"
                      (click)="nextParameter()"
                    >
                      <ng-icon hlm name="lucideChevronRight" size="sm" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Client Usage -->
        <div hlmCard>
          <div hlmCardHeader>
            <div hlmCardTitle>Client Usage</div>
            <p class="text-sm text-muted-foreground">
              Traffic distribution across MCP clients
            </p>
          </div>
          <div hlmCardContent>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Chart.js Pie Chart -->
              <div class="flex justify-center items-center">
                <div class="relative w-64 h-64">
                  <canvas #pieChart></canvas>
                </div>
              </div>

              <!-- Legend and Details -->
              <div class="space-y-3">
                <!-- Cursor -->
                <div class="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div class="flex items-center space-x-3">
                    <div class="w-4 h-4 bg-blue-500 rounded-full"></div>
                    <div>
                      <div class="font-medium">Cursor</div>
                      <div class="text-sm text-muted-foreground">6,680 sessions</div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-lg font-bold">52%</div>
                  </div>
                </div>

                <!-- ChatGPT -->
                <div class="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div class="flex items-center space-x-3">
                    <div class="w-4 h-4 bg-green-500 rounded-full"></div>
                    <div>
                      <div class="font-medium">ChatGPT</div>
                      <div class="text-sm text-muted-foreground">3,597 sessions</div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-lg font-bold">28%</div>
                  </div>
                </div>

                <!-- Claude Pro -->
                <div class="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div class="flex items-center space-x-3">
                    <div class="w-4 h-4 bg-purple-500 rounded-full"></div>
                    <div>
                      <div class="font-medium">Claude Pro</div>
                      <div class="text-sm text-muted-foreground">1,927 sessions</div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-lg font-bold">15%</div>
                  </div>
                </div>

                <!-- Other -->
                <div class="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div class="flex items-center space-x-3">
                    <div class="w-4 h-4 bg-orange-500 rounded-full"></div>
                    <div>
                      <div class="font-medium">Other</div>
                      <div class="text-sm text-muted-foreground">643 sessions</div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-lg font-bold">5%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Sessions Table -->
        <div hlmCard>
          <div hlmCardHeader>
            <div hlmCardTitle>Recent Sessions</div>
            <p class="text-sm text-muted-foreground">
              Latest user sessions with performance metrics
            </p>
          </div>
          <div hlmCardContent>
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-border">
                    <th class="text-left py-3 px-4 font-medium">Session ID</th>
                    <th class="text-left py-3 px-4 font-medium">User</th>
                    <th class="text-left py-3 px-4 font-medium">Duration</th>
                    <th class="text-left py-3 px-4 font-medium">Calls</th>
                    <th class="text-left py-3 px-4 font-medium">Errors</th>
                    <th class="text-left py-3 px-4 font-medium">Last Tool Call</th>
                    <th class="text-left py-3 px-4 font-medium">Started</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="border-b border-border">
                    <td class="py-3 px-4 font-mono text-sm">sess_abc123</td>
                    <td class="py-3 px-4">john.doe&#64;example.com</td>
                    <td class="py-3 px-4">2m 34s</td>
                    <td class="py-3 px-4">12</td>
                    <td class="py-3 px-4">0</td>
                    <td class="py-3 px-4">
                      <span class="text-sm font-medium">get_weather</span>
                    </td>
                    <td class="py-3 px-4">2 minutes ago</td>
                  </tr>
                  <tr class="border-b border-border">
                    <td class="py-3 px-4 font-mono text-sm">sess_def456</td>
                    <td class="py-3 px-4">jane.smith&#64;example.com</td>
                    <td class="py-3 px-4">1m 47s</td>
                    <td class="py-3 px-4">8</td>
                    <td class="py-3 px-4">1</td>
                    <td class="py-3 px-4">
                      <span class="text-sm font-medium">code_generation</span>
                    </td>
                    <td class="py-3 px-4">5 minutes ago</td>
                  </tr>
                  <tr class="border-b border-border">
                    <td class="py-3 px-4 font-mono text-sm">sess_ghi789</td>
                    <td class="py-3 px-4">mike.wilson&#64;example.com</td>
                    <td class="py-3 px-4">3m 12s</td>
                    <td class="py-3 px-4">15</td>
                    <td class="py-3 px-4">0</td>
                    <td class="py-3 px-4">
                      <span class="text-sm font-medium">file_operations</span>
                    </td>
                    <td class="py-3 px-4">8 minutes ago</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  imports: [
    HlmH3Directive,
    HlmH4Directive,
    HlmCardDirective,
    HlmCardContentDirective,
    HlmCardHeaderDirective,
    HlmCardTitleDirective,
    HlmButtonDirective,
    HlmInputDirective,
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
  providers: [provideIcons({ lucideChevronDown, lucideTrendingUp, lucideChevronLeft, lucideChevronRight })],
})
export class ProjectDashboardComponent implements AfterViewInit, OnDestroy {
  @ViewChild('pieChart', { static: false }) pieChartCanvas!: any;

  readonly contextService = inject(ContextService);
  selectedDeploymentVersion: string | null = null;
  readonly deploymentRevisions = getDeploymentsForProject(this.contextService.selectedProject);

  currentParameterIndex = 0;
  private pieChart: Chart | null = null;

  // Available tools for selection
  availableTools = [
    { name: 'get_weather', calls: 1053 },
    { name: 'code_generation', calls: 2847 },
    { name: 'file_operations', calls: 1456 },
    { name: 'database_query', calls: 892 },
    { name: 'api_request', calls: 567 },
    { name: 'image_processing', calls: 234 },
    { name: 'text_analysis', calls: 1891 },
    { name: 'data_visualization', calls: 445 }
  ];

  selectedTool = this.availableTools[0]; // Default to first tool

  // Tool-specific parameter data - in a real app, this would come from an API
  toolParameters: { [key: string]: any[] } = {
    'get_weather': [
      {
        name: 'Location',
        values: [
          { name: 'New York', percentage: 49.7, color: '#3b82f6' },
          { name: 'San Francisco', percentage: 42, color: '#10b981' },
          { name: 'Berlin', percentage: 8.3, color: '#8b5cf6' }
        ]
      },
      {
        name: 'Time',
        values: [
          { name: 'today', percentage: 78, color: '#3b82f6' },
          { name: 'tomorrow', percentage: 12, color: '#10b981' },
          { name: 'next week', percentage: 10, color: '#8b5cf6' }
        ]
      },
      {
        name: 'Temperature Unit',
        values: [
          { name: 'celsius', percentage: 65, color: '#3b82f6' },
          { name: 'fahrenheit', percentage: 35, color: '#ef4444' }
        ]
      }
    ],
    'code_generation': [
      {
        name: 'Language',
        values: [
          { name: 'JavaScript', percentage: 45, color: '#3b82f6' },
          { name: 'Python', percentage: 32, color: '#10b981' },
          { name: 'TypeScript', percentage: 18, color: '#8b5cf6' },
          { name: 'Go', percentage: 5, color: '#ef4444' }
        ]
      },
      {
        name: 'Framework',
        values: [
          { name: 'React', percentage: 38, color: '#3b82f6' },
          { name: 'Angular', percentage: 25, color: '#10b981' },
          { name: 'Vue', percentage: 22, color: '#8b5cf6' },
          { name: 'Svelte', percentage: 15, color: '#ef4444' }
        ]
      },
      {
        name: 'Component Type',
        values: [
          { name: 'UI Component', percentage: 52, color: '#3b82f6' },
          { name: 'API Endpoint', percentage: 28, color: '#10b981' },
          { name: 'Utility Function', percentage: 20, color: '#8b5cf6' }
        ]
      },
      {
        name: 'Complexity',
        values: [
          { name: 'Simple', percentage: 40, color: '#3b82f6' },
          { name: 'Medium', percentage: 45, color: '#10b981' },
          { name: 'Complex', percentage: 15, color: '#8b5cf6' }
        ]
      }
    ],
    'file_operations': [
      {
        name: 'Operation Type',
        values: [
          { name: 'Read', percentage: 55, color: '#3b82f6' },
          { name: 'Write', percentage: 30, color: '#10b981' },
          { name: 'Delete', percentage: 15, color: '#8b5cf6' }
        ]
      },
      {
        name: 'File Type',
        values: [
          { name: 'Text Files', percentage: 45, color: '#3b82f6' },
          { name: 'JSON', percentage: 35, color: '#10b981' },
          { name: 'Images', percentage: 20, color: '#8b5cf6' }
        ]
      }
    ],
    'database_query': [
      {
        name: 'Query Type',
        values: [
          { name: 'SELECT', percentage: 70, color: '#3b82f6' },
          { name: 'INSERT', percentage: 15, color: '#10b981' },
          { name: 'UPDATE', percentage: 10, color: '#8b5cf6' },
          { name: 'DELETE', percentage: 5, color: '#ef4444' }
        ]
      },
      {
        name: 'Database',
        values: [
          { name: 'PostgreSQL', percentage: 45, color: '#3b82f6' },
          { name: 'MySQL', percentage: 30, color: '#10b981' },
          { name: 'MongoDB', percentage: 25, color: '#8b5cf6' }
        ]
      },
      {
        name: 'Table Size',
        values: [
          { name: 'Small (<1K rows)', percentage: 40, color: '#3b82f6' },
          { name: 'Medium (1K-100K)', percentage: 45, color: '#10b981' },
          { name: 'Large (>100K)', percentage: 15, color: '#8b5cf6' }
        ]
      }
    ],
    'api_request': [
      {
        name: 'HTTP Method',
        values: [
          { name: 'GET', percentage: 60, color: '#3b82f6' },
          { name: 'POST', percentage: 25, color: '#10b981' },
          { name: 'PUT', percentage: 10, color: '#8b5cf6' },
          { name: 'DELETE', percentage: 5, color: '#ef4444' }
        ]
      },
      {
        name: 'API Type',
        values: [
          { name: 'REST', percentage: 75, color: '#3b82f6' },
          { name: 'GraphQL', percentage: 20, color: '#10b981' },
          { name: 'WebSocket', percentage: 5, color: '#8b5cf6' }
        ]
      },
      {
        name: 'Response Format',
        values: [
          { name: 'JSON', percentage: 85, color: '#3b82f6' },
          { name: 'XML', percentage: 10, color: '#10b981' },
          { name: 'Text', percentage: 5, color: '#8b5cf6' }
        ]
      }
    ],
    'image_processing': [
      {
        name: 'Operation',
        values: [
          { name: 'Resize', percentage: 40, color: '#3b82f6' },
          { name: 'Crop', percentage: 30, color: '#10b981' },
          { name: 'Filter', percentage: 20, color: '#8b5cf6' },
          { name: 'Convert', percentage: 10, color: '#ef4444' }
        ]
      },
      {
        name: 'Format',
        values: [
          { name: 'JPEG', percentage: 50, color: '#3b82f6' },
          { name: 'PNG', percentage: 35, color: '#10b981' },
          { name: 'WebP', percentage: 15, color: '#8b5cf6' }
        ]
      },
      {
        name: 'Quality',
        values: [
          { name: 'High', percentage: 45, color: '#3b82f6' },
          { name: 'Medium', percentage: 40, color: '#10b981' },
          { name: 'Low', percentage: 15, color: '#8b5cf6' }
        ]
      },
      {
        name: 'Size',
        values: [
          { name: 'Small (<1MB)', percentage: 60, color: '#3b82f6' },
          { name: 'Medium (1-5MB)', percentage: 30, color: '#10b981' },
          { name: 'Large (>5MB)', percentage: 10, color: '#8b5cf6' }
        ]
      }
    ],
    'text_analysis': [
      {
        name: 'Analysis Type',
        values: [
          { name: 'Sentiment', percentage: 35, color: '#3b82f6' },
          { name: 'Keywords', percentage: 30, color: '#10b981' },
          { name: 'Summarization', percentage: 20, color: '#8b5cf6' },
          { name: 'Translation', percentage: 15, color: '#ef4444' }
        ]
      },
      {
        name: 'Language',
        values: [
          { name: 'English', percentage: 70, color: '#3b82f6' },
          { name: 'Spanish', percentage: 15, color: '#10b981' },
          { name: 'French', percentage: 10, color: '#8b5cf6' },
          { name: 'German', percentage: 5, color: '#ef4444' }
        ]
      },
      {
        name: 'Text Length',
        values: [
          { name: 'Short (<100 chars)', percentage: 25, color: '#3b82f6' },
          { name: 'Medium (100-500)', percentage: 50, color: '#10b981' },
          { name: 'Long (>500 chars)', percentage: 25, color: '#8b5cf6' }
        ]
      },
      {
        name: 'Output Format',
        values: [
          { name: 'JSON', percentage: 60, color: '#3b82f6' },
          { name: 'Text', percentage: 25, color: '#10b981' },
          { name: 'CSV', percentage: 15, color: '#8b5cf6' }
        ]
      },
      {
        name: 'Confidence Level',
        values: [
          { name: 'High (>90%)', percentage: 45, color: '#3b82f6' },
          { name: 'Medium (70-90%)', percentage: 40, color: '#10b981' },
          { name: 'Low (<70%)', percentage: 15, color: '#8b5cf6' }
        ]
      }
    ],
    'data_visualization': [
      {
        name: 'Chart Type',
        values: [
          { name: 'Bar Chart', percentage: 35, color: '#3b82f6' },
          { name: 'Line Chart', percentage: 25, color: '#10b981' },
          { name: 'Pie Chart', percentage: 20, color: '#8b5cf6' },
          { name: 'Scatter Plot', percentage: 15, color: '#ef4444' },
          { name: 'Heatmap', percentage: 5, color: '#f59e0b' }
        ]
      },
      {
        name: 'Data Source',
        values: [
          { name: 'CSV', percentage: 40, color: '#3b82f6' },
          { name: 'JSON', percentage: 35, color: '#10b981' },
          { name: 'Database', percentage: 25, color: '#8b5cf6' }
        ]
      },
      {
        name: 'Output Format',
        values: [
          { name: 'PNG', percentage: 50, color: '#3b82f6' },
          { name: 'SVG', percentage: 30, color: '#10b981' },
          { name: 'PDF', percentage: 20, color: '#8b5cf6' }
        ]
      },
      {
        name: 'Theme',
        values: [
          { name: 'Light', percentage: 60, color: '#3b82f6' },
          { name: 'Dark', percentage: 30, color: '#10b981' },
          { name: 'Custom', percentage: 10, color: '#8b5cf6' }
        ]
      },
      {
        name: 'Interactivity',
        values: [
          { name: 'Static', percentage: 45, color: '#3b82f6' },
          { name: 'Interactive', percentage: 40, color: '#10b981' },
          { name: 'Animated', percentage: 15, color: '#8b5cf6' }
        ]
      },
      {
        name: 'Size',
        values: [
          { name: 'Small', percentage: 30, color: '#3b82f6' },
          { name: 'Medium', percentage: 45, color: '#10b981' },
          { name: 'Large', percentage: 25, color: '#8b5cf6' }
        ]
      }
    ]
  };

  get parameters() {
    return this.toolParameters[this.selectedTool.name] || [];
  }

  get visibleParameters() {
    const startIndex = this.currentParameterIndex;
    const endIndex = Math.min(startIndex + 2, this.parameters.length);
    return this.parameters.slice(startIndex, endIndex);
  }

  previousParameter() {
    if (this.currentParameterIndex > 0) {
      this.currentParameterIndex = Math.max(0, this.currentParameterIndex - 2);
    }
  }

  nextParameter() {
    if (this.currentParameterIndex < this.parameters.length - 2) {
      this.currentParameterIndex = Math.min(this.parameters.length - 2, this.currentParameterIndex + 2);
    }
  }

  onToolChange(tool: any) {
    this.selectedTool = tool;
    // TODO: Implement logic to load parameter data for the selected tool
    console.log('Selected tool:', tool.name);
  }

  onDeploymentVersionChange(version: string) {
    this.selectedDeploymentVersion = version;
    // TODO: Implement logic to filter data based on selected version
  }

  ngAfterViewInit() {
    // Use setTimeout to ensure the canvas element is fully rendered
    setTimeout(() => {
      this.initializeChart();
    }, 100);
  }

  ngOnDestroy() {
    // Clean up the chart to prevent memory leaks
    if (this.pieChart) {
      this.pieChart.destroy();
      this.pieChart = null;
    }
  }

  private initializeChart() {
    try {
      // Check if canvas element exists
      if (!this.pieChartCanvas?.nativeElement) {
        console.warn('Pie chart canvas element not found');
        return;
      }

      // Register Chart.js components
      Chart.register(...registerables);

      const ctx = this.pieChartCanvas.nativeElement.getContext('2d');

      if (!ctx) {
        console.error('Could not get 2D context from canvas');
        return;
      }

      // Destroy existing chart if it exists
      if (this.pieChart) {
        this.pieChart.destroy();
      }

      this.pieChart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: ['Cursor', 'ChatGPT', 'Claude Pro', 'Other'],
          datasets: [{
            data: [52, 28, 15, 5],
            backgroundColor: [
              '#3b82f6', // blue
              '#10b981', // green
              '#8b5cf6', // purple
              '#f97316'  // orange
            ],
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.parsed;
                  return `${label}: ${value}%`;
                }
              }
            }
          }
        }
      });

      console.log('Pie chart initialized successfully');
    } catch (error) {
      console.error('Error initializing pie chart:', error);
    }
  }
}
