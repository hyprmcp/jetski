import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HlmButton } from '@spartan-ng/helm/button';
import { firstValueFrom, startWith } from 'rxjs';
import { getProjectUrl, Project } from '../../../api/project';
import { validateResourceName } from '../../../vaildators/name';
import { ContextService } from '../../services/context.service';

@Component({
  template: ` <div class="flex justify-center items-center ">
    <div class="w-full max-w-2xl md:w-1/2 space-y-6">
      <div>
        <h1 class="text-2xl font-semibold text-foreground">New Project</h1>
      </div>

      <div class="gap-6">
        <div class="space-y-6">
          <form [formGroup]="form" (ngSubmit)="submit()">
            <div class="gap-4">
              <div>
                <label
                  for="projectName"
                  class="block font-medium text-foreground mb-2"
                  >Project Name</label
                >
                <input
                  id="projectName"
                  type="text"
                  formControlName="name"
                  placeholder="my-mcp-server"
                  class="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent placeholder:text-muted-foreground placeholder:italic"
                />
                <p
                  class="mt-1 mb-3 text-sm font-normal text-gray-500 dark:text-gray-400"
                >
                  Your MCP server's URL will look like this:
                  {{ mcpURL() }}
                </p>
                @if (
                  form.controls.name.invalid &&
                  (form.controls.name.touched ||
                    form.controls.name.errors?.['pattern'])
                ) {
                  <div class="text-sm text-red-600 my-2">
                    Please enter a valid name.<br />
                    Your project name must contain only lowercase letters,
                    numbers, and hyphens and must start with a letter or number.
                  </div>
                }
              </div>

              <div>
                <label
                  for="proxyUrl"
                  class="block font-medium text-foreground mb-2"
                  >MCP Server URL</label
                >
                <input
                  id="proxyUrl"
                  type="text"
                  formControlName="proxyUrl"
                  placeholder="https://mcp.my-company.com/mcp"
                  class="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent placeholder:text-muted-foreground placeholder:italic"
                />
                <p
                  class="mt-1 mb-3 text-sm font-normal text-gray-500 dark:text-gray-400"
                >
                  Enter the full URL of your upstream MCP server. We will
                  forward all MCP requests to this server.
                </p>
                @if (
                  form.controls.proxyUrl.invalid &&
                  (form.controls.proxyUrl.touched ||
                    form.controls.proxyUrl.errors?.['pattern'])
                ) {
                  <div class="text-sm text-red-600 my-2">
                    Please enter a valid URL.
                  </div>
                }
              </div>

              @if (error() && form.pristine) {
                <div class="text-sm text-red-600 my-2">{{ error() }}</div>
              }

              <!-- Actions -->
              <div class="flex items-center justify-end pt-4 ">
                <button
                  hlmBtn
                  type="submit"
                  [disabled]="form.invalid || loading()"
                >
                  Continue
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>`,
  imports: [ReactiveFormsModule, HlmButton],
})
export class NewProjectComponent {
  private readonly ctx = inject(ContextService);
  private readonly httpClient = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  protected readonly form = this.fb.group({
    name: this.fb.control('', [Validators.required, validateResourceName]),
    proxyUrl: this.fb.control('', [
      Validators.required,
      Validators.pattern(
        /^(http|https):\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(:\d+)?(\/.*)?$/,
      ),
    ]),
  });
  protected readonly error = signal<unknown>(undefined);
  protected readonly loading = signal(false);
  private readonly formSignal = toSignal(
    this.form.valueChanges.pipe(startWith(this.form.value)),
  );
  protected readonly mcpURL = computed(() =>
    getProjectUrl(
      this.ctx.selectedOrg()?.name || 'my-organization',
      this.formSignal()?.name || 'my-mcp-server',
    ),
  );

  protected async submit() {
    if (this.form.invalid) {
      return;
    }

    const org = this.ctx.selectedOrg();
    if (org) {
      try {
        const project = await firstValueFrom(
          this.httpClient.post<Project>('/api/v1/projects', {
            organizationId: org.id,
            name: this.form.value.name,
            proxyUrl: this.form.value.proxyUrl,
          }),
        );
        this.ctx.registerCreatedProject(project);
        await this.router.navigate(['/' + org.name, 'project', project.name]);
      } catch (e) {
        this.error.set(e);
      }
    }
  }
}
