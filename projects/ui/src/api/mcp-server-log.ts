export interface MCPServerLog {
  id: string;
  userAccountId?: string | null;
  mcpSessionId?: string | null;
  startedAt: string;
  duration: number;
  deploymentRevisionId: string;
  authTokenDigest?: string | null;
  mcpRequest?: any;
  mcpResponse?: any;
  userAgent?: string | null;
  httpStatusCode?: number | null;
  httpError?: string | null;
}

