import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  HlmCardContentDirective,
  HlmCardDirective,
} from '@spartan-ng/helm/card';
import { HlmH3Directive } from '@spartan-ng/helm/typography';
import { RelativeDatePipe } from '../../pipes/relative-date-pipe';
import { getRecentDeployments } from '../../../api/dashboard';
import { Organization } from '../../../api/organization';

@Component({
  selector: 'app-recent-deployments',
  standalone: true,
  imports: [
    CommonModule,
    HlmCardDirective,
    HlmCardContentDirective,
    HlmH3Directive,
    RelativeDatePipe,
  ],
  template: `
    <h3 hlmH3>Recent Deployments</h3>
    <section hlmCard>
      <div hlmCardContent>
        <div class="space-y-4">
          @for (revision of deploymentRevisions.value(); track revision.id) {
            <div
              class="flex items-start space-x-3 p-3 hover:bg-muted rounded-lg transition-colors"
            >
              <div
                class="w-12 h-12 bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
              >
                {{ revision.author.email.charAt(0) }}
              </div>

              <div class="flex-1 min-w-0">
                <div class="mb-1">
                  <div class="text-sm font-medium">
                    {{ revision.project.name }}
                  </div>
                  <div class="text-sm text-muted-foreground">
                    by {{ revision.author.email }}
                  </div>
                </div>

                <div
                  class="flex items-center space-x-4 text-xs text-muted-foreground"
                >
                  <div class="flex items-center space-x-1">
                    @if (
                      revision.project.latestDeploymentRevisionId &&
                      revision.project.latestDeploymentRevisionId !==
                        revision.id
                    ) {
                      <div class="w-2 h-2 rounded-full bg-yellow-500"></div>
                      <span class="text-yellow-600">superseded</span>
                    } @else {
                      @if (
                        revision.projectLatestDeploymentRevisionEvent;
                        as ev
                      ) {
                        @switch (ev.type) {
                          @case ('ok') {
                            <div
                              class="w-2 h-2 rounded-full bg-green-500"
                            ></div>
                            <span class="text-xs text-green-600">deployed</span>
                          }
                          @case ('progressing') {
                            <div class="w-2 h-2 rounded-full bg-blue-500"></div>
                            <span class="text-xs text-blue-600"
                              >progressing</span
                            >
                          }
                          @case ('error') {
                            <div class="w-2 h-2 rounded-full bg-red-500"></div>
                            <span class="text-xs text-red-600">error</span>
                          }
                        }
                      }
                    }
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
                    <span>{{ revision.buildNumber }}</span>
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
                    <span>{{ revision.createdAt | relativeDate }}</span>
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
  readonly organization = input.required<Organization>();
  readonly deploymentRevisions = getRecentDeployments(this.organization().id);
}
