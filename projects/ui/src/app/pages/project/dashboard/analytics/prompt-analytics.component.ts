import { Component, input } from '@angular/core';
import { PromptAnalytics } from './prompty-analytics';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowRight } from '@ng-icons/lucide';
import { HlmCardImports } from '@spartan-ng/helm/card';

@Component({
  selector: 'app-prompt-analytics',
  template: `<div hlmCard>
    <div hlmCardHeader>
      <div hlmCardTitle>Prompt Analytics</div>
      <p class="text-sm text-muted-foreground">
        Latest tool calls including prompt telemetry
      </p>
    </div>
    <div hlmCardContent>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-border">
              <th class="text-left py-3 px-4 font-medium">Tool Name</th>
              <th class="text-left py-3 px-4 font-medium">Prompt</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (prompt of data().prompts; track prompt.id) {
              <tr class="border-b border-border">
                <td class="py-3 px-4 font-mono text-sm">
                  {{ prompt.toolName }}
                </td>
                <td class="py-3 px-4 whitespace-pre-wrap">
                  {{ prompt.prompt }}
                </td>
                <td>
                  <a
                    [routerLink]="['logs']"
                    [queryParams]="{ id: prompt.id }"
                    class="text-foreground border border-foreground rounded-sm size-8 flex items-center justify-center"
                  >
                    <ng-icon name="lucideArrowRight" />
                  </a>
                </td>
              </tr>
            } @empty {
              <tr>
                <td
                  colspan="3"
                  class="py-3 px-4 text-center text-sm text-muted-foreground"
                >
                  No data available
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  </div>`,
  imports: [RouterLink, NgIcon, HlmCardImports],
  providers: [provideIcons({ lucideArrowRight })],
})
export class PromptAnalyticsComponent {
  public readonly data = input.required<PromptAnalytics>();
}
