import { Component, Input, OnInit } from '@angular/core';
import {
  HlmCardContentDirective,
  HlmCardDirective,
  HlmCardHeaderDirective,
  HlmCardTitleDirective,
} from '@spartan-ng/helm/card';
import { BrnSelectModule } from '@spartan-ng/brain/select';
import {
  HlmSelectContentDirective,
  HlmSelectOptionComponent,
  HlmSelectTriggerComponent,
} from '@spartan-ng/helm/select';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChevronDown,
  lucideChevronLeft,
  lucideChevronRight,
} from '@ng-icons/lucide';
import { HlmIconDirective } from '@spartan-ng/helm/icon';
import { FormsModule } from '@angular/forms';
import { ToolAnalytics, McpTool, ToolArgument } from './tool-analytics';
import { ColorPipe } from '../../../../pipes/color-pipe';

@Component({
  selector: 'app-tool-analytics',
  template: `
    <!-- Tool Analytics -->
    <div hlmCard>
      <div hlmCardHeader>
        <div class="flex items-center justify-between">
          <div>
            <div hlmCardTitle>Tool Analytics</div>
            <p class="text-sm text-muted-foreground">
              Argument usage insights for your MCP tools
            </p>
          </div>
          <!-- Select Tool Dropdown -->
          <div class="relative">
            <brn-select
              [ngModel]="selectedTool"
              (ngModelChange)="onToolChange($event)"
              class="min-w-[300px]"
            >
              <hlm-select-trigger>
                <div class="flex items-center justify-between w-full">
                  <div class="flex items-center gap-2 mx-8">
                    <span class="text-sm font-medium">{{
                      selectedTool.name
                    }}</span>
                    <span
                      class="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full font-medium"
                    >
                      {{ selectedTool.calls }} calls
                    </span>
                  </div>
                  <ng-icon
                    hlm
                    name="lucideChevronDown"
                    size="sm"
                    class="text-muted-foreground"
                  />
                </div>
              </hlm-select-trigger>
              <hlm-select-content>
                @for (tool of data.tools; track tool.name) {
                  <hlm-option [value]="tool">
                    <div class="flex items-center justify-between w-full">
                      <div class="flex items-center gap-2">
                        <span class="text-sm font-medium">{{ tool.name }}</span>
                        <span
                          class="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full font-medium"
                        >
                          {{ tool.calls }} calls
                        </span>
                      </div>
                    </div>
                  </hlm-option>
                }
              </hlm-select-content>
            </brn-select>
          </div>
        </div>
      </div>
      <div hlmCardContent>
        <div class="space-y-6">
          @if (visibleArguments.length > 0) {
            <!-- Argument Usage Distribution -->
            <div class="space-y-6">
              <!-- Argument Cards -->
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                @for (
                  argument of visibleArguments;
                  track argument.name;
                  let i = $index
                ) {
                  <div hlmCard class="p-5">
                    <div hlmCardHeader class="pb-3">
                      <div hlmCardTitle class="text-base">
                        {{ argument.name }}
                      </div>
                      <p class="text-sm text-muted-foreground">
                        Used {{ argument.usageCount }} times ({{
                          getArgumentUsagePercentage(argument)
                        }}%)
                      </p>
                    </div>
                    <div hlmCardContent class="space-y-3">
                      <h5
                        class="text-sm font-medium text-muted-foreground mb-3"
                      >
                        Most used argument values
                      </h5>
                      @for (
                        value of argument.values;
                        track value.name;
                        let i = $index
                      ) {
                        <div class="flex items-center justify-between">
                          <div
                            class="flex items-center space-x-3 min-w-0 flex-1"
                          >
                            <div
                              class="w-3 h-3 rounded-full flex-shrink-0"
                              [class]="i | color"
                            ></div>
                            <span class="text-sm font-medium truncate">{{
                              value.name
                            }}</span>
                          </div>
                          <div
                            class="flex items-center space-x-3 flex-shrink-0"
                          >
                            <div class="w-24 bg-gray-200 rounded-full h-2.5">
                              <div
                                class="h-2.5 rounded-full "
                                [class]="i | color"
                                [style.width]="
                                  getPercentage(value, argument) + '%'
                                "
                              ></div>
                            </div>
                            <span class="text-sm font-bold w-12 text-right"
                              >{{ getPercentage(value, argument) }}%</span
                            >
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>

              <!-- Navigation Controls -->
              <div class="flex items-center justify-center">
                <div class="flex items-center space-x-3">
                  <button
                    type="button"
                    class="courser-pointer inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                    [disabled]="currentArgumentIndex === 0"
                    (click)="previousArgument()"
                  >
                    <ng-icon hlm name="lucideChevronLeft" size="sm" />
                  </button>
                  <span
                    class="text-sm text-muted-foreground min-w-[60px] text-center"
                  >
                    page {{ Math.ceil(currentArgumentIndex / 2) + 1 }} of
                    {{ Math.ceil(arguments.length / 2) }}
                  </span>
                  <button
                    type="button"
                    class="courser-pointer inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                    [disabled]="currentArgumentIndex + 2 >= arguments.length"
                    (click)="nextArgument()"
                  >
                    <ng-icon hlm name="lucideChevronRight" size="sm" />
                  </button>
                </div>
              </div>
            </div>
          } @else {
            <div class="flex flex-col items-center">
              <p class="text-sm text-muted-foreground">
                {{ selectedTool.name }} does not seem to have any arguments
              </p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  imports: [
    HlmCardDirective,
    HlmCardContentDirective,
    HlmCardHeaderDirective,
    HlmCardTitleDirective,
    BrnSelectModule,
    HlmSelectContentDirective,
    HlmSelectTriggerComponent,
    HlmSelectOptionComponent,
    FormsModule,
    NgIcon,
    HlmIconDirective,
    ColorPipe,
  ],
  providers: [
    provideIcons({
      lucideChevronDown,
      lucideChevronLeft,
      lucideChevronRight,
    }),
  ],
})
export class ToolAnalyticsComponent implements OnInit {
  @Input() data!: ToolAnalytics;

  selectedTool: McpTool = this.data?.tools[0] || {
    name: '',
    calls: 0,
    arguments: [],
  };
  currentArgumentIndex = 0;

  ngOnInit() {
    if (this.data?.tools?.length > 0) {
      this.selectedTool = this.data.tools[0];
    }
  }

  get arguments(): ToolArgument[] {
    return this.selectedTool?.arguments || [];
  }

  get visibleArguments(): ToolArgument[] {
    const startIndex = this.currentArgumentIndex;
    const endIndex = Math.min(startIndex + 2, this.arguments.length);
    return this.arguments.slice(startIndex, endIndex);
  }

  previousArgument() {
    if (this.currentArgumentIndex > 0) {
      this.currentArgumentIndex = Math.max(0, this.currentArgumentIndex - 2);
    }
  }

  nextArgument() {
    if (this.currentArgumentIndex < this.arguments.length - 2) {
      this.currentArgumentIndex = Math.min(
        this.arguments.length - 2,
        this.currentArgumentIndex + 2,
      );
    }
  }

  onToolChange(tool: McpTool) {
    this.selectedTool = tool;
    this.currentArgumentIndex = 0; // Reset to first argument when tool changes
  }

  getPercentage(
    value: { count: number },
    argument: { usageCount: number },
  ): number {
    if (argument.usageCount === 0) return 0;
    return Math.round((value.count / argument.usageCount) * 100);
  }

  getArgumentUsagePercentage(argument: { usageCount: number }): number {
    if (this.selectedTool.calls === 0) return 0;
    return Math.round((argument.usageCount / this.selectedTool.calls) * 100);
  }

  protected readonly Math = Math;
}
