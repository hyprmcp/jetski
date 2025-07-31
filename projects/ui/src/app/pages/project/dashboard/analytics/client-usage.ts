export interface ClientUsageData {
  name: string;
  sessions: number;
}

export interface ClientUsage {
  totalSessions: number;
  clients: ClientUsageData[];
}

// Demo data for client usage
export const clientUsageDemoData: ClientUsage = {
  totalSessions: 12847,
  clients: [
    { name: 'cursor', sessions: 6680 },
    { name: 'chatgpt', sessions: 3597 },
    { name: 'claude_pro', sessions: 1927 },
    { name: 'other', sessions: 643 },
  ],
};
