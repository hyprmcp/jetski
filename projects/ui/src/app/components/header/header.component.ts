import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChevronsUpDown,
  lucideMonitor,
  lucideMoon,
  lucideSun,
} from '@ng-icons/lucide';
import { BrnMenuTriggerDirective } from '@spartan-ng/brain/menu';
import { HlmButtonDirective } from '@spartan-ng/helm/button';
import {
  HlmMenuComponent,
  HlmMenuGroupComponent,
  HlmMenuItemDirective,
  HlmMenuItemSubIndicatorComponent,
  HlmMenuLabelComponent,
  HlmMenuSeparatorComponent,
  HlmSubMenuComponent,
} from '@spartan-ng/helm/menu';
import { OAuthService } from 'angular-oauth2-oidc';
import { ThemeService } from '../../services/theme.service';
import { ContextService } from '../../services/context.service';

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
    HlmMenuItemSubIndicatorComponent,
    HlmSubMenuComponent,
    BrnMenuTriggerDirective,
    NgIcon,
  ],
  viewProviders: [
    provideIcons({
      lucideSun,
      lucideMoon,
      lucideMonitor,
      lucideChevronsUpDown,
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
          <button
            class="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Feedback
          </button>

          <!-- Theme switcher -->
          <button
            (click)="toggleTheme()"
            class="p-2 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground leading-none"
            [attr.aria-label]="themeLabel()"
          >
            <ng-icon [name]="themeIcon()" size="16" />
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
