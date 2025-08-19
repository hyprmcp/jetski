import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RelativeDatePipe } from '../../pipes/relative-date-pipe';
import { DeploymentRevisionSummary } from '../../../api/dashboard';

@Component({
  selector: 'app-deployments-revision',
  standalone: true,
  imports: [CommonModule, RelativeDatePipe],
  template: `
    @if (deploymentRevision(); as revision) {
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
            <div class="flex items-center space-x-2 text-sm font-medium">
              <span>{{ revision.project.name }}</span>
              <!--                  Deployment revision status -->
              <div class="flex items-center space-x-1">
                @if (
                  revision.project.latestDeploymentRevisionId &&
                  revision.project.latestDeploymentRevisionId !== revision.id
                ) {
                  <div class="w-2 h-2 rounded-full bg-yellow-500"></div>
                  <span class="text-xs text-yellow-600">superseded</span>
                } @else {
                  @if (revision.projectLatestDeploymentRevisionEvent; as ev) {
                    @switch (ev.type) {
                      @case ('ok') {
                        <div class="w-2 h-2 rounded-full bg-green-500"></div>
                        <span class="text-xs text-green-600">deployed</span>
                      }
                      @case ('progressing') {
                        <div class="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span class="text-xs text-blue-600">progressing</span>
                      }
                      @case ('error') {
                        <div class="w-2 h-2 rounded-full bg-red-500"></div>
                        <span class="text-xs text-red-600">error</span>
                      }
                    }
                  }
                }
              </div>
            </div>
            <div class="text-sm text-muted-foreground">
              by {{ revision.author.email }}
            </div>
          </div>
          <div
            class="flex items-center space-x-4 text-xs text-muted-foreground"
          >
            <!--                    Build number -->
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
              <span>#{{ revision.buildNumber }}</span>
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

            <!--                    Revision ID -->
            <button
              class="flex items-center space-x-1 hover:text-foreground transition-colors"
              (click)="copyRevisionId(revision.id)"
              title="Click to copy full ID: {{ revision.id }}"
            >
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                ></path>
              </svg>
              <span>{{ revision.id.substring(0, 8) }}</span>
            </button>
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
  `,
})
export class DeploymentRevisionComponent {
  readonly deploymentRevision = input.required<DeploymentRevisionSummary>();

  copyRevisionId(id: string) {
    navigator.clipboard.writeText(id);
  }
}
