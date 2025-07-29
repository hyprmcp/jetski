import { Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  HlmCardContentDirective,
  HlmCardDirective,
} from '@spartan-ng/helm/card';
import { HlmH3Directive } from '@spartan-ng/helm/typography';
import { Organization } from '../../../api/organization';
import { getUsage, Usage } from '../../../api/dashboard';
import { ContextService } from '../../services/context.service';
import { HttpResourceRef } from '@angular/common/http';

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
            @for (metric of metrics(); track metric.label) {
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
  readonly contextService = inject(ContextService);
  readonly organization = input<Organization>();
  readonly usage = getUsage(this.organization);

  readonly metrics = computed(() => {
    const projects =
      this.contextService.projects
        .value()
        ?.filter((p) => p.organizationId === this.organization()?.id) ?? [];
    return [
      {
        label: 'Projects',
        value: `${projects.length} / 5`,
        color: 'bg-yellow-400',
      },
      this.getSessionUsage(this.usage),
      this.getRequestUsage(this.usage),
    ];
  });

  private getSessionUsage(usage: HttpResourceRef<Usage | undefined>) {
    const count = usage.hasValue() ? (usage.value()?.sessionCount ?? 0) : 0;
    const formattedCount =
      count > 1000 ? (count / 1000).toFixed(1) + 'K' : count;
    return {
      label: 'Sessions',
      value: `${usage.hasValue() ? formattedCount : 'n.a.'} / 10K`,
      color: 'bg-yellow-400',
    };
  }

  private getRequestUsage(usage: HttpResourceRef<Usage | undefined>) {
    const count = usage.hasValue() ? (usage.value()?.requestCount ?? 0) : 0;
    const formattedCount =
      count > 1000 ? (count / 1000).toFixed(1) + 'K' : count;
    return {
      label: 'Tool Calls',
      value: `${usage.hasValue() ? formattedCount : 'n.a.'} / 1M`,
      color: 'bg-yellow-400',
    };
  }
}
