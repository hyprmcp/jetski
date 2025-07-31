import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HlmButtonDirective } from '@spartan-ng/helm/button';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideBell,
  lucidePalette,
  lucideShield,
  lucideUser,
} from '@ng-icons/lucide';
import { BrnSelectComponent } from '@spartan-ng/brain/select';
import {
  HlmTableDirective,
  HlmTableImports,
  HlmTHeadDirective,
} from '@spartan-ng/helm/table';
import {
  ColumnDef,
  createAngularTable,
  flexRenderComponent, FlexRenderDirective,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel
} from '@tanstack/angular-table';
import { JsonRpcRequest, MCPServerLog } from '../../../api/mcp-server-log';
import { TimestampCellComponent } from '../project/logs/timestamp-cell.component';
import { TableHeadSortButtonComponent } from '../project/logs/table/sort-header-button.component';
import { formatDuration, intervalToDuration } from 'date-fns';
import { LogsActionsComponent } from '../project/logs/table/logs-actions.component';
import { UserAccount } from '../../../api/user-account';
import { OrganizationMembersTableActionComponent } from './organization-members-table-action.component';
import { FormsModule } from '@angular/forms';
import { ContextService } from '../../services/context.service';
import { getOrganizationMembers } from '../../../api/organization';

@Component({
  selector: 'app-organization-settings-members',
  standalone: true,
  imports: [
    FlexRenderDirective,
    CommonModule,
    HlmButtonDirective,
    NgIcon,
    BrnSelectComponent,
    HlmTHeadDirective,
    HlmTableDirective,
    HlmTableImports,
    FormsModule,
  ],
  viewProviders: [
    provideIcons({ lucideUser, lucideBell, lucideShield, lucidePalette }),
  ],

  template: `
    <h2 class="text-lg font-semibold text-foreground mb-6">
      Organization Members
    </h2>

    <div class="flex flex-col justify-between gap-4 sm:flex-row">
      <div class="flex items-center justify-between grow">
      </div>
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
      @if (_table.getRowCount() === 0) {
        <div class="flex h-full w-full items-center justify-center">
          <div class="text-muted-foreground text-sm">No Data</div>
        </div>
      }
    </div>
  `,
})
export class OrganizationSettingsMembersComponent {
  readonly contextService = inject(ContextService);
  readonly members = getOrganizationMembers(this.contextService.selectedOrg);

  protected readonly _columns: ColumnDef<UserAccount>[] = [
    {
      accessorKey: 'email',
      id: 'email',
      header: 'Email',
    },
    /*{
      accessorKey: 'createdAt',
      id: 'created_at',
      cell: (info) =>
        flexRenderComponent(TimestampCellComponent, {
          inputs: {
            timestamp: info.getValue<string>(),
          },
        }),
      enableSorting: true,
      header: () =>
        flexRenderComponent(TableHeadSortButtonComponent, {
          inputs: {
            header: 'Timestamp',
          },
        }),
    },*/
    {
      id: 'action',
      cell: (info) =>
        flexRenderComponent(OrganizationMembersTableActionComponent, {
          inputs: {
            userAccount: info.row.original,
          },
        }),
    },
  ];

  protected readonly _table = createAngularTable(() => ({
    data: this.members.value() ?? [],
    columns: this._columns,
    enableSorting: false,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  }));
}
