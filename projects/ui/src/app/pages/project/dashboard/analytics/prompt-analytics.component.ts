import { Component, input } from '@angular/core';
import { PromptAnalytics } from './prompt-analytics';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideEye } from '@ng-icons/lucide';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmIcon } from '@spartan-ng/helm/icon';

@Component({
  selector: 'app-prompt-analytics',
  template: `<div hlmCard>
    <div hlmCardHeader>
      <div hlmCardTitle>Prompt Analytics</div>
      <p class="text-sm text-muted-foreground">
        See the prompts that triggered your tools to be called
      </p>
    </div>
    <div hlmCardContent>
      @if (data().prompts.length === 0) {
        <div class="text-center text-sm text-muted-foreground">
          No data available for the selected time period.
        </div>
      } @else {
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-border">
                <th class="text-left py-3 px-4 font-medium">Prompt</th>
                <th class="text-left py-3 px-4 font-medium">Tool Name</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (prompt of data().prompts; track prompt.id) {
                <tr class="border-b border-border">
                  <td class="py-3 px-4 whitespace-pre-wrap">
                    {{ prompt.prompt }}
                  </td>
                  <td class="py-3 px-4 font-mono text-sm">
                    {{ prompt.toolName }}
                  </td>
                  <td>
                    <a
                      hlmBtn
                      variant="ghost"
                      [routerLink]="['logs']"
                      [queryParams]="{ id: prompt.id }"
                      class="text-foreground h-8 w-8 p-0"
                    >
                      <span class="sr-only">Show logs</span>
                      <ng-icon hlm size="sm" name="lucideEye" />
                    </a>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <div class="text-center mt-4">
        <a
          hlmBtn
          variant="outline"
          [routerLink]="['prompts']"
          class="py-2 px-3 inline-flex items-center gap-2"
        >
          <ng-icon hlm size="sm" name="lucideEye" />
          Show all
        </a>
      </div>
    </div>
  </div>`,
  imports: [RouterLink, NgIcon, HlmCardImports, HlmButton, HlmIcon],
  providers: [provideIcons({ lucideEye })],
})
export class PromptAnalyticsComponent {
  public readonly data = input.required<PromptAnalytics>();
}
