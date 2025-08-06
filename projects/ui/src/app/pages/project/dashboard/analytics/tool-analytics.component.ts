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
import { ToolAnalytics, McpTool, ToolParameter } from './tool-analytics';
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
              Parameter usage insights for your MCP tools
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
          <!-- Parameter Usage Distribution -->
          <div class="space-y-6">
            <!-- Parameter Cards -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              @for (
                parameter of visibleParameters;
                track parameter.name;
                let i = $index
              ) {
                <div hlmCard class="p-5">
                  <div hlmCardHeader class="pb-3">
                    <div hlmCardTitle class="text-base">
                      {{ parameter.name }}
                    </div>
                    <p class="text-sm text-muted-foreground">
                      Used {{ parameter.usageCount }} times ({{
                        getParameterUsagePercentage(parameter)
                      }}%)
                    </p>
                  </div>
                  <div hlmCardContent class="space-y-3">
                    <h5 class="text-sm font-medium text-muted-foreground mb-3">
                      Most used parameter values
                    </h5>
                    @for (
                      value of parameter.values;
                      track value.name;
                      let i = $index
                    ) {
                      <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-3 min-w-0 flex-1">
                          <div
                            class="w-3 h-3 rounded-full flex-shrink-0"
                            [class]="i | color"
                          ></div>
                          <span class="text-sm font-medium truncate">{{
                            value.name
                          }}</span>
                        </div>
                        <div class="flex items-center space-x-3 flex-shrink-0">
                          <div class="w-24 bg-gray-200 rounded-full h-2.5">
                            <div
                              class="h-2.5 rounded-full "
                              [class]="i | color"
                              [style.width]="
                                getPercentage(value, parameter) + '%'
                              "
                            ></div>
                          </div>
                          <span class="text-sm font-bold w-12 text-right"
                            >{{ getPercentage(value, parameter) }}%</span
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
                  [disabled]="currentParameterIndex === 0"
                  (click)="previousParameter()"
                >
                  <ng-icon hlm name="lucideChevronLeft" size="sm" />
                </button>
                <span
                  class="text-sm text-muted-foreground min-w-[60px] text-center"
                >
                  page {{ Math.ceil(currentParameterIndex / 2) + 1 }} of
                  {{ Math.ceil(parameters.length / 2) }}
                </span>
                <button
                  type="button"
                  class="courser-pointer inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                  [disabled]="currentParameterIndex + 2 >= parameters.length"
                  (click)="nextParameter()"
                >
                  <ng-icon hlm name="lucideChevronRight" size="sm" />
                </button>
              </div>
            </div>
          </div>
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
    parameters: [],
  };
  currentParameterIndex = 0;

  ngOnInit() {
    if (this.data?.tools?.length > 0) {
      this.selectedTool = this.data.tools[0];
    }
  }

  get parameters(): ToolParameter[] {
    return this.selectedTool?.parameters || [];
  }

  get visibleParameters(): ToolParameter[] {
    const startIndex = this.currentParameterIndex;
    const endIndex = Math.min(startIndex + 2, this.parameters.length);
    return this.parameters.slice(startIndex, endIndex);
  }

  previousParameter() {
    if (this.currentParameterIndex > 0) {
      this.currentParameterIndex = Math.max(0, this.currentParameterIndex - 2);
    }
  }

  nextParameter() {
    if (this.currentParameterIndex < this.parameters.length - 2) {
      this.currentParameterIndex = Math.min(
        this.parameters.length - 2,
        this.currentParameterIndex + 2,
      );
    }
  }

  onToolChange(tool: McpTool) {
    this.selectedTool = tool;
    this.currentParameterIndex = 0; // Reset to first parameter when tool changes
  }

  getPercentage(
    value: { count: number },
    parameter: { usageCount: number },
  ): number {
    if (parameter.usageCount === 0) return 0;
    return Math.round((value.count / parameter.usageCount) * 100);
  }

  getParameterUsagePercentage(parameter: { usageCount: number }): number {
    if (this.selectedTool.calls === 0) return 0;
    return Math.round((parameter.usageCount / this.selectedTool.calls) * 100);
  }

  protected readonly Math = Math;
}
