import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideEye } from '@ng-icons/lucide';
import {
  HlmCard,
  HlmCardContent,
  HlmCardHeader,
  HlmCardTitle,
} from '@spartan-ng/helm/card';
import { formatDistance } from 'date-fns';
import { RelativeDatePipe } from '../../../../pipes/relative-date-pipe';
import { RecentSessions } from './recent-sessions';
import { HlmIcon } from '@spartan-ng/helm/icon';
import { HlmButton } from '@spartan-ng/helm/button';

@Component({
  selector: 'app-recent-sessions',
  template: `
    <!-- Recent Sessions Table -->
    <div hlmCard>
      <div hlmCardHeader>
        <div hlmCardTitle>Recent Sessions</div>
        <p class="text-sm text-muted-foreground">
          Recent user activity with session details and usage statistics. Click
          the arrow to view individual tool calls for each session
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
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (session of data.sessions; track session.sessionId) {
                <tr class="border-b border-border">
                  <td class="py-3 px-4 font-mono text-sm">
                    {{ session.sessionId }}
                  </td>
                  <td class="py-3 px-4">{{ session.user }}</td>
                  <td class="py-3 px-4">
                    {{ formatDateDistance(session.endedAt, session.startedAt) }}
                  </td>
                  <td class="py-3 px-4">{{ session.calls }}</td>
                  <td class="py-3 px-4">{{ session.errors }}</td>
                  <td class="py-3 px-4">
                    <span class="text-sm font-medium">{{
                      session.lastToolCall
                    }}</span>
                  </td>
                  <td class="py-3 px-4">
                    {{ session.startedAt | relativeDate }}
                  </td>
                  <td>
                    <a
                      hlmBtn
                      variant="ghost"
                      [routerLink]="['logs']"
                      [queryParams]="{ mcpSessionId: session.sessionId }"
                      class="text-foreground h-8 w-8 p-0"
                    >
                      <span class="sr-only">Show logs</span>
                      <ng-icon hlm size="sm" name="lucideEye" />
                    </a>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  imports: [
    HlmCard,
    HlmCardContent,
    HlmCardHeader,
    HlmCardTitle,
    RelativeDatePipe,
    RouterLink,
    NgIcon,
    HlmButton,
    HlmIcon,
  ],
  providers: [provideIcons({ lucideEye })],
})
export class RecentSessionsComponent {
  @Input() data!: RecentSessions;

  protected formatDateDistance(start: string, end: string): string {
    return formatDistance(end, start);
  }
}
