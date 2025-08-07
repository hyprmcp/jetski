import {
  Component,
  Input,
  AfterViewInit,
  ViewChild,
  ElementRef,
  OnDestroy,
  inject,
  effect,
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
import { ThemeService } from '../../../../services/theme.service';

@Component({
  selector: 'app-client-usage',
  template: `
    <!-- Client Usage -->
    <div hlmCard class="overflow-hidden">
      <div hlmCardHeader>
        <div hlmCardTitle>Client Usage</div>
        <p class="text-sm text-muted-foreground">
          Traffic distribution across MCP clients
        </p>
      </div>
      <div hlmCardContent>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Modern Donut Chart -->
          <div class="flex justify-center items-center">
            <div class="relative">
              <div class="w-72 h-72">
                <canvas #pieChart></canvas>
              </div>
              <!-- Center label -->
              <div
                class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
              >
                <div class="text-3xl font-semibold">
                  {{ data.totalSessions | number }}
                </div>
                <div class="text-sm text-muted-foreground">Total Sessions</div>
              </div>
            </div>
          </div>

          <!-- Modern Legend -->
          <div class="flex flex-col justify-center space-y-4">
            @for (client of data.clients; track client.name; let i = $index) {
              <div
                class="group duration-200"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-3 h-3 rounded-full transition-all duration-200 group-hover:scale-125"
                      [style.background-color]="getModernColor(i)"
                    ></div>
                    <div>
                      <div class="font-medium text-sm">
                        {{ getDisplayName(client.name) }}
                      </div>
                      <div class="text-xs text-muted-foreground">
                        {{ client.sessions | number }} sessions
                      </div>
                    </div>
                  </div>
                </div>
                <!-- Progress bar -->
                <div class="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-500"
                    [style.width.%]="getPercentage(client)"
                    [style.background-color]="getModernColor(i)"
                  ></div>
                </div>
              </div>
            }
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
  ],
})
export class ClientUsageComponent implements AfterViewInit, OnDestroy {
  @Input() data!: ClientUsage;

  @ViewChild('pieChart', { static: false })
  pieChartCanvas!: ElementRef<HTMLCanvasElement>;

  private pieChart: Chart | null = null;
  private themeService = inject(ThemeService);

  constructor() {
    effect(() => {
      this.themeService.isDark(); // Subscribe to theme changes
      if (this.pieChart) {
        this.updateChartTheme();
      }
    });
  }

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

  getModernColor(index: number): string {
    const isDark = this.themeService.isDark();

    // Modern color palette inspired by Vercel
    const lightColors = [
      '#0070f3', // Blue
      '#00d9ff', // Cyan
      '#7928ca', // Purple
      '#ff0080', // Pink
      '#ff4500', // Orange
      '#00a870', // Green
      '#f5a623', // Yellow
      '#50e3c2', // Teal
    ];

    const darkColors = [
      '#0096ff', // Bright Blue
      '#00e5ff', // Bright Cyan
      '#a855f7', // Bright Purple
      '#ff0080', // Bright Pink
      '#ff6b6b', // Coral
      '#00d68f', // Bright Green
      '#ffd93d', // Bright Yellow
      '#6bcf7f', // Bright Teal
    ];

    const colors = isDark ? darkColors : lightColors;
    return colors[index % colors.length];
  }

  private updateChartTheme() {
    if (!this.pieChart) return;

    const isDark = this.themeService.isDark();

    // Update chart colors
    if (this.pieChart.data.datasets[0]) {
      this.pieChart.data.datasets[0].backgroundColor = this.data.clients.map(
        (_, index) => this.getModernColor(index),
      );
      this.pieChart.data.datasets[0].borderColor = isDark
        ? '#1a1a1a'
        : '#ffffff';
    }

    // Update tooltip styles
    if (this.pieChart.options?.plugins?.tooltip) {
      this.pieChart.options.plugins.tooltip.backgroundColor = isDark
        ? '#1a1a1a'
        : '#ffffff';
      this.pieChart.options.plugins.tooltip.titleColor = isDark
        ? '#ffffff'
        : '#000000';
      this.pieChart.options.plugins.tooltip.bodyColor = isDark
        ? '#ffffff'
        : '#000000';
      this.pieChart.options.plugins.tooltip.borderColor = isDark
        ? '#333333'
        : '#e5e7eb';
    }

    this.pieChart.update();
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

      const isDark = this.themeService.isDark();

      this.pieChart = new Chart(ctx, {
        type: 'doughnut', // Changed to doughnut for modern look
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
                this.getModernColor(index),
              ),
              borderWidth: 2,
              borderColor: isDark ? '#1a1a1a' : '#ffffff',
              borderRadius: 0,
              spacing: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          cutout: '70%', // Creates the donut hole
          animation: {
            animateRotate: true,
            animateScale: false,
            duration: 1000,
            easing: 'easeInOutQuart',
          },
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
              titleColor: isDark ? '#ffffff' : '#000000',
              bodyColor: isDark ? '#ffffff' : '#000000',
              borderColor: isDark ? '#333333' : '#e5e7eb',
              borderWidth: 1,
              padding: 12,
              displayColors: true,
              boxPadding: 4,
              cornerRadius: 8,
              caretSize: 0,
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

      console.log('Client usage donut chart initialized successfully');
    } catch (error) {
      console.error('Error initializing client usage chart:', error);
    }
  }
}
