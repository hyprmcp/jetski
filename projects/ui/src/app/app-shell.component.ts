import { Component, inject } from '@angular/core';
import { HeaderComponent } from './components/header/header.component';
import { NavigationComponent } from './components/navigation/navigation.component';
import { RouterOutlet } from '@angular/router';
import { HlmToasterImports } from '../../libs/ui/ui-sonner-helm/src';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-shell',
  imports: [
    NavigationComponent,
    HeaderComponent,
    RouterOutlet,
    HlmToasterImports,
  ],
  template: `
    <div class="min-h-screen bg-background text-foreground">
      <app-header></app-header>
      <app-navigation></app-navigation>
      <main class="pt-32 max-w-7xl mx-auto sm:px-6 lg:px-8">
        <router-outlet />
        <hlm-toaster [theme]="themeService.theme()"></hlm-toaster>
      </main>
    </div>
  `,
})
export class AppShellComponent {
  public themeService = inject(ThemeService);
}
