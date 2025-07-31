import { Component, inject } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  lucideBell,
  lucidePalette,
  lucideShield,
  lucideUser,
} from '@ng-icons/lucide';
import { ContextService } from '../../services/context.service';

@Component({
  selector: 'app-organization-settings-general',
  viewProviders: [
    provideIcons({ lucideUser, lucideBell, lucideShield, lucidePalette }),
  ],

  template: `
    <h2 class="text-lg font-semibold text-foreground mb-6">
      General Organization Settings
    </h2>

    <div class="space-y-6">
      <div>
        <label for="name" class="block text-sm font-medium text-foreground mb-2"
          >Name</label
        >
        <input
          id="name"
          type="text"
          readonly
          [value]="contextService.selectedOrg()?.name"
          class="w-full px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
        />
        <p
          class="mt-3 mb-3 text-sm font-normal text-gray-500 dark:text-gray-400"
        >
          Please contact support if you wish to change the organization name.
        </p>
      </div>
    </div>
  `,
})
export class OrganizationSettingsGeneralComponent {
  readonly contextService = inject(ContextService);
}
