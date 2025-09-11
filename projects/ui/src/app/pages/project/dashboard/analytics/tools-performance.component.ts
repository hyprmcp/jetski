import { Component, Input } from '@angular/core';
import {
  HlmCardContent,
  HlmCard,
  HlmCardHeader,
  HlmCardTitle,
} from '@spartan-ng/helm/card';
import { HlmH4 } from '@spartan-ng/helm/typography';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideTriangleAlert } from '@ng-icons/lucide';
import { DecimalPipe, PercentPipe } from '@angular/common';
import { ToolsPerformance } from './tools-performance';

@Component({
  selector: 'app-tools-performance',
  template: `
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
            @if (data.topPerformingTools.length) {
              <h4 hlmH4 class="mb-3 text-green-700">Top Performing Tools</h4>
            }
            @for (
              tool of data.topPerformingTools;
              track tool.name;
              let i = $index
            ) {
              <div
                class="flex items-center justify-between p-4 bg-muted/50 rounded-lg mb-3"
              >
                <div class="flex items-center space-x-4">
                  <div
                    class="w-10 h-10 rounded-lg flex items-center justify-center"
                    [class]="getRankingBadgeClass(i)"
                  >
                    <span
                      class="font-bold text-base ml-0.5"
                      [class]="getRankingTextClass(i)"
                    >
                      {{ i + 1 }}.
                    </span>
                  </div>
                  <div>
                    <p class="font-medium">{{ tool.name }}</p>
                  </div>
                </div>
                <div class="flex items-center space-x-6">
                  <div class="text-right">
                    <p class="font-medium">
                      {{ tool.totalCalls | number }} calls
                    </p>
                    <p class="text-sm text-muted-foreground">
                      {{ 1 - tool.errorRate | percent }} success rate
                    </p>
                  </div>
                  <div class="text-right">
                    <p class="font-medium">{{ tool.avgLatency }}ms</p>
                    <p class="text-sm text-muted-foreground">avg latency</p>
                  </div>
                </div>
              </div>
            }
          </div>

          <!-- Tools Requiring Attention -->
          <div class="mt-6">
            @if (data.toolsRequiringAttention.length) {
              <h4 hlmH4 class="mb-3 text-red-700">Tools Requiring Attention</h4>
            }
            @for (tool of data.toolsRequiringAttention; track tool.name) {
              <div
                class="flex items-center justify-between p-4 bg-muted/50 rounded-lg mb-3"
              >
                <div class="flex items-center space-x-4">
                  <div
                    class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center"
                  >
                    <ng-icon
                      name="lucideTriangleAlert"
                      size="20"
                      class="text-red-600"
                    />
                  </div>
                  <div>
                    <p class="font-medium">{{ tool.name }}</p>
                  </div>
                </div>
                <div class="flex items-center space-x-6">
                  <div class="text-right">
                    <p class="font-medium">
                      {{ tool.totalCalls | number }} calls
                    </p>
                    <p class="text-sm text-red-600 font-medium">
                      {{ tool.errorRate | percent }} error rate
                    </p>
                  </div>
                  <div class="text-right">
                    <p class="font-medium">{{ tool.avgLatency }}ms</p>
                    <p class="text-sm text-muted-foreground">avg latency</p>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  imports: [
    HlmH4,
    HlmCard,
    HlmCardContent,
    HlmCardHeader,
    HlmCardTitle,
    NgIcon,
    DecimalPipe,
    PercentPipe,
  ],
  providers: [
    provideIcons({
      lucideTriangleAlert,
    }),
  ],
})
export class ToolsPerformanceComponent {
  @Input() data!: ToolsPerformance;

  getRankingBadgeClass(index: number): string {
    const classes = [
      'bg-yellow-100', // 1st place
      'bg-gray-100', // 2nd place
      'bg-orange-100', // 3rd place
    ];
    return classes[index] || 'bg-gray-100';
  }

  getRankingTextClass(index: number): string {
    const classes = [
      'text-yellow-600', // 1st place
      'text-gray-600', // 2nd place
      'text-orange-600', // 3rd place
    ];
    return classes[index] || 'text-gray-600';
  }
}
