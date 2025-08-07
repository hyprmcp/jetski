import { Component, Input } from '@angular/core';
import {
  HlmCardContentDirective,
  HlmCardDirective,
  HlmCardHeaderDirective,
  HlmCardTitleDirective,
} from '@spartan-ng/helm/card';
import { RecentSessions } from './recent-sessions';

@Component({
  selector: 'app-recent-sessions',
  template: `
    <!-- Recent Sessions Table -->
    <div hlmCard>
      <div hlmCardHeader>
        <div hlmCardTitle>Recent Sessions</div>
        <p class="text-sm text-muted-foreground">
          Latest user sessions with performance metrics
        </p>
      </div>
      <div hlmCardContent>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-border">
                <th class="text-left py-3 px-4 font-medium">Session ID</th>
                <th class="text-left py-3 px-4 font-medium">User</th>
                <th class="text-left py-3 px-4 font-medium">Duration</th>
                <th class="text-left py-3 px-4 font-medium">Calls</th>
                <th class="text-left py-3 px-4 font-medium">Errors</th>
                <th class="text-left py-3 px-4 font-medium">Last Tool Call</th>
                <th class="text-left py-3 px-4 font-medium">Started</th>
              </tr>
            </thead>
            <tbody>
              @for (session of data.sessions; track session.sessionId) {
                <tr class="border-b border-border">
                  <td class="py-3 px-4 font-mono text-sm">
                    {{ session.sessionId }}
                  </td>
                  <td class="py-3 px-4">{{ session.user }}</td>
                  <td class="py-3 px-4">{{ session.duration }}</td>
                  <td class="py-3 px-4">{{ session.calls }}</td>
                  <td class="py-3 px-4">{{ session.errors }}</td>
                  <td class="py-3 px-4">
                    <span class="text-sm font-medium">{{
                      session.lastToolCall
                    }}</span>
                  </td>
                  <td class="py-3 px-4">{{ session.startedAgo }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  imports: [
    HlmCardDirective,
    HlmCardContentDirective,
    HlmCardHeaderDirective,
    HlmCardTitleDirective,
  ],
})
export class RecentSessionsComponent {
  @Input() data!: RecentSessions;
}
