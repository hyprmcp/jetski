import { Component, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSparkles } from '@ng-icons/lucide';
import { BrnSelectImports } from '@spartan-ng/brain/select';
import { HlmButton } from '@spartan-ng/helm/button';

@Component({
  selector: 'app-upsell-wrapper',
  imports: [HlmButton, NgIcon, BrnSelectImports],
  viewProviders: [provideIcons({ lucideSparkles })],
  template: `
    <!-- Pro Feature Banner -->
    <div
      class="relative overflow-hidden border border-border bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-lg"
    >
      <div
        class="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0"
      ></div>
      <div class="relative px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="rounded-lg bg-primary/10 p-2 leading-none text-primary">
              <ng-icon name="lucideSparkles" class="size-5"></ng-icon>
            </div>
            <div>
              <p class="font-semibold text-foreground">Pro Feature</p>
              <p class="text-sm text-muted-foreground">
                {{ description() ?? '' }}
              </p>
            </div>
          </div>
          <button
            hlmBtn
            variant="default"
            size="sm"
            class="bg-primary text-primary-foreground hover:bg-primary/90"
            (click)="upgradeToPro()"
          >
            Upgrade to Pro
          </button>
        </div>
      </div>
    </div>

    <!-- Blurred Content Container -->
    <div class="relative p-2">
      <!-- Blur Overlay -->
      <div class="absolute inset-0 z-10 backdrop-blur-xs"></div>
      <ng-content></ng-content>
    </div>
  `,
})
export class UpsellWrapperComponent {
  public readonly description = input<string>();

  upgradeToPro() {
    window.open('https://hyprmcp.com/waitlist/');
  }
}
