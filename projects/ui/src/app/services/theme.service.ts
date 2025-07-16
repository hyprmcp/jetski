import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly _theme = signal<Theme>('system');
  private readonly _isDark = signal<boolean>(false);

  readonly theme = this._theme.asReadonly();
  readonly isDark = this._isDark.asReadonly();

  private mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  constructor() {
    // Initialize theme from localStorage or default to system
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    const validTheme =
      savedTheme && ['light', 'dark', 'system'].includes(savedTheme)
        ? savedTheme
        : 'system';

    this._theme.set(validTheme);

    // Listen to system theme changes
    this.mediaQuery.addEventListener('change', () => {
      if (this._theme() === 'system') {
        this.updateDarkMode();
      }
    });

    // Apply theme changes to document
    effect(() => {
      const theme = this._theme();
      this.updateDarkMode();
      localStorage.setItem('theme', theme);
    });
  }

  private updateDarkMode(): void {
    const theme = this._theme();
    let isDark: boolean;

    switch (theme) {
      case 'dark':
        isDark = true;
        break;
      case 'light':
        isDark = false;
        break;
      case 'system':
        isDark = this.mediaQuery.matches;
        break;
    }

    this._isDark.set(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }

  toggleTheme(): void {
    const currentTheme = this._theme();
    let nextTheme: Theme;

    switch (currentTheme) {
      case 'light':
        nextTheme = 'dark';
        break;
      case 'dark':
        nextTheme = 'system';
        break;
      case 'system':
        nextTheme = 'light';
        break;
    }

    this._theme.set(nextTheme);
  }
}
