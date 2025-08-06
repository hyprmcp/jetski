export interface ParameterValue {
  name: string;
  count: number;
}

export interface ToolParameter {
  name: string;
  usageCount: number;
  values: ParameterValue[];
}

export interface McpTool {
  name: string;
  calls: number;
  parameters: ToolParameter[];
}

export interface ToolAnalytics {
  tools: McpTool[];
}
