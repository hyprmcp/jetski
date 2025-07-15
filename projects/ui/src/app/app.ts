import { Component, inject, OnInit } from '@angular/core';
import { Event, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, Observable } from 'rxjs';
import { OAuthService } from 'angular-oauth2-oidc';
import * as Sentry from '@sentry/angular';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private oauthService = inject(OAuthService);
  private readonly router = inject(Router);
  private readonly navigationEnd$: Observable<NavigationEnd> =
    this.router.events.pipe(
      filter((event: Event) => event instanceof NavigationEnd),
    );

  public ngOnInit() {
    this.navigationEnd$.subscribe(() => {
      const email = this.oauthService.getIdentityClaims()?.['email'];
      if (email) {
        Sentry.setUser({ email });
      }
      // TODO
      // posthog.setPersonProperties({email});
      // posthog.capture('$pageview');
    });
  }
}
