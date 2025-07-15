import {Component, inject, OnInit} from '@angular/core';
import { Event, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, Observable } from 'rxjs';
import * as Sentry from '@sentry/angular';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private readonly router = inject(Router);
  private readonly navigationEnd$: Observable<NavigationEnd> =
    this.router.events.pipe(
      filter((event: Event) => event instanceof NavigationEnd),
    );

  public ngOnInit() {
    this.navigationEnd$.subscribe(() => {
      // TODO const email = this.auth.getClaims()?.email;
      // Sentry.setUser({email: "admin@example.com"});
      // posthog.setPersonProperties({email});
      // posthog.capture('$pageview');
    });
  }
}
