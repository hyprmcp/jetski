import { Component, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HlmButtonModule } from '@spartan-ng/helm/button';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronDown } from '@ng-icons/lucide';
import { BrnMenuTriggerDirective } from '@spartan-ng/brain/menu';
import { BrnSelectModule } from '@spartan-ng/brain/select';
import { HlmIconDirective } from '@spartan-ng/helm/icon';
import { HlmMenuModule } from '@spartan-ng/helm/menu';
import { HlmSelectModule } from '@spartan-ng/helm/select';
import { HlmTableImports } from '@spartan-ng/helm/table';
import {
  ColumnDef,
  createAngularTable,
  flexRenderComponent,
  FlexRenderDirective,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
} from '@tanstack/angular-table';
import { httpResource } from '@angular/common/http';
import { JsonRpcRequest, MCPServerLog } from '../../../../api/mcp-server-log';
import { TimestampCellComponent } from './timestamp-cell.component';
import { LogsActionsComponent } from './table/logs-actions.component';
import { combineLatestWith, distinctUntilChanged, map, tap } from 'rxjs';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { TableHeadSortButtonComponent } from './table/sort-header-button.component';

@Component({
  selector: 'app-logs-component',
  imports: [
    FlexRenderDirective,
    FormsModule,
    BrnMenuTriggerDirective,
    HlmMenuModule,
    HlmButtonModule,
    NgIcon,
    HlmIconDirective,
    BrnSelectModule,
    HlmSelectModule,
    ...HlmTableImports,
  ],
  providers: [provideIcons({ lucideChevronDown })],
  host: {
    class: 'w-full',
  },
  template: `
    <div class="flex flex-col justify-between gap-4 sm:flex-row">
      <button hlmBtn variant="outline" align="end" [brnMenuTriggerFor]="menu">
        Columns
        <ng-icon hlm name="lucideChevronDown" class="ml-2" size="sm" />
      </button>
      <ng-template #menu>
        <hlm-menu class="w-32">
          @for (column of hidableColumns; track column.id) {
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
              headerGroup of _table.getHeaderGroups();
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
            @for (row of _table.getRowModel().rows; track row.id) {
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
                  [attr.colspan]="_columns.length"
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
      @if (_table.getRowCount() > 0) {
        <div class="mt-2 flex sm:mt-0">
          <brn-select
            class="inline-block"
            [ngModel]="_table.getState().pagination.pageSize"
            (ngModelChange)="
              _table.setPageSize($event); _table.resetPageIndex()
            "
          >
            <hlm-select-trigger class="w-15 mr-1 inline-flex h-9">
              <hlm-select-value />
            </hlm-select-trigger>
            <hlm-select-content>
              @for (size of _availablePageSizes; track size) {
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
              [disabled]="!_table.getCanPreviousPage()"
              (click)="_table.previousPage()"
            >
              Previous
            </button>
            <button
              size="sm"
              variant="outline"
              hlmBtn
              [disabled]="!_table.getCanNextPage()"
              (click)="_table.nextPage()"
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
    </div>
  `,
})
export class LogsComponent {
  protected readonly _availablePageSizes = [10, 20, 50, 100];

  protected readonly _columns: ColumnDef<MCPServerLog>[] = [
    {
      accessorKey: 'startedAt',
      id: 'startedAt',
      cell: (info) =>
        flexRenderComponent(TimestampCellComponent, {
          inputs: {
            timestamp: info.getValue<string>(),
          },
        }),
      enableSorting: true,
      header: () => flexRenderComponent(TableHeadSortButtonComponent),
    },
    {
      accessorKey: 'duration',
      id: 'duration',
      header: () => flexRenderComponent(TableHeadSortButtonComponent),
      // header: 'Duration (ms)',
      cell: (info) =>
        `<span class="capitalize">${info.getValue<number>() / 1000 / 1000}</span>`,
      enableSorting: true,
    },
    {
      accessorKey: 'mcpRequest',
      id: 'mcpRequest',
      header: 'Tool Call',
      cell: (info) =>
        `<span class="capitalize">${info.getValue<JsonRpcRequest>().method}</span>`,
      enableSorting: false,
    },
    {
      accessorKey: 'httpStatusCode',
      id: 'status',
      header: 'Status',
      cell: (info) =>
        `<span class="capitalize">${info.getValue<string>()}</span>`,
      enableSorting: false,
    },
    {
      id: 'action',
      enableHiding: false,
      cell: (info) =>
        flexRenderComponent(LogsActionsComponent, {
          inputs: {
            mcpServerLog: info.row.original,
          },
        }),
    },
  ];

  private readonly defaultSorting: SortingState = [
    {
      id: 'startedAt',
      desc: true,
    },
  ];
  private readonly _sorting = signal<SortingState>(this.defaultSorting);
  private readonly defaultPagination: PaginationState = {
    pageSize: 10,
    pageIndex: 0,
  };
  private readonly _pagination = signal<PaginationState>(
    this.defaultPagination,
  );

  projectId = input.required<string>();

  readonly data$ = toSignal(
    toObservable(this.projectId).pipe(
      distinctUntilChanged(),
      tap(() => {
        this._pagination.set(this.defaultPagination);
      }),
      combineLatestWith(
        toObservable(this._pagination),
        toObservable(this._sorting),
      ),
      map(([projectId, pagination, sorting]) => {
        return { projectId, pagination, sorting };
      }),
    ),
  );

  readonly data = httpResource(
    () => {
      const data = this.data$();
      if (data?.projectId) {
        const { projectId, pagination, sorting } = data;
        return {
          url: `/api/v1/projects/${projectId}/logs`,
          method: 'GET',
          params: {
            page: pagination?.pageIndex,
            count: pagination?.pageSize,
            sortDesc: sorting?.[0]?.desc ?? '',
            sortBy: sorting?.[0]?.id ?? '',
          },
        };
      } else {
        return undefined;
      }
    },
    {
      parse: (value) => value as MCPServerLog[],
      defaultValue: [],
    },
  );

  protected readonly _table = createAngularTable(() => ({
    data: this.data.value(),
    columns: this._columns,
    state: {
      sorting: this._sorting(),
      pagination: this._pagination(),
    },
    manualPagination: true,
    pageCount: -1,
    manualSorting: true,
    onSortingChange: (updater) => {
      if (updater instanceof Function) {
        this._sorting.update(updater);
      } else {
        this._sorting.set(updater);
      }
    },
    onPaginationChange: (updater) => {
      if (updater instanceof Function) {
        this._pagination.update(updater);
      } else {
        this._pagination.set(updater);
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  }));
  protected readonly hidableColumns = this._table
    .getAllColumns()
    .filter((column) => column.getCanHide());
}
