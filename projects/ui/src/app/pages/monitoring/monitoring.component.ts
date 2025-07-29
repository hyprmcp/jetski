import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HlmButtonDirective } from '@spartan-ng/helm/button';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideActivity, lucideCircleCheck } from '@ng-icons/lucide';

@Component({
  selector: 'app-monitoring',
  standalone: true,
  imports: [CommonModule, HlmButtonDirective, NgIcon],
  viewProviders: [provideIcons({ lucideActivity, lucideCircleCheck })],
  template: `
    <div
      class="min-h-[40vh] flex items-start justify-center pt-16 bg-background"
    >
      <div
        class="bg-card rounded-xl shadow-lg p-8 max-w-sm w-full flex flex-col items-center"
      >
        <h2 class="text-2xl font-bold mb-2 text-foreground">Pro Feature</h2>
        <p class="text-muted-foreground mb-4 text-center text-base">
          Monitoring is only available in Pro
        </p>
        <button
          hlmBtn
          variant="outline"
          disabled
          class="opacity-60 cursor-not-allowed"
        >
          Upgrade
        </button>
      </div>
    </div>
  `,
})
export class MonitoringComponent {}
