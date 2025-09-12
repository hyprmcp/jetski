export interface PromptAnalytics {
  prompts: PromptAnalyticsItem[];
}

export interface PromptAnalyticsItem {
  id: string;
  toolName: string;
  prompt: string;
}
