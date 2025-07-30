import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HlmButtonDirective } from '@spartan-ng/helm/button';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideBell,
  lucidePalette,
  lucideShield,
  lucideUser,
} from '@ng-icons/lucide';
import { HlmCheckboxComponent } from '@spartan-ng/helm/checkbox';
import { HlmLabelDirective } from '../../../../libs/ui/ui-label-helm/src';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    HlmButtonDirective,
    NgIcon,
    HlmCheckboxComponent,
    HlmLabelDirective,
  ],
  viewProviders: [
    provideIcons({ lucideUser, lucideBell, lucideShield, lucidePalette }),
  ],

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
            <span
              class="flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md bg-accent text-accent-foreground"
            >
              <ng-icon name="lucideUser" class="h-4 w-4"></ng-icon>
              <span>General</span>
            </span>
          </nav>
        </div>

        <div class="lg:col-span-3">
          <div class="bg-card border border-border rounded-lg p-6">
            <h2 class="text-lg font-semibold text-foreground mb-6">
              Authentication
            </h2>

            <div class="space-y-6">
              <div class="flex items-start gap-3">
                <hlm-checkbox id="authentication" [checked]="true" />
                <div class="grid gap-2">
                  <label hlmLabel for="authentication"
                    >Enforce User authentication</label
                  >
                  <p class="text-muted-foreground text-sm">
                    Users must authenticate via OAuth2 to access the MCP
                    server.<br />
                    This gives you better analytics and allows you to get an
                    additional session context.
                  </p>
                </div>
              </div>

              <!-- Actions -->
              <div
                class="flex items-center justify-between pt-4 border-t border-border"
              >
                <button hlmBtn variant="outline">Cancel</button>
                <button hlmBtn>Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class SettingsComponent {}
