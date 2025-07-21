export interface MCPServerLog {
  id: string;
  userAccountId?: string | null;
  mcpSessionId?: string | null;
  startedAt: string;
  duration: number;
  deploymentRevisionId: string;
  authTokenDigest?: string | null;
  mcpRequest?: JsonRpcRequest;
  mcpResponse?: any;
  userAgent?: string | null;
  httpStatusCode?: number | null;
  httpError?: string | null;
}

export interface JsonRpcRequest {
  jsonrpc: string;
  method: string;
  params: any;
  id: number;
}

