import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HlmButtonDirective } from '@spartan-ng/helm/button';
import { ThemeService } from '../../services/theme.service';
import { RouterLink } from '@angular/router';
import { OAuthService } from 'angular-oauth2-oidc';
import {
  HlmMenuComponent,
  HlmMenuGroupComponent,
  HlmMenuItemDirective,
  HlmMenuLabelComponent,
  HlmMenuSeparatorComponent,
} from '@spartan-ng/helm/menu';
import { BrnMenuTriggerDirective } from '@spartan-ng/brain/menu';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSun, lucideMoon, lucideMonitor } from '@ng-icons/lucide';

@Component({
  selector: 'app-header',
  imports: [
    CommonModule,
    FormsModule,
    HlmButtonDirective,
    RouterLink,
    HlmMenuComponent,
    HlmMenuItemDirective,
    HlmMenuLabelComponent,
    HlmMenuSeparatorComponent,
    HlmMenuGroupComponent,
    BrnMenuTriggerDirective,
    NgIcon,
  ],
  viewProviders: [provideIcons({ lucideSun, lucideMoon, lucideMonitor })],
  template: `
    <header
      class="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border"
    >
      <div class="flex items-center justify-between px-6 py-3">
        <!-- Left side -->
        <div class="flex items-center space-x-4">
          <div class="flex items-center space-x-2">
            <div
              class="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded"
            ></div>
            <span class="font-semibold text-lg">jetski</span>
            <span
              class="text-xs bg-muted px-2 py-1 rounded text-muted-foreground"
              >Hobby</span
            >
          </div>
        </div>

        <!-- Right side -->
        <div class="flex items-center space-x-4">
          <!-- Feedback -->
          <button
            class="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Feedback
          </button>

          <!-- Theme switcher -->
          <button
            (click)="toggleTheme()"
            class="p-2 hover:bg-muted rounded-md transition-colors"
            [attr.aria-label]="getThemeLabel()"
          >
            <ng-icon
              [name]="getThemeIcon()"
              size="16"
              class="text-muted-foreground hover:text-foreground"
            />
          </button>

          <!-- User menu -->
          <div class="relative">
            <button
              class="flex items-center space-x-2 p-1 hover:bg-muted rounded-md transition-colors"
              [brnMenuTriggerFor]="userMenu"
            >
              <div
                class="w-8 h-8 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full"
              ></div>
            </button>

            <!-- User dropdown -->
            <ng-template #userMenu>
              <hlm-menu>
                <hlm-menu-label>pmig</hlm-menu-label>
                <p class="text-sm text-muted-foreground px-2 py-1">
                  pmig&#64;glasskube.com
                </p>
                <hlm-menu-separator />
                <hlm-menu-group>
                  <a routerLink="/dashboard" hlmMenuItem>Dashboard</a>
                  <a routerLink="/settings" hlmMenuItem>Account Settings</a>
                  <hlm-menu-separator />
                  <a href="#" hlmMenuItem>Home Page (TODO)</a>
                  <button (click)="logout()" hlmMenuItem class="w-full">
                    Log Out
                  </button>
                </hlm-menu-group>
                <hlm-menu-separator />
                <button hlmBtn hlmMenuItem class="w-full">
                  Upgrade to Pro
                </button>
              </hlm-menu>
            </ng-template>
          </div>
        </div>
      </div>
    </header>
  `,
})
export class HeaderComponent {
  public themeService = inject(ThemeService);
  private oauthService = inject(OAuthService);

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  getThemeIcon(): string {
    const theme = this.themeService.theme();
    switch (theme) {
      case 'light':
        return 'lucideSun';
      case 'dark':
        return 'lucideMoon';
      case 'system':
        return 'lucideMonitor';
      default:
        return 'lucideMonitor';
    }
  }

  getThemeLabel(): string {
    const theme = this.themeService.theme();
    switch (theme) {
      case 'light':
        return 'Switch to dark mode';
      case 'dark':
        return 'Switch to system mode';
      case 'system':
        return 'Switch to light mode';
      default:
        return 'Switch theme';
    }
  }

  logout() {
    this.oauthService.logOut();
    window.location.reload();
  }
}
