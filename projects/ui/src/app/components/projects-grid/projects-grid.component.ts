import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  HlmCardDirective,
  HlmCardContentDirective,
} from '@spartan-ng/helm/card';
import { HlmH3Directive } from '@spartan-ng/helm/typography';
import { httpResource } from '@angular/common/http';

interface ProjectItem {
  name: string;
  initial: string;
  url: string;
  deploymentStatus: string;
  buildNumber: string;
  lastDeployed: string;
  healthStatus: string;
}

@Component({
  selector: 'app-projects-grid',
  standalone: true,
  imports: [
    CommonModule,
    HlmCardDirective,
    HlmCardContentDirective,
    HlmH3Directive,
  ],
  template: `
    <div>
      <h3 hlmH3>Projects</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        @for (project of projects.value(); track project.name) {
          <section hlmCard>
            <div hlmCardContent>
              <div class="flex items-start justify-between mb-4">
                <div class="flex items-center space-x-3">
                  <div
                    class="w-10 h-10 bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg flex items-center justify-center text-white font-bold"
                  >
                    {{ project.initial }}
                  </div>
                  <div>
                    <h4 class="font-semibold">{{ project.name }}</h4>
                    <p class="text-sm text-muted-foreground">
                      {{ project.url }}
                    </p>
                  </div>
                </div>

                <div class="flex items-center space-x-2">
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
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      ></path>
                    </svg>
                  </button>
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
              </div>

              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-2">
                    <div class="w-2 h-2 rounded-full bg-green-500"></div>
                    <span class="text-sm text-green-600">{{
                      project.deploymentStatus
                    }}</span>
                    <span class="text-xs text-muted-foreground">{{
                      project.buildNumber
                    }}</span>
                  </div>
                  <div class="flex items-center space-x-1">
                    <div class="w-2 h-2 rounded-full bg-green-500"></div>
                    <span class="text-xs text-green-600">{{
                      project.healthStatus
                    }}</span>
                  </div>
                </div>

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
                  <span>Last deployed {{ project.lastDeployed }}</span>
                </div>
              </div>
            </div>
          </section>
        }
      </div>
    </div>
  `,
})
export class ProjectsGridComponent {
  projects = httpResource(() => `/api/v1/dashboard/projects`, {
    parse: (value) => value as ProjectItem[],
  });
  /*projects = [
    {
      name: 'v0-jetski',
      initial: 'N',
      url: 'jetski.jetski.cloud/v0-jetski/mcp',
      deploymentStatus: 'deployed',
      buildNumber: '#45',
      lastDeployed: '2m ago',
      healthStatus: 'healthy',
    },
    {
      name: 'v0-jetski-mcp',
      initial: 'N',
      url: 'jetski.jetski.cloud/v0-jetski-mcp/mcp',
      deploymentStatus: 'deployed',
      buildNumber: '#44',
      lastDeployed: '15m ago',
      healthStatus: 'healthy',
    },
    {
      name: 'v0-jetski/frontend',
      initial: 'N',
      url: 'jetski.jetski.cloud/v0-jetski-frontend/mcp',
      deploymentStatus: 'deployed',
      buildNumber: '#43',
      lastDeployed: '32m ago',
      healthStatus: 'healthy',
    },
  ];*/
}
