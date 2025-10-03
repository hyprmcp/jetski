import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCircleAlert } from '@ng-icons/lucide';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCheckbox } from '@spartan-ng/helm/checkbox';
import { HlmIcon } from '@spartan-ng/helm/icon';
import { HlmLabel } from '@spartan-ng/helm/label';
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

              <div class="flex items-start gap-3 my-6">
                <hlm-checkbox
                  id="telemetry"
                  [formControl]="form.controls.telemetry"
                />
                <div class="space-y-1">
                  <label hlmLabel for="telemetry"
                    >Enable Prompt Analytics</label
                  >
                  <p class="text-muted-foreground text-sm">
                    Enabling prompt analytics will give you insights about
                    the<br />
                    prompt and context that triggered the MCP call.
                  </p>

                  @if (form.value.telemetry) {
                    <div hlmAlert class="mt-2">
                      <ng-icon hlm hlmAlertIcon name="lucideCircleAlert" />
                      This feature may have a slight impact on token usage.
                    </div>
                  }
                </div>
              </div>

              @if (error()) {
                <div class="text-sm text-red-600 my-2">{{ error() }}</div>
              }

              @if (validationState(); as state) {
                @switch (state.state) {
                  @case ('error') {
                    <div class="text-sm text-red-600 my-2">
                      MCP Endpoint validation failed: {{ state.error }}
                    </div>
                  }
                  @case ('success') {
                    <div class="text-sm text-green-600 my-2">
                      MCP Endpoint validated!
                    </div>
                  }
                }
              }

              <!-- Actions -->
              <div class="flex items-center justify-end pt-4 ">
                @if (validationUrl() !== form.value.proxyUrl) {
                  <button hlmBtn type="submit" [disabled]="form.invalid">
                    Validate
                  </button>
                } @else if (validationState()?.state === 'error') {
                  <button
                    hlmBtn
                    type="submit"
                    [disabled]="form.invalid || loading()"
                  >
                    Continue anyways
                  </button>
                } @else if (validationState()?.state === 'success') {
                  <button
                    hlmBtn
                    type="submit"
                    [disabled]="form.invalid || loading()"
                  >
                    Continue
                  </button>
                } @else {
                  <button hlmBtn disabled>Validating&hellip;</button>
                }
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>`,
  imports: [
    ReactiveFormsModule,
    HlmButton,
    HlmCheckbox,
    HlmLabel,
    ...HlmAlertImports,
    NgIcon,
    HlmIcon,
  ],
  providers: [provideIcons({ lucideCircleAlert })],
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
    telemetry: this.fb.nonNullable.control(false),
  });
  protected readonly error = signal<string | undefined>(undefined);
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

  protected readonly validationUrl = signal<string | undefined>(undefined);
  protected readonly validationState = signal<McpValidationEvent | undefined>(
    undefined,
  );

  protected async submit() {
    if (this.form.invalid) {
      return;
    }

    if (this.validationUrl() !== this.form.value.proxyUrl) {
      this.verifyMcpEndpoint();
      return;
    }

    const org = this.ctx.selectedOrg();
    if (org) {
      try {
        const project = await firstValueFrom(
          this.httpClient.post<Project>('/api/v1/projects', {
            organizationId: org.id,
            name: this.form.value.name,
            proxyUrl: this.form.value.proxyUrl?.trim(),
            telemetry: this.form.value.telemetry ?? false,
          }),
        );
        this.ctx.registerCreatedProject(project);
        await this.router.navigate([
          '/' + org.name,
          'project',
          project.name,
          'check',
        ]);
      } catch (e) {
        if (e instanceof HttpErrorResponse) {
          this.error.set(e.error || e.message || 'an error occurred');
        } else if (e instanceof Error) {
          this.error.set(e.message || 'an error occurred');
        } else {
          this.error.set('an error occurred');
        }
      }
    }
  }

  protected verifyMcpEndpoint() {
    const url = this.form.value.proxyUrl!;
    this.validationUrl.set(url);
    this.validationState.set({ state: 'progress' });
    this.httpClient
      .get<
        Partial<ErrorData & ToolsData>
      >('/api/v1/verify-mcp-endpoint', { params: { url } })
      .subscribe({
        next: ({ error, tools }) =>
          this.validationState.set(
            tools
              ? { state: 'success', tools }
              : {
                  state: 'error',
                  error: error || 'invalid validation response',
                },
          ),
        error: (error) =>
          this.validationState.set({
            state: 'error',
            error: error.error || error.message || 'an error occurred',
          }),
      });
  }
}

interface ErrorData {
  error: string;
}
interface ToolsData {
  tools: string[];
}
interface McpValidationError extends ErrorData {
  state: 'error';
}
interface McpValidationInProgress {
  state: 'progress';
}
interface McpValidationSuccess extends ToolsData {
  state: 'success';
}
type McpValidationEvent =
  | McpValidationError
  | McpValidationInProgress
  | McpValidationSuccess;
