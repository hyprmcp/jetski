export interface ClientUsageData {
  name: string;
  requests: number;
}

export interface ClientUsage {
  totalRequests: number;
  clients: ClientUsageData[];
}
