import { Component, inject } from '@angular/core';
import { LogsComponent } from '../logs/logs.component';
import { ContextService } from '../../../services/context.service';

@Component({
  template: `
    @if (contextService.selectedProject()) {
      <app-logs-component
        [projectId]="contextService.selectedProject()!.id"
      ></app-logs-component>
    }
  `,
  imports: [LogsComponent],
})
export class ProjectDashboardComponent {
  readonly contextService = inject(ContextService);
}
