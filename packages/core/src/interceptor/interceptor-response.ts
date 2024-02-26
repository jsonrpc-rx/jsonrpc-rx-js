import { JsonrpcError } from 'src/jsonrpc/jsonrpc-error';
import { JsonrpcResponseBody } from 'src/jsonrpc/jsonrpc-response-body';

export interface ResponseInterceptor {
  (
    responseBody: JsonrpcResponseBody | undefined,
    error: JsonrpcError | undefined,
  ):  Promise<JsonrpcResponseBody> | JsonrpcResponseBody | Promise<JsonrpcError>;
}
