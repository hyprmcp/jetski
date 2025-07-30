import { Component, computed, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, NavigationEnd } from '@angular/router';
import { ContextService } from '../../services/context.service';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <nav
      class="fixed top-16 left-0 right-0 z-40 bg-background border-b border-border"
    >
      <div class="flex items-center px-6 py-3">
        <div class="flex space-x-8">
          @for (item of navItems(); track item.label) {
            <a
              [routerLink]="item.href"
              class="text-sm font-medium transition-colors"
              [class.text-foreground]="item.active"
              [class.text-muted-foreground]="!item.active"
              [class.hover:text-foreground]="!item.active"
            >
              {{ item.label }}
            </a>
          }
        </div>
      </div>
    </nav>
  `,
})
export class NavigationComponent {
  readonly contextService = inject(ContextService);
  readonly router = inject(Router);

  readonly currentUrl = signal<string>(this.router.url);

  constructor() {
    // Subscribe to router events and update the signal
    effect(() => {
      const sub = this.router.events.subscribe((event) => {
        if (event instanceof NavigationEnd) {
          this.currentUrl.set(event.urlAfterRedirects);
        }
      });
      return () => sub.unsubscribe();
    });
  }

  navItems = computed(() => {
    const organization = this.contextService.selectedOrg();
    if (!organization) {
      return [];
    }
    const project = this.contextService.selectedProject();
    const url = this.currentUrl();
    const lastPart = url.split('/').filter(Boolean).pop();
    if (project) {
      return [
        {
          label: 'Overview',
          href: ['/', organization.name, 'project', project.name],
          active: lastPart === project.name,
        },
        {
          label: 'Logs',
          href: ['/', organization.name, 'project', project.name, 'logs'],
          active: lastPart === 'logs',
        },
        {
          label: 'Monitoring',
          href: ['/', organization.name, 'project', project.name, 'monitoring'],
          active: lastPart === 'monitoring',
        },
      ];
    } else {
      return [
        {
          label: 'Overview',
          href: ['/', organization.name],
          active: lastPart === organization.name,
        },
        {
          label: 'Monitoring',
          href: ['/', organization.name, 'monitoring'],
          active: lastPart === 'monitoring',
        },
      ];
    }
  });
}
