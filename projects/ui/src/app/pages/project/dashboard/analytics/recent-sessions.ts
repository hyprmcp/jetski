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
