import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BrnSelectImports } from '@spartan-ng/brain/select';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { toast } from 'ngx-sonner';
import { HlmLabel } from '@spartan-ng/helm/label';
import { Organization, OrganizationService } from '../../../api/organization';
import { ContextService } from '../../services/context.service';

@Component({
  selector: 'app-organization-settings-authorization',
  imports: [
    BrnSelectImports,
    HlmSelectImports,
    HlmLabel,
    ReactiveFormsModule,
    HlmButton,
  ],
  template: `
    <h2 class="text-lg font-semibold text-foreground mb-6">
      Authorization Settings For Your MCP Servers
    </h2>

    <form class="space-y-6" [formGroup]="form" (ngSubmit)="submit()">
      <div class="space-y-2">
        <label hlmLabel for="dcr-client-type">Dynamic OAuth2 Client Type</label>
        <brn-select
          id="dcr-client-type"
          class="block"
          placeholder="Select an option"
          formControlName="dcrClientType"
        >
          <hlm-select-trigger>
            <hlm-select-value />
          </hlm-select-trigger>
          <hlm-select-content class="w-56">
            <hlm-option value="public">Public</hlm-option>
            <hlm-option value="private">Private</hlm-option>
          </hlm-select-content>
        </brn-select>
        <p class="text-sm font-normal text-muted-foreground">
          We generally recommend using private clients. However, some MCP
          clients are only compatible with either public or private Oauth2
          clients.
        </p>
      </div>

      <!-- Actions -->
      <div
        class="flex items-center justify-end border-t border-border pt-6 disabled:opacity-80"
      >
        <button
          hlmBtn
          type="submit"
          [disabled]="form.invalid || form.untouched"
        >
          Save Changes
        </button>
      </div>
    </form>
  `,
})
export class OrganizationSettingsAuthorizationComponent implements OnInit {
  readonly contextService = inject(ContextService);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly organizationService = inject(OrganizationService);
  protected readonly form = this.fb.group({
    dcrClientType: this.fb.control<'public' | 'private'>(
      'private',
      Validators.required,
    ),
  });

  public ngOnInit(): void {
    const org = this.contextService.selectedOrg();
    if (org) {
      this.reset(org);
    }
  }

  protected submit() {
    if (this.form.invalid) {
      return;
    }

    const orgId = this.contextService.selectedOrg()?.id;
    if (!orgId) {
      return;
    }

    this.organizationService
      .updateSettings(orgId, {
        authorization: {
          dcrPublicClient: this.form.value.dcrClientType === 'public',
        },
      })
      .subscribe({
        next: (org) => {
          this.reset(org);
          toast.success('settings updated');
        },
        error: () => toast.error('error updating settings'),
      });
  }

  private reset(org: Organization) {
    this.form.reset({
      dcrClientType: org.settings.authorization.dcrPublicClient
        ? 'public'
        : 'private',
    });
  }
}
