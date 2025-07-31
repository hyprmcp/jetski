import {
  Component,
  Input,
  AfterViewInit,
  ViewChild,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import {
  HlmCardContentDirective,
  HlmCardDirective,
  HlmCardHeaderDirective,
  HlmCardTitleDirective,
} from '@spartan-ng/helm/card';
import { Chart, registerables } from 'chart.js';
import { DecimalPipe } from '@angular/common';
import { ClientUsage } from './client-usage';
import { ColorPipe } from '../../../../pipes/color-pipe';

@Component({
  selector: 'app-client-usage',
  template: `
    <!-- Client Usage -->
    <div hlmCard>
      <div hlmCardHeader>
        <div hlmCardTitle>Client Usage</div>
        <p class="text-sm text-muted-foreground">
          Traffic distribution across MCP clients
        </p>
      </div>
      <div hlmCardContent>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Legend and Details -->
          <div class="space-y-3">
            @for (client of data.clients; track client.name; let i = $index) {
              <div
                class="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div class="flex items-center space-x-3">
                  <div class="w-4 h-4 rounded-full" [class]="i | color"></div>
                  <div>
                    <div class="font-medium">
                      {{ getDisplayName(client.name) }}
                    </div>
                    <div class="text-sm text-muted-foreground">
                      {{ client.sessions | number }} sessions
                    </div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-lg font-bold">
                    {{ getPercentage(client) }}%
                  </div>
                </div>
              </div>
            }
          </div>

          <!-- Chart.js Pie Chart -->
          <div class="flex justify-center items-center">
            <div class="relative w-64 h-64">
              <canvas #pieChart></canvas>
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
    DecimalPipe,
    ColorPipe,
  ],
})
export class ClientUsageComponent implements AfterViewInit, OnDestroy {
  @Input() data!: ClientUsage;

  @ViewChild('pieChart', { static: false })
  pieChartCanvas!: ElementRef<HTMLCanvasElement>;

  private pieChart: Chart | null = null;

  ngAfterViewInit() {
    setTimeout(() => {
      this.initializeChart();
    }, 100);
  }

  ngOnDestroy() {
    if (this.pieChart) {
      this.pieChart.destroy();
      this.pieChart = null;
    }
  }

  getDisplayName(name: string): string {
    const displayNames: Record<string, string> = {
      cursor: 'Cursor',
      chatgpt: 'ChatGPT',
      claude_pro: 'Claude Pro',
      other: 'Other',
    };
    return displayNames[name] || name;
  }

  getPercentage(client: { sessions: number }): number {
    if (this.data.totalSessions === 0) return 0;
    return Math.round((client.sessions / this.data.totalSessions) * 100);
  }

  getChartColor(index: number): string {
    // Convert ColorPipe Tailwind classes to hex colors for Chart.js
    const colorMap: Record<string, string> = {
      'bg-blue-500': '#3b82f6',
      'bg-emerald-500': '#10b981',
      'bg-violet-500': '#8b5cf6',
      'bg-red-500': '#ef4444',
      'bg-amber-500': '#f59e0b',
      'bg-orange-500': '#f97316',
      'bg-teal-500': '#14b8a6',
      'bg-indigo-500': '#6366f1',
      'bg-amber-600': '#d97706',
      'bg-pink-500': '#ec4899',
      'bg-orange-600': '#ea580c',
      'bg-cyan-500': '#06b6d4',
      'bg-violet-400': '#a78bfa',
      'bg-rose-500': '#f43f5e',
      'bg-lime-500': '#84cc16',
      'bg-black': '#000000',
    };

    const colorPipe = new ColorPipe();
    const tailwindClass = colorPipe.transform(index);
    return colorMap[tailwindClass] || '#000000';
  }

  private initializeChart() {
    try {
      if (!this.pieChartCanvas?.nativeElement) {
        console.warn('Pie chart canvas element not found');
        return;
      }

      Chart.register(...registerables);

      const ctx = this.pieChartCanvas.nativeElement.getContext('2d');

      if (!ctx) {
        console.error('Could not get 2D context from canvas');
        return;
      }

      if (this.pieChart) {
        this.pieChart.destroy();
      }

      this.pieChart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: this.data.clients.map((client) =>
            this.getDisplayName(client.name),
          ),
          datasets: [
            {
              data: this.data.clients.map((client) =>
                this.getPercentage(client),
              ),
              backgroundColor: this.data.clients.map((_, index) =>
                this.getChartColor(index),
              ),
              borderWidth: 1,
              borderColor: '#ffffff',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  const label = context.label || '';
                  const value = context.parsed;
                  return `${label}: ${value}%`;
                },
              },
            },
          },
        },
      });

      console.log('Client usage pie chart initialized successfully');
    } catch (error) {
      console.error('Error initializing client usage pie chart:', error);
    }
  }
}
