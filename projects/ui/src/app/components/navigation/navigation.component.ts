import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

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
          @for (item of navItems; track item.label) {
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
  navItems = [
    { label: 'Overview', href: '/dashboard', active: true },
    { label: 'Monitoring', href: '/monitoring', active: false },
  ];
}
