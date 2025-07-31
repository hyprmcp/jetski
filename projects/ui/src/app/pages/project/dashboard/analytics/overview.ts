export interface Overview {
  totalSessionCount: number;
  totalSessionChange: number;
  totalToolCallsCount: number;
  totalToolCallsChange: number;
  usersCount: number;
  usersChange: number;
  avgLatencyValue: number;
  avgLatencyChange: number;
  errorRateValue: number;
  errorRateChange: number;
}

// Demo data for overview cards
export const projectAnalyticsOverviewDemoData: Overview = {
  totalSessionCount: 12847,
  totalSessionChange: 0.125,
  totalToolCallsCount: 89234,
  totalToolCallsChange: 0.082,
  usersCount: 1247,
  usersChange: 0.153,
  avgLatencyValue: 142,
  avgLatencyChange: 0.053,
  errorRateValue: 0.008,
  errorRateChange: -0.003,
};
