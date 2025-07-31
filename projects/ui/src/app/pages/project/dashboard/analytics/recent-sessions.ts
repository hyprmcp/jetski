export interface RecentSession {
  sessionId: string;
  user: string;
  duration: string;
  calls: number;
  errors: number;
  lastToolCall: string;
  startedAgo: string;
}

export interface RecentSessions {
  sessions: RecentSession[];
}

// Demo data for recent sessions
export const recentSessionsDemoData: RecentSessions = {
  sessions: [
    {
      sessionId: 'sess_abc123',
      user: 'john.doe@example.com',
      duration: '2m 34s',
      calls: 12,
      errors: 0,
      lastToolCall: 'get_weather',
      startedAgo: '2 minutes ago',
    },
    {
      sessionId: 'sess_def456',
      user: 'jane.smith@example.com',
      duration: '1m 47s',
      calls: 8,
      errors: 1,
      lastToolCall: 'code_generation',
      startedAgo: '5 minutes ago',
    },
    {
      sessionId: 'sess_ghi789',
      user: 'mike.wilson@example.com',
      duration: '3m 12s',
      calls: 15,
      errors: 0,
      lastToolCall: 'file_operations',
      startedAgo: '8 minutes ago',
    },
  ],
};
