import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ContextService } from '../../services/context.service';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    @if (navItems().length > 0) {
      <nav
        class="fixed top-16 left-0 right-0 z-40 bg-background border-b border-border"
      >
        <div class="flex items-center px-6 py-3">
          <div class="flex space-x-8">
            @for (
              item of navItems();
              track item.label;
              let isOverview = $first
            ) {
              <a
                [routerLink]="item.href"
                routerLinkActive="text-foreground"
                #rla="routerLinkActive"
                [routerLinkActiveOptions]="{ exact: isOverview }"
                [class.text-muted-foreground]="!rla.isActive"
                class="text-sm font-medium transition-colors hover:text-foreground"
              >
                {{ item.label }}
              </a>
            }
          </div>
        </div>
      </nav>
    }
  `,
})
export class NavigationComponent {
  readonly contextService = inject(ContextService);

  navItems = computed(() => {
    const organization = this.contextService.selectedOrg();
    if (!organization) {
      return [];
    }
    const orgBase = ['/', organization.name];
    const project = this.contextService.selectedProject();
    if (project) {
      const projectBase = [...orgBase, 'project', project.name];
      return [
        {
          label: 'Overview',
          href: [...projectBase],
        },
        {
          label: 'Logs',
          href: [...projectBase, 'logs'],
        },
        {
          label: 'Prompts',
          href: [...projectBase, 'prompts'],
        },
        {
          label: 'Deployments',
          href: [
            '/',
            organization.name,
            'project',
            project.name,
            'deployments',
          ],
          active: false,
        },
        {
          label: 'Monitoring',
          href: [...projectBase, 'monitoring'],
        },
        {
          label: 'Settings',
          href: [...orgBase, 'settings', 'project', project.name],
        },
      ];
    } else {
      return [
        {
          label: 'Overview',
          href: [...orgBase],
        },
        {
          label: 'Monitoring',
          href: [...orgBase, 'monitoring'],
        },
        {
          label: 'Settings',
          href: [...orgBase, 'settings'],
        },
      ];
    }
  });
}
