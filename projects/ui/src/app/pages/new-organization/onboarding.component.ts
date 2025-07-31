import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ContextService } from '../../services/context.service';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { HlmButtonDirective } from '@spartan-ng/helm/button';
import { OAuthService } from 'angular-oauth2-oidc';
import { map, startWith } from 'rxjs';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-onboarding',
  template: `
    <div class="flex justify-center items-center ">
      <div class="w-full max-w-2xl md:w-1/2 space-y-6">
        <div>
          <h1 class="text-2xl font-semibold text-foreground">
            Welcome to Jetski{{ usernamePostfix }}!
          </h1>
          <p class="text-muted-foreground">
            Please set a name for your organization to proceed.
          </p>
        </div>

        <div class="gap-6">
          <div class="space-y-6">
            <form [formGroup]="form" (ngSubmit)="onSubmit()">
              <div class="gap-4">
                <div>
                  <label
                    for="orgName"
                    class="block  font-medium text-foreground mb-2"
                    >Organization Name</label
                  >
                  <input
                    id="orgName"
                    type="text"
                    autocomplete="off"
                    [placeholder]="placeholder"
                    [formControl]="form.controls.name"
                    class="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent placeholder:text-muted-foreground placeholder:italic"
                  />
                  <p
                    class="mt-3 mb-3 text-sm font-normal text-gray-500 dark:text-gray-400"
                  >
                    Your MCP servers' URL will look like this:
                    {{ mcpUrl | async }}
                  </p>
                  @if (
                    form.controls.name.invalid && form.controls.name.touched
                  ) {
                    <div class="text-sm text-red-600 my-2">
                      Please enter a valid organization name.
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
                    Continue
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  imports: [ReactiveFormsModule, HlmButtonDirective, AsyncPipe],
})
export class OnboardingComponent {
  readonly contextService = inject(ContextService);
  readonly http = inject(HttpClient);
  readonly router = inject(Router);
  readonly oauthService = inject(OAuthService);
  readonly nameFromToken = this.oauthService.getIdentityClaims()['name'] as
    | string
    | undefined;
  readonly orgNameExample = `${this.nameFromToken?.replace(' ', '-').toLowerCase() ?? 'tom'}s-org`;
  readonly placeholder = `e.g. ${this.orgNameExample}`;
  readonly usernamePostfix = `${this.nameFromToken ? ', ' + this.nameFromToken : ''}`;
  readonly namePattern = /^[a-zA-Z0-9]+(([-_])[a-zA-Z0-9]+)*$/;
  readonly form = new FormGroup({
    name: new FormControl<string>('', [
      Validators.required,
      Validators.pattern(this.namePattern),
    ]),
  });
  loading = signal<boolean>(false);
  error = signal<string | undefined>(undefined);
  mcpUrl = this.form.controls.name.valueChanges.pipe(
    startWith(null),
    map((value) => {
      const subdomain = (value ?? '').toLowerCase() || this.orgNameExample;
      return `${subdomain}.jetski.cloud/your-mcp-server`;
    }),
  );

  onSubmit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(undefined);
    this.http
      .post(
        '/api/v1/organizations',
        { name: this.form.value.name },
        { responseType: 'text' },
      )
      .subscribe({
        next: () => {
          this.contextService.context.reload();
          this.router.navigateByUrl('/');
        },
        error: (err) => {
          console.log(err);
          this.form.markAsPristine();
          this.error.set(
            err?.error || 'Failed to create organization.',
          );
          this.loading.set(false);
        },
      });
  }
}
