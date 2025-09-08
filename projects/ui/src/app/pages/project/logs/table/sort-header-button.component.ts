import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowDown,
  lucideArrowUp,
  lucideArrowUpDown,
} from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmIcon } from '@spartan-ng/helm/icon';
import {
  HeaderContext,
  injectFlexRenderContext,
} from '@tanstack/angular-table';

@Component({
  imports: [HlmButton, NgIcon, HlmIcon],
  providers: [
    provideIcons({ lucideArrowUpDown, lucideArrowUp, lucideArrowDown }),
  ],
  template: `
    <button
      hlmBtn
      size="sm"
      variant="ghost"
      (click)="filterClick()"
      [class.capitalize]="header() === ''"
    >
      {{ _header() }}
      @if (_context.column.getIsSorted() === 'asc') {
        <ng-icon hlm class="ml-3" size="sm" name="lucideArrowUp" />
      } @else if (_context.column.getIsSorted() === 'desc') {
        <ng-icon hlm class="ml-3" size="sm" name="lucideArrowDown" />
      }
    </button>
  `,
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableHeadSortButtonComponent<T> {
  protected readonly _context =
    injectFlexRenderContext<HeaderContext<T, unknown>>();

  protected filterClick() {
    this._context.column.toggleSorting(
      this._context.column.getIsSorted() === 'asc',
    );
  }

  protected readonly header = input('');
  protected readonly _header = computed(() => {
    return this.header() === '' ? this._context.column.id : this.header();
  });
}
