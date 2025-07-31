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
  selector: 'app-organization-settings-members',
  standalone: true,
  imports: [CommonModule, HlmButtonDirective, NgIcon],
  viewProviders: [
    provideIcons({ lucideUser, lucideBell, lucideShield, lucidePalette }),
  ],

  template: `
    <h2 class="text-lg font-semibold text-foreground mb-6">
      Organization Members
    </h2>

    <div class="space-y-6"></div>
  `,
})
export class OrganizationSettingsMembersComponent {}
