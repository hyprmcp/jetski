import { Component, inject } from '@angular/core';
import { ContextService } from '../../../services/context.service';

@Component({
  template: `
    @if (contextService.selectedProject(); as proj) {
      <div class="flex flex-col justify-between gap-4 sm:flex-row">
        <div class="flex items-center justify-between grow">
          <div>
            <h1 class="text-2xl font-semibold text-foreground">
              {{ proj.name }}
            </h1>
            <p class="text-muted-foreground">Project Overview</p>
          </div>
        </div>
      </div>
    }
  `,
  imports: [],
})
export class ProjectDashboardComponent {
  readonly contextService = inject(ContextService);
}
