import { DatePipe, JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideEllipsis, lucideEye } from '@ng-icons/lucide';
import { BrnDialogContent, BrnDialogImports } from '@spartan-ng/brain/dialog';
import { HlmButtonDirective } from '@spartan-ng/helm/button';
import { HlmIcon } from '@spartan-ng/helm/icon';
import { HlmDialogImports } from '../../../../../../libs/ui/ui-dialog-helm/src';
import { MCPServerLog } from '../../../../../api/mcp-server-log';

@Component({
  selector: 'app-logs-actions',
  imports: [
    HlmButtonDirective,
    NgIcon,
    HlmIcon,
    BrnDialogContent,
    HlmDialogImports,
    BrnDialogImports,
    JsonPipe,
    DatePipe,
  ],
  providers: [provideIcons({ lucideEllipsis, lucideEye })],
  template: `
    <hlm-dialog>
      <button hlmBtn brnDialogTrigger variant="ghost" class="h-8 w-8 p-0">
        <span class="sr-only">Open menu</span>
        <ng-icon hlm size="sm" name="lucideEye" />
      </button>
      <hlm-dialog-content *brnDialogContent="let ctx">
        <hlm-dialog-header>
          <h3 brnDialogTitle>Tool Call Details</h3>
        </hlm-dialog-header>
        <div class="grid gap-4 py-4">
          <div>
            <strong>Timestamp: </strong>
            <span>{{ mcpServerLog().startedAt | date: 'full' }}</span>
          </div>
          <div>
            <strong>Duration: </strong>
            <span>{{ mcpServerLog().duration / 1000 / 1000 }} ms</span>
          </div>
          @if (mcpServerLog().userAgent) {
            <div>
              <strong>User Agent: </strong>
              <span>{{ mcpServerLog().userAgent }}</span>
            </div>
          }
          @if (
            mcpServerLog().httpStatusCode !== undefined &&
            mcpServerLog().httpStatusCode !== null
          ) {
            <div>
              <strong>HTTP Status: </strong>
              <span>{{ mcpServerLog().httpStatusCode }}</span>
            </div>
          }
          @if (mcpServerLog().mcpRequest) {
            <div>
              <strong>Method: </strong>
              <span>{{ mcpServerLog().mcpRequest?.method }}</span>
            </div>
            <div>
              <strong>Parameters: </strong>
              @if (mcpServerLog().mcpRequest?.params) {
                <pre>{{ mcpServerLog().mcpRequest?.params | json }}</pre>
              } @else {
                <span>–</span>
              }
            </div>
          }
          @if (mcpServerLog().mcpResponse) {
            <div>
              <strong>Response: </strong>
              <pre>{{ mcpServerLog().mcpResponse | json }}</pre>
            </div>
          }
        </div>
      </hlm-dialog-content>
    </hlm-dialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogsActionsComponent {
  mcpServerLog = input.required<MCPServerLog>();
}
