import { BrnMenuTrigger } from '@spartan-ng/brain/menu';
import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChevronDown,
  lucideChevronsUpDown,
  lucideMonitor,
  lucideMoon,
  lucidePlus,
  lucideSun,
} from '@ng-icons/lucide';

import { HlmButton } from '@spartan-ng/helm/button';
import {
  HlmMenu,
  HlmMenuGroup,
  HlmMenuItem,
  HlmMenuItemSubIndicator,
  HlmMenuLabel,
  HlmMenuSeparator,
  HlmSubMenu,
} from '@spartan-ng/helm/menu';
import { OAuthService } from 'angular-oauth2-oidc';
import { ContextService } from '../../services/context.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-header',
  imports: [
    CommonModule,
    FormsModule,
    HlmButton,
    RouterLink,
    HlmMenu,
    HlmMenuItem,
    HlmMenuLabel,
    HlmMenuSeparator,
    HlmMenuGroup,
    HlmMenuItemSubIndicator,
    HlmSubMenu,
    BrnMenuTrigger,
    NgIcon,
  ],
  viewProviders: [
    provideIcons({
      lucideSun,
      lucideMoon,
      lucideMonitor,
      lucideChevronsUpDown,
      lucideChevronDown,
      lucidePlus,
    }),
  ],
  template: `
    <header
      class="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border"
    >
      <div class="flex items-center justify-between px-6 py-3">
        <!-- Left side -->
        <div class="flex items-center gap-4">
          <a
            [routerLink]="['/']"
            class="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded"
            aria-label="Home"
          ></a>

          @if (contextService.organizations().length !== 0) {
            <button
              class="flex items-center gap-2 px-4 py-2 -my-2 rounded hover:bg-muted transition-colors group"
              [brnMenuTriggerFor]="projectMenu"
            >
              <span
                class="font-semibold text-lg text-muted-foreground group-hover:text-foreground transition-colors"
                >{{ contextService.selectedOrg()?.name }}</span
              >
              @if (contextService.selectedProject(); as proj) {
                <span class="font-semibold text-lg"> / {{ proj.name }}</span>
                <span
                  class="text-xs bg-muted px-2 py-1 rounded text-muted-foreground"
                  >Hobby</span
                >
              }
              <div
                class="text-muted-foreground group-hover:text-foreground transition-colors leading-none"
              >
                <ng-icon name="lucideChevronsUpDown" size="16" />
              </div>
            </button>
          }
        </div>

        <ng-template #projectMenu>
          <hlm-menu>
            <hlm-menu-label>Organizations</hlm-menu-label>
            <hlm-menu-group>
              @for (org of projectDropdownData(); track org.id) {
                <a
                  [routerLink]="['/', org.name]"
                  class="cursor-pointer"
                  hlmMenuItem
                  [brnMenuTriggerFor]="projects"
                >
                  {{ org.name }}
                  <hlm-menu-item-sub-indicator />
                </a>

                <ng-template #projects>
                  <hlm-sub-menu>
                    <hlm-menu-label>Projects</hlm-menu-label>
                    @for (proj of org.projects; track proj.id) {
                      <a
                        [routerLink]="[org.name, 'project', proj.name]"
                        class="cursor-pointer"
                        hlmMenuItem
                      >
                        {{ proj.name }}
                      </a>
                    }
                  </hlm-sub-menu>
                </ng-template>
              }
            </hlm-menu-group>
          </hlm-menu>
        </ng-template>

        <!-- Right side -->
        <div class="flex items-center space-x-4">
          <!-- Feedback -->
          <a
            href="mailto:founders@glasskube.com?subject=Hyprmcp%20Feedback"
            class="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Feedback
          </a>

          <!-- Theme switcher -->
          <button
            (click)="toggleTheme()"
            class="flex items-center p-2 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground"
            [attr.aria-label]="themeLabel()"
          >
            <ng-icon [name]="themeIcon()" size="16" />
          </button>

          <!-- "Add new…" dropdown -->
          <button
            class="flex items-center gap-2 py-2 px-3 bg-foreground text-sm text-background font-medium rounded-md transition-colors cursor-pointer"
            [brnMenuTriggerFor]="addNewMenu"
            align="end"
          >
            Add new&hellip;
            <ng-icon name="lucideChevronDown" size="16" />
          </button>

          <ng-template #addNewMenu>
            <hlm-menu>
              <hlm-menu-group>
                <a
                  hlmMenuItem
                  class="w-full cursor-pointer"
                  routerLink="/organizations/new"
                >
                  New organization
                </a>
              </hlm-menu-group>

              @if (contextService.selectedOrg(); as o) {
                <hlm-menu-separator />
                <hlm-menu-group>
                  <a
                    hlmMenuItem
                    class="w-full cursor-pointer"
                    [routerLink]="['/' + o.name, 'new']"
                  >
                    New project in {{ o.name }}
                  </a>
                  <a
                    hlmMenuItem
                    class="w-full cursor-pointer"
                    [routerLink]="['/' + o.name, 'settings', 'members']"
                  >
                    Invite someone to {{ o.name }}
                  </a>
                </hlm-menu-group>
              }
            </hlm-menu>
          </ng-template>

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
                <hlm-menu-label>{{ userData['name'] }}</hlm-menu-label>
                <p class="text-sm text-muted-foreground px-2 py-1">
                  {{ userData['email'] }}
                </p>
                <hlm-menu-separator />
                <hlm-menu-group>
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
  private readonly oauthService = inject(OAuthService);
  protected readonly contextService = inject(ContextService);
  protected readonly userData = this.oauthService.getIdentityClaims();

  protected readonly projectDropdownData = computed(() => {
    const projects = this.contextService.projects();
    const organizations = this.contextService.organizations();
    if (!projects || !organizations) {
      return [];
    } else {
      return organizations.map((org) => ({
        ...org,
        projects: projects.filter((proj) => proj.organizationId === org.id),
      }));
    }
  });

  protected readonly themeIcon = computed(() => {
    switch (this.themeService.theme()) {
      case 'light':
        return 'lucideSun';
      case 'dark':
        return 'lucideMoon';
      case 'system':
        return 'lucideMonitor';
      default:
        return 'lucideMonitor';
    }
  });

  protected readonly themeLabel = computed(() => {
    switch (this.themeService.theme()) {
      case 'light':
        return 'Switch to dark mode';
      case 'dark':
        return 'Switch to system mode';
      case 'system':
        return 'Switch to light mode';
      default:
        return 'Switch theme';
    }
  });

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  logout() {
    this.oauthService.logOut();
    window.location.reload();
  }
}
