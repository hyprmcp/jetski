import { Component } from '@angular/core';
import { HeaderComponent } from './components/header/header.component';
import { NavigationComponent } from './components/navigation/navigation.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [NavigationComponent, HeaderComponent, RouterOutlet],
  template: `
    <div class="min-h-screen bg-background text-foreground">
      <app-header></app-header>
      <app-navigation></app-navigation>
      <main class="pt-32 max-w-7xl mx-auto sm:px-6 lg:px-8">
        <router-outlet />
      </main>
    </div>
  `,
  styleUrl: './app.css',
})
export class App {
  protected title = 'jetski';
}
