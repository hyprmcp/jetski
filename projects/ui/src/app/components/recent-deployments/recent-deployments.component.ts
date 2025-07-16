import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  HlmCardDirective,
  HlmCardContentDirective,
} from '@spartan-ng/helm/card';
import { HlmH3Directive } from '@spartan-ng/helm/typography';

@Component({
  selector: 'app-recent-deployments',
  standalone: true,
  imports: [
    CommonModule,
    HlmCardDirective,
    HlmCardContentDirective,
    HlmH3Directive,
  ],
  template: `
    <h3 hlmH3>Recent Deployments</h3>
    <section hlmCard>
      <div hlmCardContent>
        <div class="space-y-4">
          @for (
            preview of recentPreviews;
            track preview.project + preview.timestamp
          ) {
            <div
              class="flex items-start space-x-3 p-3 hover:bg-muted rounded-lg transition-colors"
            >
              <div
                class="w-12 h-12 bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
              >
                {{ preview.author.charAt(0) }}
              </div>

              <div class="flex-1 min-w-0">
                <div class="mb-1">
                  <div class="text-sm font-medium">{{ preview.project }}</div>
                  <div class="text-sm text-muted-foreground">
                    by {{ preview.author }}
                  </div>
                </div>

                <div
                  class="flex items-center space-x-4 text-xs text-muted-foreground"
                >
                  <div class="flex items-center space-x-1">
                    <div
                      class="w-2 h-2 rounded-full"
                      [class]="
                        preview.status === 'deployed'
                          ? 'bg-green-500'
                          : preview.status === 'superseded'
                            ? 'bg-yellow-500'
                            : preview.status === 'error'
                              ? 'bg-red-500'
                              : 'bg-gray-400'
                      "
                    ></div>
                    <span
                      [class]="
                        preview.status === 'deployed'
                          ? 'text-green-600'
                          : preview.status === 'superseded'
                            ? 'text-yellow-600'
                            : preview.status === 'error'
                              ? 'text-red-600'
                              : 'text-gray-600'
                      "
                    >
                      {{ preview.status }}
                    </span>
                  </div>

                  <div class="flex items-center space-x-1">
                    <svg
                      class="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                      ></path>
                    </svg>
                    <span>{{ preview.buildNumber }}</span>
                  </div>

                  <div class="flex items-center space-x-1">
                    <svg
                      class="w-3 h-3"
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
                    <span>{{ preview.timestamp }}</span>
                  </div>
                </div>
              </div>

              <button class="p-1 hover:bg-muted rounded transition-colors">
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                  ></path>
                </svg>
              </button>
            </div>
          }
        </div>
      </div>
    </section>
  `,
})
export class RecentDeploymentsComponent {
  recentPreviews = [
    {
      project: 'v0-jetski',
      author: 'John Smith',
      status: 'deployed',
      timestamp: '2m ago',
      buildNumber: '#45',
    },
    {
      project: 'v0-jetski-mcp',
      author: 'Sarah Johnson',
      status: 'deployed',
      timestamp: '15m ago',
      buildNumber: '#44',
    },
    {
      project: 'v0-jetski/frontend',
      author: 'Mike Chen',
      status: 'deployed',
      timestamp: '32m ago',
      buildNumber: '#43',
    },
    {
      project: 'v0-jetski',
      author: 'Emma Wilson',
      status: 'error',
      timestamp: '1 hour ago',
      buildNumber: '#42',
    },
    {
      project: 'v0-jetski-mcp',
      author: 'David Rodriguez',
      status: 'superseded',
      timestamp: '2h ago',
      buildNumber: '#41',
    },
    {
      project: 'v0-jetski/frontend',
      author: 'Lisa Park',
      status: 'superseded',
      timestamp: '3h ago',
      buildNumber: '#40',
    },
  ];
}
