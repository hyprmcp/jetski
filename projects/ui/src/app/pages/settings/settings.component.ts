import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideBell,
  lucidePalette,
  lucideShield,
  lucideUser,
} from '@ng-icons/lucide';
import { HlmButtonDirective } from '@spartan-ng/helm/button';
import { HlmCheckboxComponent } from '@spartan-ng/helm/checkbox';
import { toast } from 'ngx-sonner';
import { HlmLabelDirective } from '../../../../libs/ui/ui-label-helm/src';
import { ProjectSummary } from '../../../api/dashboard';
import { ProjectService } from '../../../api/project';
import { ContextService } from '../../services/context.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    HlmButtonDirective,
    NgIcon,
    HlmCheckboxComponent,
    HlmLabelDirective,
    ReactiveFormsModule,
  ],
  viewProviders: [
    provideIcons({ lucideUser, lucideBell, lucideShield, lucidePalette }),
  ],

  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-2xl font-semibold text-foreground">Project Settings</h1>
        <p class="text-muted-foreground">Manage your project preferences</p>
      </div>

      <!-- Settings Navigation -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div class="lg:col-span-1">
          <nav class="space-y-1">
            <span
              class="flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md bg-accent text-accent-foreground"
            >
              <ng-icon name="lucideUser" class="h-4 w-4"></ng-icon>
              <span>General</span>
            </span>
          </nav>
        </div>

        <div class="lg:col-span-3">
          <div class="bg-card border border-border rounded-lg p-6">
            <h2 class="text-lg font-semibold text-foreground mb-6">
              Authentication
            </h2>

            <form [formGroup]="form" (ngSubmit)="onSubmit()">
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
                      Users must authenticate via OAuth2 to access the MCP
                      server.<br />
                      This gives you better analytics and allows you to get an
                      additional session context.
                    </p>
                  </div>
                </div>

                <div class="space-y-2">
                  <label for="proxy_url" hlmLabel>Proxy URL</label>
                  <p class="text-muted-foreground text-sm">
                    If you host the MCP server somewhere other than jetski,
                    enter its URL here.
                  </p>
                  <input
                    id="proxy_url"
                    type="text"
                    [formControl]="form.controls.proxyUrl"
                    class="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>

                <!-- Actions -->
                <div
                  class="flex items-center justify-end pt-4 border-t border-border"
                >
                  <button hlmBtn type="submit" [disabled]="loading()">
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class SettingsComponent implements OnInit {
  private readonly contextService = inject(ContextService);
  private readonly projectService = inject(ProjectService);
  private readonly fb = inject(FormBuilder);

  protected readonly loading = signal(false);
  protected readonly form = this.fb.nonNullable.group({
    authenticated: this.fb.nonNullable.control(false),
    proxyUrl: this.fb.nonNullable.control(''),
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
    this.loading.set(true);
    this.form.disable();

    const projectId = this.contextService.selectedProject()?.id;
    if (projectId) {
      const request = {
        proxyUrl: this.form.value.proxyUrl,
        authenticated: this.form.value.authenticated ?? true,
      }
      this.projectService.putProjectSettings(projectId, request).subscribe({
        next: summary => {
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
      })
    }
  }

  private updateFormValues(summary: ProjectSummary): void {
    const rev = summary.latestDeploymentRevision;

    if (rev) {
      this.form.patchValue({
        authenticated: rev.authenticated ?? false,
        proxyUrl: rev.proxyUrl ?? '',
      });
    }
  }
}
