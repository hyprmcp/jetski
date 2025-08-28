import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSettings } from '@ng-icons/lucide';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, NgIcon, RouterOutlet, RouterLink, RouterLinkActive],
  viewProviders: [provideIcons({ lucideSettings })],

  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-2xl font-semibold text-foreground">Project Settings</h1>
        <p class="text-muted-foreground">Manage your project preferences</p>
      </div>

      <!-- Settings Navigation -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div class="lg:col-span-1">
          <nav class="space-y-1">
            <a
              routerLink="."
              routerLinkActive="bg-accent text-accent-foreground"
              [routerLinkActiveOptions]="{ exact: true }"
              class="flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md text-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <ng-icon name="lucideSettings" class="h-4 w-4"></ng-icon>
              <span>General</span>
            </a>
          </nav>
        </div>

        <div class="lg:col-span-3">
          <div class="bg-card border border-border rounded-lg p-6">
            <router-outlet />
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ProjectSettingsComponent {}
