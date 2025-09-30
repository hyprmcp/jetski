import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCircleCheck, lucideExternalLink } from '@ng-icons/lucide';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmIcon } from '@spartan-ng/helm/icon';
import { HlmSpinnerImports } from '@spartan-ng/helm/spinner';
import {
  catchError,
  delay,
  filter,
  map,
  of,
  retry,
  Subject,
  switchMap,
  take,
  takeUntil,
  throwError,
} from 'rxjs';
import { ContextService } from '../../../services/context.service';
import { getProjectUrl } from '../../../../api/project';

@Component({
  imports: [HlmCardImports, HlmSpinnerImports, NgIcon, HlmIcon],
  viewProviders: [provideIcons({ lucideCircleCheck, lucideExternalLink })],
  template: `
    <div class="max-w-screen-md mx-auto">
      <div hlmCard class="mx-4 md:mx-0 md:mt-24">
        <div
          hlmCardContent
          class="flex items-center justify-center gap-4 md:m-12"
        >
          @if (success()) {
            <div class="flex flex-col items-center text-center">
              <ng-icon
                hlm
                name="lucideCircleCheck"
                size="xl"
                class="text-green-500 mb-4"
              />
              <div class="">Your MCP Endpoint is ready</div>
              @if (projectUrl(); as projectUrl) {
                <div class="mt-8 mb-4 text-muted-foreground">
                  Open your server URL in the browser for detailed installation
                  instructions:
                </div>
                <a
                  [href]="projectUrl"
                  class="text-2xl font-semibold hover:underline inline-flex items-center gap-2"
                >
                  <ng-icon hlm name="lucideExternalLink" />
                  {{ projectUrl }}
                </a>
              }
              <div class="text-muted-foreground mt-4 md:mt-12">
                Or configure this URL in your MCP client using
                <strong>Streamable HTTP</strong> transport.
              </div>
            </div>
          } @else if (errorMessage()) {
            <div class="text-muted-foreground text-center">
              {{ errorMessage() }}
            </div>
          } @else {
            <hlm-spinner class="size-10" />
            <div>
              <h2 class="text-xl font-semibold">
                Your MCP Gateway is being provisioned, please stand by…
              </h2>
              @if (projectUrl(); as projectUrl) {
                <div class="text-muted-foreground">
                  It will be available at
                  <span class="font-medium">{{ projectUrl }}</span> shortly.
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class ProjectCheckComponent implements OnInit, OnDestroy {
  private readonly contextService = inject(ContextService);
  private readonly httpClient = inject(HttpClient);
  private readonly organization = this.contextService.selectedOrg;
  private readonly project = this.contextService.selectedProject;
  protected readonly projectUrl = computed(() => {
    const org = this.organization();
    const proj = this.project();
    if (org && proj) {
      return getProjectUrl(org, proj);
    }
    return undefined;
  });
  private readonly projectUrl$ = toObservable(this.projectUrl);
  private readonly destroyed = new Subject<void>();
  protected readonly success = signal(false);
  protected readonly errorMessage = signal<string | undefined>(undefined);

  ngOnInit(): void {
    this.projectUrl$
      .pipe(
        filter((url) => url !== undefined),
        // wait for 10 seconds to allow the ingress config to propagate
        // Hopefully, this makes on-demand TLS work as expected
        delay(10_000),
        switchMap((url) =>
          this.httpClient
            .get(url, {
              headers: { accept: 'text/html' },
              observe: 'response',
              responseType: 'text',
            })
            .pipe(
              map((resp) => resp.status),
              catchError((e) =>
                e instanceof HttpErrorResponse
                  ? of(e.status)
                  : throwError(() => e),
              ),
              switchMap((status) => {
                // We only care about 401 and 406 status! Here's why:
                // Status 0: Angular network failure --> Not OK
                // Status 200: Caddy Ingress default response --> Not OK (this should not happen because on-demand TLS would break before this)
                // Status 401: Gateway reached, authentication is enabled --> OK
                // Status 404: Gateway reached but the project is not yet in the gateway config --> Not OK
                // Status 406: Gateway reached, "unacceptable" means that MCP servers don't typically serve text/html --> OK
                // Any other status: Unexpected --> Not OK
                if (status === 401 || status === 406) {
                  return of(true);
                } else {
                  return throwError(
                    () => new Error('unexpected gateway status'),
                  );
                }
              }),
              // try every 5 seconds, stop after 5 minutes
              retry({ count: 60, delay: 5000 }),
            ),
        ),
        take(1),
        takeUntil(this.destroyed),
      )
      .subscribe({
        next: () => this.success.set(true),
        error: (error) =>
          this.errorMessage.set(error?.message || 'An error occurred'),
      });
  }

  ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
  }
}
