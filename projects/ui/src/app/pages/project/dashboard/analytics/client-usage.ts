export interface ClientUsageData {
  name: string;
  sessions: number;
}

export interface ClientUsage {
  totalSessions: number;
  clients: ClientUsageData[];
}
