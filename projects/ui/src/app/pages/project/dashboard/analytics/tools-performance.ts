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

// Demo data for tools performance
export const toolsPerformanceDemoData: ToolsPerformance = {
  topPerformingTools: [
    {
      name: 'Code Generation',
      calls: 2847,
      successRate: 98.2,
      avgLatency: 156,
    },
    {
      name: 'Chat Completion',
      calls: 1923,
      successRate: 99.1,
      avgLatency: 234,
    },
    {
      name: 'File Operations',
      calls: 1456,
      successRate: 97.8,
      avgLatency: 89,
    },
  ],
  toolsRequiringAttention: [
    {
      name: 'Database Operations',
      calls: 892,
      successRate: 85.2,
      avgLatency: 342,
    },
    {
      name: 'External API Calls',
      calls: 567,
      successRate: 91.3,
      avgLatency: 567,
    },
  ],
};
