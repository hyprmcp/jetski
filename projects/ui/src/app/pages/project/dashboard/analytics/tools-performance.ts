export interface PerformingTool {
  name: string;
  totalCalls: number;
  errorRate: number;
  avgLatency: number;
}

export interface ToolsPerformance {
  topPerformingTools: PerformingTool[];
  toolsRequiringAttention: PerformingTool[];
}
