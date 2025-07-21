import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { LogsComponent } from '../logs/logs.component';
import { map } from 'rxjs';

@Component({
  template: ` <app-logs-component
    [projectId]="projectId()"
  ></app-logs-component>`,
  imports: [LogsComponent],
})
export class ProjectDashboardComponent {
  private readonly route = inject(ActivatedRoute);
  projectId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('projectId') ?? '')),
  );
}
