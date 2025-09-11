export interface ClientUsageData {
  name: string;
  requests: number;
}

export interface ClientUsage {
  totalSessions: number;
  clients: ClientUsageData[];
}
