export interface RecentSession {
  sessionId: string;
  user: string;
  calls: number;
  errors: number;
  lastToolCall: string;
  startedAt: string;
  endedAt: string;
}

export interface RecentSessions {
  sessions: RecentSession[];
}
