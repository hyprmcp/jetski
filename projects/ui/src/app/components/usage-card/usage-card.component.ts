import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  HlmCardContentDirective,
  HlmCardDirective,
} from '@spartan-ng/helm/card';
import { HlmH3Directive } from '@spartan-ng/helm/typography';

@Component({
  selector: 'app-usage-card',
  standalone: true,
  imports: [
    CommonModule,
    HlmCardDirective,
    HlmCardContentDirective,
    HlmH3Directive,
  ],
  template: `
    <h3 hlmH3>Usage</h3>
    <section hlmCard>
      <div hlmCardContent>
        <div class="space-y-4">
          <div class="text-sm text-muted-foreground">
            <div class="font-medium mb-1">Last 30 days</div>
            <div class="text-xs">Last activity 1s ago</div>
          </div>

          <div class="space-y-3">
            @for (metric of usageMetrics; track metric.label) {
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <div
                    class="w-2 h-2 rounded-full"
                    [ngClass]="metric.color"
                  ></div>
                  <span class="text-sm">{{ metric.label }}</span>
                </div>
                <div class="text-sm font-medium">{{ metric.value }}</div>
              </div>
            }
          </div>
        </div>
      </div>
    </section>
  `,
})
export class UsageCardComponent {
  usageMetrics = [
    { label: 'Deployed Servers', value: '2 / 5', color: 'bg-yellow-400' },
    { label: 'Clients', value: '20 / 10K', color: 'bg-blue-500' },
    { label: 'Tool Requests', value: '42K / 1M', color: 'bg-gray-400' },
  ];
}
