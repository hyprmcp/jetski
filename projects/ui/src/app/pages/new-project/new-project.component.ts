import { Component, computed, inject, signal } from '@angular/core';
import { ContextService } from '../../services/context.service';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom, startWith } from 'rxjs';
import { Router } from '@angular/router';
import { Project } from '../../../api/project';
import { toSignal } from '@angular/core/rxjs-interop';
import { validateResourceName } from '../../../vaildators/name';

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
                  for="orgName"
                  class="block font-medium text-foreground mb-2"
                  >Project Name</label
                >
                <input
                  id="orgName"
                  type="text"
                  formControlName="name"
                  placeholder="my-mcp-server"
                  class="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent placeholder:text-muted-foreground placeholder:italic"
                />
                <p
                  class="mt-3 mb-3 text-sm font-normal text-gray-500 dark:text-gray-400"
                >
                  Your MCP server's URL will look like this:
                  {{ mcpURL() }}
                </p>
                @if (form.controls.name.invalid && form.controls.name.touched) {
                  <div class="text-sm text-red-600 my-2">
                    Please enter a valid name.
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
                  variant="outline"
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
  imports: [ReactiveFormsModule],
})
export class NewProjectComponent {
  private readonly ctx = inject(ContextService);
  private readonly httpClient = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  protected readonly form = this.fb.group({
    name: this.fb.control('', [Validators.required, validateResourceName]),
  });
  protected readonly error = signal<unknown>(undefined);
  protected readonly loading = signal(false);
  private readonly formSignal = toSignal(
    this.form.valueChanges.pipe(startWith(this.form.value)),
  );
  protected readonly mcpURL = computed(() => {
    const orgName = this.ctx.selectedOrg()?.name;
    const name = this.formSignal()?.name || 'my-mcp-server';
    return `https://${orgName}.hyprmcp.com/${name}/mcp`;
  });

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
          }),
        );
        this.ctx.registerCreatedProject(project);
        await this.router.navigate([
          '/' + org.name,
          'project',
          project.name,
          'settings',
        ]);
      } catch (e) {
        this.error.set(e);
      }
    }
  }
}
