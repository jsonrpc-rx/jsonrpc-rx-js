import { JsonrpcRequestBody } from 'src/jsonrpc/jsonrpc-request-body';
import { JsonrpcResponseBody } from 'src/jsonrpc/jsonrpc-response-body';

export type MessageBody = JsonrpcRequestBody | JsonrpcResponseBody;

export function isJsonrpcRequestBody(messageBody: MessageBody) {
  return !!(messageBody as JsonrpcRequestBody).method;
}

export function isJsonrpcResponseBody(messageBody: MessageBody) {
  return !(messageBody as any).method;
}
