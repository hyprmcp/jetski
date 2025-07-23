import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LogsComponent } from '../logs/logs.component';
import { filter, map } from 'rxjs';
import { AsyncPipe } from '@angular/common';

@Component({
  template: `
    @if (projectId | async; as projectId) {
      <app-logs-component [projectId]="projectId"></app-logs-component>
    }
  `,
  imports: [LogsComponent, AsyncPipe],
})
export class ProjectDashboardComponent {
  private readonly route = inject(ActivatedRoute);
  projectId = this.route.paramMap.pipe(
    map((params) => params.get('projectId') ?? null),
    filter((projectId) => projectId !== null),
  );
}
