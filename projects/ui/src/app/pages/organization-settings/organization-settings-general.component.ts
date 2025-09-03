import { Component, computed, inject, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { HlmButtonDirective } from '@spartan-ng/helm/button';
import { toast } from 'ngx-sonner';
import { Organization, OrganizationService } from '../../../api/organization';
import { validateDomain } from '../../../vaildators/name';
import { ContextService } from '../../services/context.service';
import { HlmLabelDirective } from '../../../../libs/ui/ui-label-helm/src';

@Component({
  imports: [ReactiveFormsModule, HlmButtonDirective, HlmLabelDirective],
  template: `
    <h2 class="text-lg font-semibold text-foreground mb-6">
      General Organization Settings
    </h2>

    <form class="space-y-6" [formGroup]="form" (ngSubmit)="submit()">
      <div class="space-y-2">
        <label for="name" hlmLabel>Name</label>
        <input
          id="name"
          type="text"
          formControlName="name"
          class="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:text-muted-foreground"
        />
        <p class="text-sm font-normal text-gray-500 dark:text-gray-400">
          Please contact support if you wish to change the organization name.
        </p>
      </div>

      <div class="space-y-2">
        <label for="name" hlmLabel>Custom Domain</label>
        <input
          id="name"
          type="text"
          formControlName="customDomain"
          class="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
        />
        @if (
          form.controls.customDomain.touched &&
          form.controls.customDomain.errors
        ) {
          <p class="text-sm text-red-500 dark:text-red-300">
            Please enter a valid domain name (e.g. mcp.mycompany.com)
          </p>
        }
        <p class="text-sm text-gray-500 dark:text-gray-400">
          If you don't like {{ defaultDomain() }}, you can choose to bring your
          own domain instead!
        </p>
        <p class="text-sm">
          Your MCP servers will be available at {{ effectiveMCPUrl() }}
        </p>
        @if (form.valid && form.value.customDomain) {
          <p class="text-sm font-semibold">
            Please remember to create a CNAME DNS record at your domain
            registrar that resolves
            {{ form.value.customDomain }} to {{ defaultDomain() }}!
          </p>
        }
      </div>

      <!-- Actions -->
      <div
        class="flex items-center justify-end border-t border-border pt-6 disabled:opacity-80"
      >
        <button hlmBtn type="submit" [disabled]="form.invalid || form.pristine">
          Save Changes
        </button>
      </div>
    </form>
  `,
})
export class OrganizationSettingsGeneralComponent implements OnInit {
  readonly contextService = inject(ContextService);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly organizationService = inject(OrganizationService);
  protected readonly form = this.fb.group({
    name: this.fb.control({ value: '', disabled: true }),
    customDomain: this.fb.control('', validateDomain),
  });

  private readonly formValueSignal = toSignal(this.form.valueChanges);
  protected readonly defaultDomain = computed(
    () => `${this.contextService.selectedOrg()?.name}.hyprmcp.cloud`,
  );
  private readonly effectiveDomain = computed(() => {
    const formValue = this.formValueSignal();
    const defaultDomain = this.defaultDomain();
    return (
      (this.form.controls.customDomain.valid && formValue?.customDomain) ||
      defaultDomain
    );
  });
  protected readonly effectiveMCPUrl = computed(
    () => `https://${this.effectiveDomain()}/\${projectName}/mcp`,
  );

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
        customDomain: this.form.value.customDomain ?? '',
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
      name: org.name,
      customDomain: org.settings.customDomain ?? '',
    });
  }
}
