import { Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronDown, lucideRotateCcw } from '@ng-icons/lucide';
import { BrnMenuTrigger } from '@spartan-ng/brain/menu';
import { BrnSelectImports } from '@spartan-ng/brain/select';
import { HlmButtonModule } from '@spartan-ng/helm/button';
import { HlmIcon } from '@spartan-ng/helm/icon';
import { HlmMenuModule } from '@spartan-ng/helm/menu';
import { HlmSelectModule } from '@spartan-ng/helm/select';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { ColumnDef, FlexRenderDirective, Table } from '@tanstack/angular-table';

@Component({
  selector: 'app-table',
  viewProviders: [provideIcons({ lucideChevronDown, lucideRotateCcw })],
  imports: [
    FlexRenderDirective,
    FormsModule,
    BrnMenuTrigger,
    HlmMenuModule,
    HlmButtonModule,
    NgIcon,
    HlmIcon,
    ...BrnSelectImports,
    HlmSelectModule,
    ...HlmTableImports,
  ],
  template: ` <div class="flex flex-col justify-between gap-4 sm:flex-row">
      <div class="flex items-center justify-between grow">
        <div><ng-content /></div>
        <div class="flex gap-2">
          <button hlmBtn variant="outline" (click)="refresh.emit()">
            <ng-icon hlm name="lucideRotateCcw" size="sm" />
          </button>
          @if (hidableColumns().length > 0) {
            <button
              hlmBtn
              variant="outline"
              align="end"
              [brnMenuTriggerFor]="menu"
            >
              Columns
              <ng-icon hlm name="lucideChevronDown" class="ml-2" size="sm" />
            </button>
          }
        </div>
      </div>

      <ng-template #menu>
        <hlm-menu class="w-32">
          @for (column of hidableColumns(); track column.id) {
            <button
              hlmMenuItemCheckbox
              class="capitalize"
              [checked]="column.getIsVisible()"
              (triggered)="column.toggleVisibility()"
            >
              <hlm-menu-item-check />
              {{ column.columnDef.id }}
            </button>
          }
        </hlm-menu>
      </ng-template>
    </div>
    <div
      class="border-border mt-4 block w-full overflow-auto rounded-md border"
    >
      <!-- we defer the loading of the table, because tanstack manipulates the DOM with flexRender which can cause errors during SSR -->
      @defer {
        <table hlmTable class="w-full">
          <thead hlmTHead>
            @for (
              headerGroup of table().getHeaderGroups();
              track headerGroup.id
            ) {
              <tr hlmTr>
                @for (header of headerGroup.headers; track header.id) {
                  <th hlmTh [attr.colSpan]="header.colSpan">
                    @if (!header.isPlaceholder) {
                      <ng-container
                        *flexRender="
                          header.column.columnDef.header;
                          props: header.getContext();
                          let headerText
                        "
                      >
                        <div [innerHTML]="headerText"></div>
                      </ng-container>
                    }
                  </th>
                }
              </tr>
            }
          </thead>
          <tbody hlmTBody class="w-full">
            @for (row of table().getRowModel().rows; track row.id) {
              <tr
                hlmTr
                [attr.key]="row.id"
                [attr.data-state]="row.getIsSelected() && 'selected'"
              >
                @for (cell of row.getVisibleCells(); track $index) {
                  <td hlmTd>
                    <ng-container
                      *flexRender="
                        cell.column.columnDef.cell;
                        props: cell.getContext();
                        let cell
                      "
                    >
                      <div [innerHTML]="cell"></div>
                    </ng-container>
                  </td>
                }
              </tr>
            } @empty {
              <tr hlmTr>
                <td
                  hlmTd
                  class="h-24 text-center"
                  [attr.colspan]="columns().length"
                >
                  No results.
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>

    <div class="mt-4 flex flex-col justify-end sm:flex-row sm:items-center">
      @if (table().getRowCount() > 0) {
        <div class="mt-2 flex sm:mt-0">
          <brn-select
            class="inline-block"
            [ngModel]="table().getState().pagination.pageSize"
            (ngModelChange)="
              table().setPageSize($event); table().resetPageIndex()
            "
          >
            <hlm-select-trigger class="mr-1 inline-flex h-9">
              <hlm-select-value />
            </hlm-select-trigger>
            <hlm-select-content>
              @for (size of availablePageSizes(); track size) {
                <hlm-option [value]="size">
                  {{ size === 10000 ? 'All' : size }}
                </hlm-option>
              }
            </hlm-select-content>
          </brn-select>

          <div class="flex space-x-1">
            <button
              size="sm"
              variant="outline"
              hlmBtn
              [disabled]="!table().getCanPreviousPage()"
              (click)="table().previousPage()"
            >
              Previous
            </button>
            <button
              size="sm"
              variant="outline"
              hlmBtn
              [disabled]="!table().getCanNextPage()"
              (click)="table().nextPage()"
            >
              Next
            </button>
          </div>
        </div>
      } @else {
        <div class="flex h-full w-full items-center justify-center">
          <div class="text-muted-foreground text-sm">No Data</div>
        </div>
      }
    </div>`,
})
export class TableComponent<T> {
  public readonly table = input.required<Table<T>>();
  public readonly columns = input.required<ColumnDef<T>[]>();
  public readonly availablePageSizes = input<number[]>([10, 20, 50, 100]);
  public readonly refresh = output();

  protected readonly hidableColumns = computed(() =>
    this.table()
      .getAllColumns()
      .filter((column) => column.getCanHide()),
  );
}
