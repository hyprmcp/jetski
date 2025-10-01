import { httpResource } from '@angular/common/http';
import { Component, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideEye } from '@ng-icons/lucide';
import { HlmButtonModule } from '@spartan-ng/helm/button';
import { HlmIcon } from '@spartan-ng/helm/icon';
import {
  ColumnDef,
  createAngularTable,
  flexRenderComponent,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
} from '@tanstack/angular-table';
import { combineLatestWith, distinctUntilChanged, map, tap } from 'rxjs';
import { MCPServerLogPromptData } from '../../../../api/mcp-server-log';
import { TableHeadSortButtonComponent } from '../../../components/table/sort-header-button.component';
import { TableComponent } from '../../../components/table/table.component';
import { ContextService } from '../../../services/context.service';
import { TimestampCellComponent } from '../logs/timestamp-cell.component';

@Component({
  host: { class: 'w-full' },
  imports: [TableComponent],
  template: `
    <app-table [columns]="columns" [table]="table" (refresh)="data.reload()">
      <h1 class="text-2xl font-semibold text-foreground">Prompts</h1>
      <p class="text-muted-foreground">
        Analyze which operations are triggered by which prompts
      </p>
    </app-table>
  `,
})
export class PromptsComponent {
  protected readonly columns: ColumnDef<MCPServerLogPromptData>[] = [
    {
      accessorKey: 'startedAt',
      id: 'started_at',
      cell: (info) =>
        flexRenderComponent(TimestampCellComponent, {
          inputs: { timestamp: info.getValue<string>() },
        }),
      enableSorting: true,
      header: () =>
        flexRenderComponent(TableHeadSortButtonComponent, {
          inputs: { header: 'Timestamp' },
        }),
    },
    { accessorKey: 'method', id: 'method', header: 'Method' },
    {
      accessorKey: 'toolName',
      id: 'tool_name',
      header: () =>
        flexRenderComponent(TableHeadSortButtonComponent, {
          inputs: { header: 'Tool Name' },
        }),
    },
    { accessorKey: 'prompt', id: 'prompt', header: 'Prompt' },
    {
      id: 'action',
      enableHiding: false,
      cell: (info) =>
        flexRenderComponent(PromptsTableActionsComponent, {
          inputs: { data: info.row.original },
        }),
    },
  ];

  private readonly defaultSorting: SortingState = [
    {
      id: 'started_at',
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

  private readonly route = inject(ActivatedRoute);
  private readonly contextService = inject(ContextService);

  protected readonly query = toSignal(
    toObservable(this.contextService.selectedProject).pipe(
      map((p) => p?.id),
      distinctUntilChanged(),
      tap(() => {
        this._pagination.set(this.defaultPagination);
      }),
      combineLatestWith(
        toObservable(this._pagination),
        toObservable(this._sorting),
        this.route.queryParams.pipe(map((params) => params['id'])),
        this.route.queryParams.pipe(map((params) => params['mcpSessionId'])),
      ),
      map(([projectId, pagination, sorting, id, mcpSessionId]) => {
        return { projectId, pagination, sorting, id, mcpSessionId };
      }),
    ),
  );

  protected readonly data = httpResource(
    () => {
      const query = this.query();
      if (query?.projectId) {
        const { projectId, pagination, sorting, id, mcpSessionId } = query;
        const params: Record<string, string | number> = {
          page: pagination?.pageIndex,
          count: pagination?.pageSize,
          sortOrder: (sorting?.[0]?.desc ?? false) ? 'desc' : 'asc',
          sortBy: sorting?.[0]?.id ?? '',
        };

        if (id) {
          params['id'] = id;
        }

        if (mcpSessionId) {
          params['mcpSessionId'] = mcpSessionId;
        }

        return {
          url: `/api/v1/projects/${projectId}/prompts`,
          params,
        };
      } else {
        return undefined;
      }
    },
    {
      parse: (value) => value as MCPServerLogPromptData[],
      defaultValue: [],
    },
  );

  protected readonly table = createAngularTable(() => ({
    data: this.data.value(),
    columns: this.columns,
    state: {
      sorting: this._sorting(),
      pagination: this._pagination(),
    },
    manualPagination: true,
    pageCount: -1,
    manualSorting: true,
    enableMultiSort: false,
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
}

@Component({
  imports: [NgIcon, HlmButtonModule, RouterLink, HlmIcon],
  viewProviders: [provideIcons({ lucideEye })],
  template: `
    <a
      hlmBtn
      variant="ghost"
      class="size-8 p-0"
      [routerLink]="['..', 'logs']"
      [queryParams]="{ id: data().id }"
    >
      <span class="sr-only">Open menu</span>
      <ng-icon hlm size="sm" name="lucideEye" />
    </a>
  `,
})
export class PromptsTableActionsComponent {
  public readonly data = input.required<MCPServerLogPromptData>();
}
