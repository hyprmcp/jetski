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

// Demo data for tool analytics
export const toolAnalyticsDemoData: ToolAnalytics = {
  tools: [
    {
      name: 'get_weather',
      calls: 1053,
      parameters: [
        {
          name: 'location',
          usageCount: 900,
          values: [
            { name: 'new_york', count: 523 },
            { name: 'san_francisco', count: 442 },
            { name: 'berlin', count: 88 },
          ],
        },
        {
          name: 'time',
          usageCount: 950,
          values: [
            { name: 'today', count: 821 },
            { name: 'tomorrow', count: 126 },
            { name: 'next_week', count: 106 },
          ],
        },
        {
          name: 'temperature_unit',
          usageCount: 750,
          values: [
            { name: 'celsius', count: 684 },
            { name: 'fahrenheit', count: 369 },
          ],
        },
      ],
    },
    {
      name: 'code_generation',
      calls: 2847,
      parameters: [
        {
          name: 'language',
          usageCount: 2500,
          values: [
            { name: 'javascript', count: 1281 },
            { name: 'python', count: 911 },
            { name: 'typescript', count: 512 },
            { name: 'go', count: 143 },
          ],
        },
        {
          name: 'framework',
          usageCount: 2200,
          values: [
            { name: 'react', count: 1082 },
            { name: 'angular', count: 712 },
            { name: 'vue', count: 626 },
            { name: 'svelte', count: 427 },
          ],
        },
        {
          name: 'component_type',
          usageCount: 1800,
          values: [
            { name: 'ui_component', count: 1480 },
            { name: 'api_endpoint', count: 797 },
            { name: 'utility_function', count: 570 },
          ],
        },
        {
          name: 'complexity',
          usageCount: 2600,
          values: [
            { name: 'simple', count: 1139 },
            { name: 'medium', count: 1281 },
            { name: 'complex', count: 427 },
          ],
        },
      ],
    },
    {
      name: 'file_operations',
      calls: 1456,
      parameters: [
        {
          name: 'operation_type',
          usageCount: 1400,
          values: [
            { name: 'read', count: 801 },
            { name: 'write', count: 437 },
            { name: 'delete', count: 218 },
          ],
        },
        {
          name: 'file_type',
          usageCount: 1200,
          values: [
            { name: 'text_files', count: 655 },
            { name: 'json', count: 510 },
            { name: 'images', count: 291 },
          ],
        },
      ],
    },
    {
      name: 'database_query',
      calls: 892,
      parameters: [
        {
          name: 'query_type',
          usageCount: 850,
          values: [
            { name: 'select', count: 624 },
            { name: 'insert', count: 134 },
            { name: 'update', count: 89 },
            { name: 'delete', count: 45 },
          ],
        },
        {
          name: 'database',
          usageCount: 750,
          values: [
            { name: 'postgresql', count: 401 },
            { name: 'mysql', count: 268 },
            { name: 'mongodb', count: 223 },
          ],
        },
        {
          name: 'table_size',
          usageCount: 650,
          values: [
            { name: 'small_1k_rows', count: 357 },
            { name: 'medium_1k_100k', count: 401 },
            { name: 'large_100k', count: 134 },
          ],
        },
      ],
    },
    {
      name: 'api_request',
      calls: 567,
      parameters: [
        {
          name: 'http_method',
          usageCount: 550,
          values: [
            { name: 'get', count: 340 },
            { name: 'post', count: 142 },
            { name: 'put', count: 57 },
            { name: 'delete', count: 28 },
          ],
        },
        {
          name: 'api_type',
          usageCount: 500,
          values: [
            { name: 'rest', count: 425 },
            { name: 'graphql', count: 113 },
            { name: 'websocket', count: 29 },
          ],
        },
        {
          name: 'response_format',
          usageCount: 520,
          values: [
            { name: 'json', count: 482 },
            { name: 'xml', count: 57 },
            { name: 'text', count: 28 },
          ],
        },
      ],
    },
    {
      name: 'image_processing',
      calls: 234,
      parameters: [
        {
          name: 'operation',
          usageCount: 220,
          values: [
            { name: 'resize', count: 94 },
            { name: 'crop', count: 70 },
            { name: 'filter', count: 47 },
            { name: 'convert', count: 23 },
          ],
        },
        {
          name: 'format',
          usageCount: 200,
          values: [
            { name: 'jpeg', count: 117 },
            { name: 'png', count: 82 },
            { name: 'webp', count: 35 },
          ],
        },
        {
          name: 'quality',
          usageCount: 180,
          values: [
            { name: 'high', count: 105 },
            { name: 'medium', count: 94 },
            { name: 'low', count: 35 },
          ],
        },
        {
          name: 'size',
          usageCount: 190,
          values: [
            { name: 'small_1mb', count: 140 },
            { name: 'medium_1_5mb', count: 70 },
            { name: 'large_5mb', count: 24 },
          ],
        },
      ],
    },
    {
      name: 'text_analysis',
      calls: 1891,
      parameters: [
        {
          name: 'analysis_type',
          usageCount: 1800,
          values: [
            { name: 'sentiment', count: 662 },
            { name: 'keywords', count: 567 },
            { name: 'summarization', count: 378 },
            { name: 'translation', count: 284 },
          ],
        },
        {
          name: 'language',
          usageCount: 1650,
          values: [
            { name: 'english', count: 1324 },
            { name: 'spanish', count: 284 },
            { name: 'french', count: 189 },
            { name: 'german', count: 94 },
          ],
        },
        {
          name: 'text_length',
          usageCount: 1500,
          values: [
            { name: 'short_100_chars', count: 473 },
            { name: 'medium_100_500', count: 946 },
            { name: 'long_500_chars', count: 472 },
          ],
        },
        {
          name: 'output_format',
          usageCount: 1700,
          values: [
            { name: 'json', count: 1135 },
            { name: 'text', count: 473 },
            { name: 'csv', count: 283 },
          ],
        },
        {
          name: 'confidence_level',
          usageCount: 1400,
          values: [
            { name: 'high_90', count: 851 },
            { name: 'medium_70_90', count: 756 },
            { name: 'low_70', count: 284 },
          ],
        },
      ],
    },
    {
      name: 'data_visualization',
      calls: 445,
      parameters: [
        {
          name: 'chart_type',
          usageCount: 400,
          values: [
            { name: 'bar_chart', count: 156 },
            { name: 'line_chart', count: 111 },
            { name: 'pie_chart', count: 89 },
            { name: 'scatter_plot', count: 67 },
            { name: 'heatmap', count: 22 },
          ],
        },
        {
          name: 'data_source',
          usageCount: 350,
          values: [
            { name: 'csv', count: 178 },
            { name: 'json', count: 156 },
            { name: 'database', count: 111 },
          ],
        },
        {
          name: 'output_format',
          usageCount: 380,
          values: [
            { name: 'png', count: 223 },
            { name: 'svg', count: 134 },
            { name: 'pdf', count: 88 },
          ],
        },
        {
          name: 'theme',
          usageCount: 320,
          values: [
            { name: 'light', count: 267 },
            { name: 'dark', count: 134 },
            { name: 'custom', count: 44 },
          ],
        },
        {
          name: 'interactivity',
          usageCount: 300,
          values: [
            { name: 'static', count: 200 },
            { name: 'interactive', count: 178 },
            { name: 'animated', count: 67 },
          ],
        },
        {
          name: 'size',
          usageCount: 280,
          values: [
            { name: 'small', count: 134 },
            { name: 'medium', count: 200 },
            { name: 'large', count: 111 },
          ],
        },
      ],
    },
  ],
};
