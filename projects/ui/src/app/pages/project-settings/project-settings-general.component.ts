import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCheckbox } from '@spartan-ng/helm/checkbox';
import { toast } from 'ngx-sonner';
import { HlmLabel } from '@spartan-ng/helm/label';
import { ProjectSummary } from '../../../api/dashboard';
import { ProjectService } from '../../../api/project';
import { ContextService } from '../../services/context.service';

@Component({
  imports: [
    CommonModule,
    HlmButton,
    HlmCheckbox,
    HlmLabel,
    ReactiveFormsModule,
    RouterLink,
  ],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <h2 class="text-lg font-semibold text-foreground mb-6">Authorization</h2>

      <div class="space-y-6">
        <div class="flex items-start gap-3">
          <hlm-checkbox
            id="authentication"
            [formControl]="form.controls.authenticated"
          />
          <div class="grid gap-2">
            <label hlmLabel for="authentication"
              >Require user authentication</label
            >
            <p class="text-muted-foreground text-sm">
              Users must authenticate via OAuth2 to access the MCP server.<br />
              This gives you better analytics and allows you to get an
              additional session context.
            </p>
          </div>
        </div>

        <p class="text-sm">
          Some authorization settings are organization-scoped.
          <a routerLink="../../../settings/authorization" class="underline"
            >Go to authorization settings for your organization.</a
          >
        </p>

        <h2 class="text-lg font-semibold text-foreground mb-6">Telemetry</h2>

        <div class="flex items-start gap-3">
          <hlm-checkbox
            id="telemetry"
            [formControl]="form.controls.telemetry"
          />
          <div class="grid gap-2">
            <label hlmLabel for="telemetry">Enable Prompt Analytics</label>
            <p class="text-muted-foreground text-sm">
              Enabling prompt analytics will give you insights about the<br />
              prompt and context that triggered the MCP call.
            </p>
          </div>
        </div>

        <h2 class="text-lg font-semibold text-foreground mb-6">Upstream MCP</h2>

        <div class="space-y-2">
          <label for="proxy_url" hlmLabel>MCP URL</label>
          <p class="text-muted-foreground text-sm">
            Your MCP server needs to support streamable HTTP.
          </p>
          <div>
            <input
              id="proxy_url"
              type="text"
              placeholder="https://your-custom-domain.com/mcp/"
              [formControl]="form.controls.proxyUrl"
              class="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent placeholder:text-muted-foreground"
            />
            @if (
              form.controls.proxyUrl.touched && form.controls.proxyUrl.errors
            ) {
              <div class="text-xs text-red-500">Not a valid URL</div>
            }
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end pt-4 border-t border-border">
          <button hlmBtn type="submit" [disabled]="loading()">
            Save Changes
          </button>
        </div>
      </div>
    </form>
  `,
})
export class ProjectSettingsGeneralComponent implements OnInit {
  private readonly contextService = inject(ContextService);
  private readonly projectService = inject(ProjectService);
  private readonly fb = inject(FormBuilder);

  protected readonly loading = signal(false);
  protected readonly form = this.fb.nonNullable.group({
    authenticated: this.fb.nonNullable.control(false),
    telemetry: this.fb.nonNullable.control(false),
    proxyUrl: this.fb.nonNullable.control('', {
      validators: [
        (ctrl) =>
          ctrl.value && URL.parse(ctrl.value) === null
            ? { url: 'value is not a valid URL' }
            : null,
      ],
    }),
  });

  public ngOnInit(): void {
    const projectId = this.contextService.selectedProject()?.id;
    if (projectId) {
      this.loading.set(true);
      this.form.disable();

      this.projectService.getProjectSummary(projectId).subscribe({
        next: (summary) => {
          this.updateFormValues(summary);
          this.loading.set(false);
          this.form.enable();
        },
        error: () => {
          this.loading.set(false);
          this.form.enable();
          toast.error('An error occurred while loading project settings');
        },
      });
    }
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      return;
    }

    this.loading.set(true);
    this.form.disable();

    const projectId = this.contextService.selectedProject()?.id;
    if (projectId) {
      const request = {
        proxyUrl: this.form.value.proxyUrl,
        authenticated: this.form.value.authenticated ?? true,
        telemetry: this.form.value.telemetry ?? false,
      };
      this.projectService.putProjectSettings(projectId, request).subscribe({
        next: (summary) => {
          this.updateFormValues(summary);
          this.loading.set(false);
          this.form.enable();
          toast.success('settings saved successfully');
        },
        error: () => {
          this.loading.set(false);
          this.form.enable();
          toast.error('An error occurred while saving settings');
        },
      });
    }
  }

  private updateFormValues(summary: ProjectSummary): void {
    const rev = summary.latestDeploymentRevision;

    if (rev) {
      this.form.patchValue({
        authenticated: rev.authenticated ?? false,
        telemetry: rev.telemetry ?? false,
        proxyUrl: rev.proxyUrl ?? '',
      });
    }
  }
}
