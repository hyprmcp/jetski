export interface MCPServerLog {
  id: string;
  userAccountId?: string;
  mcpSessionId?: string;
  startedAt: string;
  duration: number;
  deploymentRevisionId: string;
  authTokenDigest?: string;
  mcpRequest?: JsonRpcRequest;
  mcpResponse?: JsonRcpResponse;
  userAgent?: string;
  httpStatusCode?: number;
  httpError?: string;
}

export interface MCPServerLogPromptData {
  id: string;
  startedAt: string;
  method: string;
  toolName: string;
  prompt: string;
}

export interface JsonRpcRequest {
  method: string;
  params: JsonRpcParams;
  id: number;
}

export interface JsonRcpResponse {
  result: unknown;
  error: unknown;
}

export interface JsonRpcParams {
  name?: string;
  arguments?: Record<string, unknown>;
  [key: string]: unknown;
}
