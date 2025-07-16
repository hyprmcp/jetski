import { HeaderComponent } from './components/header/header.component';
import { NavigationComponent } from './components/navigation/navigation.component';
import { Component, inject, OnInit } from '@angular/core';
import { Event, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, Observable } from 'rxjs';
import { OAuthService } from 'angular-oauth2-oidc';
import * as Sentry from '@sentry/angular';
import posthog from 'posthog-js';

@Component({
  selector: 'app-root',
  imports: [NavigationComponent, HeaderComponent, RouterOutlet],
  template: `
    <div class="min-h-screen bg-background text-foreground">
      <app-header></app-header>
      <app-navigation></app-navigation>
      <main class="pt-32 max-w-7xl mx-auto sm:px-6 lg:px-8">
        <router-outlet />
      </main>
    </div>
  `,
  styleUrl: './app.css',
})
export class App {
  protected title = 'jetski';

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
      posthog.setPersonProperties({ email });
      posthog.capture('$pageview');
    });
  }
}
