export interface PerformingTool {
  name: string;
  calls: number;
  successRate: number;
  avgLatency: number;
}

export interface ToolsPerformance {
  topPerformingTools: PerformingTool[];
  toolsRequiringAttention: PerformingTool[];
}
