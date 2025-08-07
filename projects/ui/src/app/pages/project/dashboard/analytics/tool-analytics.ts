export interface ArgumentValue {
  name: string;
  count: number;
}

export interface ToolArgument {
  name: string;
  usageCount: number;
  values: ArgumentValue[];
}

export interface McpTool {
  name: string;
  calls: number;
  arguments: ToolArgument[];
}

export interface ToolAnalytics {
  tools: McpTool[];
}
