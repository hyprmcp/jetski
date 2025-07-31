import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideEllipsis, lucideEye } from '@ng-icons/lucide';
import { HlmButtonDirective } from '@spartan-ng/helm/button';
import { HlmIconDirective } from '@spartan-ng/helm/icon';
import {
  BrnDialogContentDirective,
  BrnDialogImports,
} from '@spartan-ng/brain/dialog';
import { UserAccount } from '../../../api/user-account';
import { HlmDialogImports } from '../../../../libs/ui/ui-dialog-helm/src';

@Component({
  selector: 'app-organization-members-table-action',
  imports: [
    HlmButtonDirective,
    NgIcon,
    HlmIconDirective,
    BrnDialogContentDirective,
    HlmDialogImports,
    BrnDialogImports,
    HlmDialogImports,
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
        <div class="grid gap-4 py-4">TODO</div>
      </hlm-dialog-content>
    </hlm-dialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationMembersTableActionComponent {
  userAccount = input.required<UserAccount>();
}
