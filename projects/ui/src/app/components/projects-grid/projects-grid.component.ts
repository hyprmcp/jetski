import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  HlmCardContentDirective,
  HlmCardDirective,
} from '@spartan-ng/helm/card';
import { HlmH3Directive } from '@spartan-ng/helm/typography';
import { RelativeDatePipe } from '../../pipes/relative-date-pipe';
import { getProjectSummaries, ProjectSummary } from '../../../api/dashboard';
import { Organization } from '../../../api/organization';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-projects-grid',
  standalone: true,
  imports: [
    CommonModule,
    HlmCardDirective,
    HlmCardContentDirective,
    HlmH3Directive,
    RelativeDatePipe,
    RouterLink,
  ],
  template: `
    <div>
      <h3 hlmH3>Projects</h3>
      @if (projectSummaries.error(); as err) {
        <div class="text-red-600 text-sm">failed to load projects</div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          @for (project of projectSummaries.value(); track project.name) {
            <section hlmCard>
              <div hlmCardContent>
                <div class="flex items-start justify-between mb-4">
                  <div class="flex items-center space-x-3">
                    <div
                      class="w-10 h-10 bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg flex items-center justify-center text-white font-bold"
                    >
                      <a
                        [routerLink]="[
                          '/',
                          project.organization.name,
                          'project',
                          project.name,
                        ]"
                        >{{ project.name.at(0)?.toUpperCase() }}</a
                      >
                    </div>
                    <div>
                      <h4 class="font-semibold">
                        <a
                          [routerLink]="[
                            '/',
                            project.organization.name,
                            'project',
                            project.name,
                          ]"
                          >{{ project.name }}</a
                        >
                      </h4>
                      <p class="text-sm text-muted-foreground">
                        {{ getProjectUrl(project) }}
                      </p>
                    </div>
                  </div>

                  <div class="flex items-center space-x-2">
                    <button
                      class="p-1 hover:bg-muted rounded transition-colors"
                    >
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
                </div>

                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-2">
                      @if (project.latestDeploymentRevision) {
                        <div class="w-2 h-2 rounded-full bg-green-500"></div>
                        <span class="text-sm text-green-600"> deployed </span>

                        <span class="text-xs text-muted-foreground"
                          >#{{
                            project.latestDeploymentRevision.buildNumber
                          }}</span
                        >
                      } @else {
                        <div
                          class="w-2 h-2 rounded-full bg-muted-foreground"
                        ></div>
                        <span class="text-sm text-muted-foreground">
                          not deployed yet
                        </span>
                      }
                    </div>
                    <div class="flex items-center space-x-1">
                      @if (project.latestDeploymentRevisionEvent; as ev) {
                        @switch (ev.type) {
                          @case ('ok') {
                            <div
                              class="w-2 h-2 rounded-full bg-green-500"
                            ></div>
                            <span class="text-xs text-green-600">healthy</span>
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
                    </div>
                  </div>

                  @if (project.latestDeploymentRevision; as dr) {
                    <div
                      class="flex items-center space-x-1 text-xs text-muted-foreground"
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
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        ></path>
                      </svg>
                      <span
                        >Last deployed {{ dr.createdAt | relativeDate }}</span
                      >
                    </div>
                  }
                </div>
              </div>
            </section>
          } @empty {
            <div class="text-muted-foreground text-sm">no projects found</div>
          }
        </div>
      }
    </div>
  `,
})
export class ProjectsGridComponent {
  readonly organization = input<Organization>();
  readonly projectSummaries = getProjectSummaries(this.organization);

  getProjectUrl(project: ProjectSummary): string {
    return `${project.organization.name}.jetski.cloud/${project.name}/mcp`;
  }
}
