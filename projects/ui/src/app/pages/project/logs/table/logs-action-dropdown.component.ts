import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideEllipsis, lucideEye } from '@ng-icons/lucide';
import { HlmButtonDirective } from '@spartan-ng/helm/button';
import { HlmIconDirective } from '@spartan-ng/helm/icon';
import { CellContext, injectFlexRenderContext } from '@tanstack/angular-table';
import { MCPServerLog } from '../../../../../api/mcp-server-log';

@Component({
  selector: 'app-logs-action-dropdown',
  imports: [HlmButtonDirective, NgIcon, HlmIconDirective],
  providers: [provideIcons({ lucideEllipsis, lucideEye })],
  template: `
    <button hlmBtn variant="ghost" class="h-8 w-8 p-0">
      <span class="sr-only">Open menu</span>
      <ng-icon hlm size="sm" name="lucideEye" />
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogsActionDropdownComponent {
  private readonly _context =
    injectFlexRenderContext<CellContext<MCPServerLog, unknown>>();

  mcpServerLog = input.required<MCPServerLog>();
}
