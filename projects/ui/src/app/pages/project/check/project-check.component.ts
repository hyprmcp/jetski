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
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmSpinnerImports } from '@spartan-ng/helm/spinner';
import {
  catchError,
  delay,
  EMPTY,
  filter,
  map,
  of,
  retry,
  Subject,
  switchMap,
  takeUntil,
  throwError,
} from 'rxjs';
import { getProjectUrl } from '../../../../api/project';
import { ContextService } from '../../../services/context.service';

@Component({
  imports: [HlmCardImports, HlmSpinnerImports],
  template: `
    <div class="max-w-screen-md mx-auto">
      <div hlmCard class="mx-4 md:mx-0 md:mt-24">
        <div
          hlmCardContent
          class="flex items-center justify-center gap-4 md:m-12 text-center"
        >
          @if (success()) {
            <div class="flex flex-col items-center">
              <div class="text-muted-foreground">
                Your MCP Endpoint is ready
              </div>
              @if (projectUrl(); as projectUrl) {
                <a
                  [href]="'https://' + projectUrl"
                  class="text-2xl font-semibold hover:underline"
                  >{{ projectUrl }}</a
                >
              }
              <div class="text-muted-foreground mt-4 md:mt-12">
                Configure this URL in your MCP client using
                <strong>Streamable HTTP</strong> transport, or click the link
                above for detailed instructions.
              </div>
            </div>
          } @else if (errorMessage(); as msg) {
            <div class="text-muted-foreground">{{ msg }}</div>
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
            .get(`https://${url}`, {
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
                  return EMPTY;
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
        takeUntil(this.destroyed),
      )
      .subscribe({
        error: (error) =>
          this.errorMessage.set(error?.message || 'An error occurred'),
        complete: () => this.success.set(true),
      });
  }

  ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
  }
}
