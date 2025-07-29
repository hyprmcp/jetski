export interface MCPServerLog {
  id: string;
  userAccountId?: string | null;
  mcpSessionId?: string | null;
  startedAt: string;
  duration: number;
  deploymentRevisionId: string;
  authTokenDigest?: string | null;
  mcpRequest?: JsonRpcRequest;
  mcpResponse?: JsonRcpResponse;
  userAgent?: string | null;
  httpStatusCode?: number | null;
  httpError?: string | null;
}

export interface JsonRpcRequest {
  method: string;
  params: JsonRpcParams;
  id: number;
}

export interface JsonRcpResponse {
  result: object;
  error: object;
}

export interface JsonRpcParams {
  name?: string;
}
