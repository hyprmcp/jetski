import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal, viewChild } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePlus, lucideTrash } from '@ng-icons/lucide';
import { BrnDialogImports } from '@spartan-ng/brain/dialog';
import { HlmButtonDirective } from '@spartan-ng/helm/button';
import { HlmIconDirective } from '@spartan-ng/helm/icon';
import { HlmH3Directive } from '@spartan-ng/helm/typography';
import { toast } from 'ngx-sonner';
import {
  HlmDialogComponent,
  HlmDialogImports,
} from '../../../../libs/ui/ui-dialog-helm/src';
import { getOrganizationMembers } from '../../../api/organization';
import { UserAccount } from '../../../api/user-account';
import { ContextService } from '../../services/context.service';

@Component({
  selector: 'app-organization-settings-members',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HlmH3Directive,
    HlmButtonDirective,
    NgIcon,
    HlmDialogImports,
    HlmIconDirective,
    BrnDialogImports,
    ReactiveFormsModule,
  ],
  viewProviders: [provideIcons({ lucidePlus, lucideTrash })],

  template: `
    <div>
      <div class="flex">
        <h3 hlmH3 class="grow">Organization Members</h3>
        <hlm-dialog #inviteDialogRef>
          <button
            hlmBtn
            brnDialogTrigger
            variant="outline"
            class="flex items-center gap-1"
          >
            <ng-icon name="lucidePlus" hlm size="sm"></ng-icon>
            Invite
          </button>
          <hlm-dialog-content *brnDialogContent="let ctx">
            <hlm-dialog-header>
              <h3 brnDialogTitle>Invite New Member</h3>
            </hlm-dialog-header>
            <div>
              <form [formGroup]="form" (ngSubmit)="onSubmit()">
                <div class="gap-4">
                  <div>
                    <label
                      for="email"
                      class="block  font-medium text-foreground mb-2"
                      >Email Address</label
                    >
                    <input
                      id="email"
                      type="email"
                      [formControl]="form.controls.email"
                      class="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent placeholder:text-muted-foreground placeholder:italic"
                    />
                    @if (
                      form.controls.email.invalid && form.controls.email.touched
                    ) {
                      <div class="text-sm text-red-600 my-2">
                        Please enter a valid email address.
                      </div>
                    }
                    @if (error() && form.pristine) {
                      <div class="text-sm text-red-600 my-2">{{ error() }}</div>
                    }
                  </div>

                  <!-- Actions -->
                  <div class="flex items-center justify-end pt-4 ">
                    <button
                      hlmBtn
                      type="submit"
                      [disabled]="form.invalid || loading()"
                    >
                      Send Invite
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </hlm-dialog-content>
        </hlm-dialog>
      </div>
      @if (members.error(); as err) {
        <div class="text-red-600 text-sm">failed to load members</div>
      } @else {
        <div class="">
          @for (member of members.value(); track member.id) {
            <div
              class="flex items-center space-x-3 p-3 hover:bg-muted rounded-lg transition-colors"
            >
              <div
                class="w-8 h-8 bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
              >
                {{ member.email.charAt(0) }}
              </div>

              <div class="text-sm font-medium grow">
                {{ member.email }}
              </div>

              <hlm-dialog #removeDialogRef>
                <button hlmBtn brnDialogTrigger variant="destructive" size="sm">
                  <ng-icon name="lucideTrash" size="16"></ng-icon>
                </button>
                <hlm-dialog-content *brnDialogContent="let ctx">
                  <hlm-dialog-header>
                    <h3 brnDialogTitle>Please Confirm</h3>
                  </hlm-dialog-header>
                  <div>
                    User <b>{{ member.email }}</b> will be removed from the
                    organization <b>{{ contextService.selectedOrg()?.name }}</b
                    >. Are you sure?
                  </div>
                  @if (error()) {
                    <div class="text-sm text-red-600 my-2">{{ error() }}</div>
                  }
                  <div class="flex justify-end space-x-2">
                    <button
                      hlmBtn
                      brnDialogTrigger
                      variant="outline"
                      size="sm"
                      (click)="closeRemoveDialog(removeDialogRef)"
                    >
                      Cancel
                    </button>
                    <button
                      hlmBtn
                      brnDialogTrigger
                      variant="destructive"
                      size="sm"
                      [disabled]="removeLoading()"
                      (click)="removeUser(member, removeDialogRef)"
                    >
                      Yes, Delete.
                    </button>
                  </div>
                </hlm-dialog-content>
              </hlm-dialog>
            </div>
          } @empty {
            <div class="text-muted-foreground text-sm">no members</div>
          }
        </div>
      }
    </div>
  `,
})
export class OrganizationSettingsMembersComponent {
  readonly http = inject(HttpClient);
  readonly contextService = inject(ContextService);
  readonly members = getOrganizationMembers(this.contextService.selectedOrg);
  loading = signal<boolean>(false);
  removeLoading = signal<boolean>(false);
  error = signal<string | undefined>(undefined);
  inviteDialogRef = viewChild<HlmDialogComponent>('inviteDialogRef');
  readonly form = new FormGroup({
    email: new FormControl<string>('', [Validators.required, Validators.email]),
  });

  onSubmit() {
    if (this.form.invalid || this.loading()) {
      return;
    }
    this.loading.set(true);
    this.error.set(undefined);
    const email = this.form.value.email;
    this.http
      .put(
        `/api/v1/organizations/${this.contextService.selectedOrg()!.id}/members`,
        { email },
        { responseType: 'text' },
      )
      .subscribe({
        next: () => {
          this.members.reload();
          this.loading.set(false);
          this.inviteDialogRef()?.close();
          this.form.reset();
          toast.success('User invited successfully', {
            description: `${email} is now part of the ${this.contextService.selectedOrg()?.name} organization`,
          });
        },
        error: (err) => {
          this.form.markAsPristine();
          this.error.set(err?.error || 'Failed to invite member.');
          this.loading.set(false);
        },
      });
  }

  closeRemoveDialog(ref: HlmDialogComponent) {
    this.error.set(undefined);
    ref.close();
  }

  removeUser(user: UserAccount, ref: HlmDialogComponent) {
    if (this.removeLoading()) {
      return;
    }

    this.removeLoading.set(true);
    this.error.set(undefined);
    this.http
      .delete(
        `/api/v1/organizations/${this.contextService.selectedOrg()!.id}/members/${user.id}`,
        { responseType: 'text' },
      )
      .subscribe({
        next: () => {
          this.members.reload();
          this.removeLoading.set(false);
          this.closeRemoveDialog(ref);
          toast.success('User removed successfully', {
            description: `${user.email} has been removed from the ${this.contextService.selectedOrg()?.name} organization`,
          });
        },
        error: (err) => {
          this.error.set(err?.error || 'Failed to remove member.');
          this.removeLoading.set(false);
        },
      });
  }
}
