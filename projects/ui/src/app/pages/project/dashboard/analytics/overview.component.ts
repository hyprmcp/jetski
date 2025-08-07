import { Component, Input } from '@angular/core';
import {
  HlmCardContentDirective,
  HlmCardDirective,
} from '@spartan-ng/helm/card';
import { BrnSelectModule } from '@spartan-ng/brain/select';
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
import { FormsModule } from '@angular/forms';
import { DecimalPipe, PercentPipe } from '@angular/common';
import { Overview } from './overview';

@Component({
  selector: 'app-project-analytics-overview',
  template: `
    <!-- Overview Cards -->
    <div class="flex gap-4">
      <!-- Total Sessions Card -->
      <div hlmCard class="flex-1">
        <div hlmCardContent class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted-foreground">
                Total Sessions
              </p>
              <p class="text-2xl font-bold">
                {{ data.totalSessionCount | number }}
              </p>
              <p
                class="text-xs"
                [class.text-green-600]="data.totalSessionChange > 0"
                [class.text-red-600]="data.totalSessionChange < 0"
              >
                {{ data.totalSessionChange > 0 ? '+' : ''
                }}{{ data.totalSessionChange | percent: '1.0-2' }}
                from last period
              </p>
            </div>
            <div
              class="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-100 text-blue-600"
            >
              <ng-icon name="lucideFileChartColumn" />
            </div>
          </div>
        </div>
      </div>

      <!-- Total Tool Calls Card -->
      <div hlmCard class="flex-1">
        <div hlmCardContent class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted-foreground">
                Total Tool Calls
              </p>
              <p class="text-2xl font-bold">
                {{ data.totalToolCallsCount | number }}
              </p>
              <p
                class="text-xs"
                [class.text-green-600]="data.totalToolCallsChange > 0"
                [class.text-red-600]="data.totalToolCallsChange < 0"
              >
                {{ data.totalToolCallsChange > 0 ? '+' : ''
                }}{{ data.totalToolCallsChange | percent: '1.0-2' }}
                from last period
              </p>
            </div>
            <div
              class="w-8 h-8 rounded-lg flex items-center justify-center bg-green-100 text-green-600"
            >
              <ng-icon name="lucideZap" />
            </div>
          </div>
        </div>
      </div>

      <!-- Users Card -->
      <div hlmCard class="flex-1">
        <div hlmCardContent class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted-foreground">Users</p>
              <p class="text-2xl font-bold">
                {{ data.usersCount | number }}
              </p>
              <p
                class="text-xs"
                [class.text-green-600]="data.usersChange > 0"
                [class.text-red-600]="data.usersChange < 0"
              >
                {{ data.usersChange > 0 ? '+' : ''
                }}{{ data.usersChange | percent: '1.0-2' }}
                from last period
              </p>
            </div>
            <div
              class="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-100 text-purple-600"
            >
              <ng-icon name="lucideUsers" />
            </div>
          </div>
        </div>
      </div>

      <!-- Avg Latency Card -->
      <div hlmCard class="flex-1">
        <div hlmCardContent class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted-foreground">
                Avg Latency
              </p>
              <p class="text-2xl font-bold">{{ data.avgLatencyValue }}ms</p>
              <p
                class="text-xs"
                [class.text-green-600]="data.avgLatencyChange < 0"
                [class.text-red-600]="data.avgLatencyChange > 0"
              >
                {{ data.avgLatencyChange > 0 ? '+' : ''
                }}{{ data.avgLatencyChange | percent: '1.0-2' }}
                from last period
              </p>
            </div>
            <div
              class="w-8 h-8 rounded-lg flex items-center justify-center bg-yellow-100 text-yellow-600"
            >
              <ng-icon name="lucideClock" />
            </div>
          </div>
        </div>
      </div>

      <!-- Error Rate Card -->
      <div hlmCard class="flex-1">
        <div hlmCardContent class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-muted-foreground">
                Error Rate
              </p>
              <p class="text-2xl font-bold">
                {{ data.errorRateValue | percent: '1.0-2' }}
              </p>
              <p
                class="text-xs"
                [class.text-green-600]="data.errorRateChange < 0"
                [class.text-red-600]="data.errorRateChange > 0"
              >
                {{ data.errorRateChange > 0 ? '+' : ''
                }}{{ data.errorRateChange | percent: '1.0-3' }}
                from last period
              </p>
            </div>
            <div
              class="w-8 h-8 rounded-lg flex items-center justify-center bg-red-100 text-red-600"
            >
              <ng-icon name="lucideCircleAlert" />
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  imports: [
    HlmCardDirective,
    HlmCardContentDirective,
    BrnSelectModule,
    FormsModule,
    NgIcon,
    PercentPipe,
    DecimalPipe,
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
export class OverviewComponent {
  @Input() data!: Overview;
}
