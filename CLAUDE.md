# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Basic Development

- `npm start` or `ng serve` - Start development server on http://localhost:4200
- `npm run build` or `ng build` - Build for production (outputs to `dist/`)
- `npm run watch` or `ng build --watch --configuration development` - Build in watch mode for development
- `npm test` or `ng test` - Run unit tests with Karma

### Angular CLI Commands

- `ng generate component <name>` - Generate new component
- `ng generate service <name>` - Generate new service
- `ng generate --help` - List all available schematics

## Architecture Overview

### Framework & Stack

- **Angular 20** with zoneless change detection (`provideZonelessChangeDetection()`)
- **Standalone components** architecture (no NgModules except for UI library)
- **Spartan UI** (@spartan-ng/brain) with Tailwind CSS for styling
- **Lucide Angular** for icons
- **TypeScript** with strict configuration

### Project Structure

- `projects/ui/` - UI application project
  - `src/app/` - Main application code
    - `app.ts` - Root component with navigation and layout
    - `app.config.ts` - Application configuration with providers
    - `app.routes.ts` - Route definitions with lazy-loaded pages
    - `components/` - Reusable UI components
    - `pages/` - Route-specific page components (dashboard, servers, monitoring, settings)
    - `services/` - Application services (theme service)
    - `libs/ui/` - Custom UI component library (Spartan UI components)
  - `public/` - Static assets

### Key Architecture Patterns

- **Bundle Loading**: Two-bundle strategy with initial bundle and lazy-loaded authenticated bundle
- **Authentication Guard**: Routes are protected by an OAuth-based auth guard
- **Signals**: Uses Angular signals for reactive state management (see ThemeService)
- **Standalone Components**: All components are standalone, no NgModules needed
- **Path Mapping**: Custom UI components are mapped via tsconfig paths (`@spartan-ng/helm/button`)

### Routing Architecture

The application uses a hierarchical routing structure with authentication and optimized bundle loading:

- **Protected Routes**: All main application routes (dashboard, users, monitoring, settings) are protected by the `authGuard`
- **Auth Guard**: Uses `angular-oauth2-oidc` to validate ID tokens before allowing access
- **Bundle Strategy**: Uses two bundles - initial bundle for app shell and a single lazy-loaded bundle for all authenticated routes
- **Authenticated Routes**: All authenticated components are loaded together in `authenticated.routes.ts` and lazy-loaded as a single bundle
- **Default Route**: Root path redirects to `/dashboard` after authentication

Routes structure:

```
/
├── '' → redirects to /dashboard
└── '' (with authGuard)
    └── '' → loadChildren: authenticated.routes
        ├── dashboard
        ├── users
        ├── monitoring
        └── settings
```

**Bundle Loading Strategy:**

- Initial bundle: Contains app shell, auth guard, and routing logic
- Authenticated bundle: Contains all authenticated page components (dashboard, users, monitoring, settings) loaded together when user passes authentication

### Styling System

- **Tailwind CSS 4** with custom design tokens
- **CSS (not SCSS)** for all styling - uses plain CSS files
- **CSS Custom Properties** for theming (light/dark mode support)
- **Spartan UI** components with Tailwind styling
- Design system uses HSL color values for consistent theming

### Component Architecture

- Components use inline templates for better co-location
- Spartan UI directives (e.g., `HlmButtonDirective`) for consistent styling
- Theme service manages dark/light mode with localStorage persistence
- Lucide icons integrated throughout the UI

### ng-icons Implementation

When using ng-icons in components, follow this pattern:

1. **Import required dependencies**:

   ```typescript
   import { NgIcon, provideIcons } from "@ng-icons/core";
   import { lucideSun, lucideMoon } from "@ng-icons/lucide";
   ```

2. **Add to component decorator**:

   ```typescript
   @Component({
     imports: [..., NgIcon],
     viewProviders: [provideIcons({lucideSun, lucideMoon})],
     template: `...`
   })
   ```

3. **Use in template with string names**:
   ```html
   <ng-icon name="lucideSun" size="16" /> <ng-icon [name]="condition ? 'lucideSun' : 'lucideMoon'" />
   ```

**Important**: Always use `viewProviders` with `provideIcons()` to register icons, and reference them by string names in templates, not the imported symbols.

### Development Notes

- TypeScript strict mode enabled with additional strict flags
- Prettier configured with Angular HTML parser
- Uses `@angular/build:application` builder (modern Angular build system)
- Component prefix: `app-`
- Budget limits: 500kB warning, 1MB error for initial bundle

### Code Formatting

**Always run `npm run format` after making changes to TypeScript code to ensure code follows the prettier configuration.**
**Always run `mise run lint` after making changes to Go code to ensure it passes all linting checks.**

- `npm run format` - Format all files with prettier and fix linting issues for frontend
- `npm run lint` - Check formatting and linting without making changes for frontend
- `mise run lint` - Run Go linting with golangci-lint to check backend code quality
- Prettier is configured with Angular HTML parser for proper template formatting

### Package Manager

This project uses **pnpm** as the package manager. Make sure to use pnpm for installing dependencies:

- `pnpm install` - Install dependencies
- `pnpm add <package>` - Add a new dependency
- `pnpm add -D <package>` - Add a dev dependency

## Authentication System (Dex)

### Dex Architecture

This application uses **Dex** as a federated OpenID Connect provider that serves as an authentication proxy. Dex handles user authentication and provides OAuth2/OIDC tokens to the main Angular application.

### Dex UI Customization

Dex UI can be customized through Go templates and Tailwind CSS:

- **Templates Location**: `dex/web/templates/` - Contains Go HTML templates for authentication pages
  - `login.html` - Login page template
  - `password.html` - Password input template
  - `error.html` - Error page template
  - `header.html` - Common header template
  - `footer.html` - Common footer template
  - Additional templates: `approval.html`, `device.html`, `device_success.html`, `oob.html`

- **Static Assets**: `dex/web/static/` - Contains CSS, images, and compiled assets
  - `static/dist/` - Compiled Tailwind CSS output
  - `static/img/` - Provider icons (GitHub, Google, Microsoft, etc.)
  - `static/main.css` - Base CSS styles

### Dex Development Commands

- `pnpm run dex:build` - Build Tailwind CSS for Dex templates (outputs to `./dex/web/static/dist/tailwind.css`)

### Styling Dex Templates

Since Tailwind CSS is already configured, you can use Tailwind utility classes directly in the Dex Go templates to maintain design consistency with the main Angular application. The Dex authentication pages should follow the same design system principles as the main UI.

**Key Integration Points:**
1. Use the same Tailwind configuration for consistent theming
2. Maintain light/dark mode compatibility
3. Follow the minimal, clean aesthetic established in the main application
