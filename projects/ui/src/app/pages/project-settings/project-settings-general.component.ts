import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCheckbox } from '@spartan-ng/helm/checkbox';
import { HlmLabel } from '@spartan-ng/helm/label';
import { toast } from 'ngx-sonner';
import { distinctUntilChanged, filter, map, switchMap, tap } from 'rxjs';
import { ProjectSummary } from '../../../api/dashboard';
import { ProjectService } from '../../../api/project';
import { ContextService } from '../../services/context.service';
import { NgIcon } from '@ng-icons/core';

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
      <h2
        class="text-xl font-semibold text-foreground border-b border-border pb-2"
      >
        Project Settings for {{ project()?.name }}
      </h2>

      <!-- TODO: add MCP Url Box -->

      <h3 class="text-lg font-semibold text-foreground mt-8 mb-6">
        Origin MCP Server
      </h3>

      <div class="space-y-2">
        <label for="proxy_url" hlmLabel>MCP Server URL</label>
        <p class="text-muted-foreground text-sm">
          Provide MCP server url for your remote MCP server.<br />
          It must support streamable http transport and be accessible from the
          internet.
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

      <h3 class="text-lg font-semibold text-foreground mt-12 mb-6">
        Telemetry
      </h3>

      <div class="flex items-start gap-3">
        <hlm-checkbox id="telemetry" [formControl]="form.controls.telemetry" />
        <div class="grid gap-2">
          <label hlmLabel for="telemetry">Enable Prompt Analytics</label>
          <p class="text-muted-foreground text-sm">
            Enabling prompt analytics will give you insights about the<br />
            prompt and context that triggered the MCP call.
          </p>
        </div>
      </div>

      <h3 class="text-lg font-semibold text-foreground mt-12 mb-6">
        Authentication
      </h3>

      <div class="text-sm my-6">
        <strong
          >Warning: Gateway Authentication is not compatible with upstream
          authentication</strong
        ><br />
        If your upstream MCP server already uses authentication, don't enable
        authentication here.
      </div>

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
              additional session context.<br />
            </p>
          </div>
        </div>

        <p class="text-sm">
          Some authorization settings are organization-scoped.
          <a routerLink="../../authorization" class="underline"
            >Go to organization settings.</a
          >
        </p>

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
export class ProjectSettingsGeneralComponent {
  private readonly contextService = inject(ContextService);
  private readonly projectService = inject(ProjectService);
  private readonly fb = inject(FormBuilder);

  protected readonly project = this.contextService.selectedProject;
  protected readonly loading = signal(false);
  protected readonly form = this.fb.nonNullable.group({
    authenticated: this.fb.nonNullable.control(false),
    telemetry: this.fb.nonNullable.control(false),
    proxyUrl: this.fb.nonNullable.control('', {
      validators: [
        (ctrl) =>
          ctrl.value && !URL.canParse(ctrl.value)
            ? { url: 'value is not a valid URL' }
            : null,
      ],
    }),
  });

  constructor() {
    toObservable(this.contextService.selectedProject)
      .pipe(
        map((p) => p?.id),
        distinctUntilChanged(),
        filter((id) => id !== undefined),
        tap(() => {
          this.loading.set(true);
          this.form.disable();
        }),
        switchMap((id) => this.projectService.getProjectSummary(id)),
        takeUntilDestroyed(),
      )
      .subscribe({
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
