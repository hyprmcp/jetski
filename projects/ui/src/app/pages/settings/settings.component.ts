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

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, HlmButtonDirective, NgIcon],
  viewProviders: [
    provideIcons({ lucideUser, lucideBell, lucideShield, lucidePalette }),
  ],

  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-2xl font-semibold text-foreground">Settings</h1>
        <p class="text-muted-foreground">
          Manage your account and application preferences
        </p>
      </div>

      <!-- Settings Navigation -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div class="lg:col-span-1">
          <nav class="space-y-1">
            <a
              href="#"
              class="flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md bg-accent text-accent-foreground"
            >
              <ng-icon name="lucideUser" class="h-4 w-4"></ng-icon>
              <span>Profile</span>
            </a>
            <a
              href="#"
              class="flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md text-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <ng-icon name="lucideBell" class="h-4 w-4"></ng-icon>
              <span>Notifications</span>
            </a>
            <a
              href="#"
              class="flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md text-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <ng-icon name="lucideShield" class="h-4 w-4"></ng-icon>
              <span>Security</span>
            </a>
            <a
              href="#"
              class="flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-md text-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <ng-icon name="lucidePalette" class="h-4 w-4"></ng-icon>
              <span>Appearance</span>
            </a>
          </nav>
        </div>

        <div class="lg:col-span-3">
          <div class="bg-card border border-border rounded-lg p-6">
            <h2 class="text-lg font-semibold text-foreground mb-6">
              Profile Settings
            </h2>

            <div class="space-y-6">
              <!-- Avatar -->
              <div class="flex items-center space-x-4">
                <div
                  class="w-16 h-16 bg-primary rounded-full flex items-center justify-center"
                >
                  <span class="text-primary-foreground text-xl font-bold"
                    >P</span
                  >
                </div>
                <div>
                  <button hlmBtn variant="outline" size="sm">
                    Change Avatar
                  </button>
                  <p class="text-xs text-muted-foreground mt-1">
                    JPG, GIF or PNG. 1MB max.
                  </p>
                </div>
              </div>

              <!-- Form Fields -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    for="first-name"
                    class="block text-sm font-medium text-foreground mb-2"
                    >First Name</label
                  >
                  <input
                    id="first-name"
                    type="text"
                    value="pmig"
                    class="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>
                <div>
                  <label
                    for="last-name"
                    class="block text-sm font-medium text-foreground mb-2"
                    >Last Name</label
                  >
                  <input
                    id="last-name"
                    type="text"
                    value=""
                    class="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label
                  for="email"
                  class="block text-sm font-medium text-foreground mb-2"
                  >Email</label
                >
                <input
                  id="email"
                  type="email"
                  value="pmig@glasskube.com"
                  class="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>

              <div>
                <label
                  for="bio"
                  class="block text-sm font-medium text-foreground mb-2"
                  >Bio</label
                >
                <textarea
                  id="bio"
                  rows="3"
                  placeholder="Tell us about yourself..."
                  class="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
                ></textarea>
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
