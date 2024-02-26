import { JsonrpcError } from 'src/jsonrpc/jsonrpc-error';
import { JsonrpcRequestBody } from 'src/jsonrpc/jsonrpc-request-body';

export interface RequestInterceptor {
  (
    requestBody: JsonrpcRequestBody | undefined,
    error: JsonrpcError | undefined,
  ): Promise<JsonrpcRequestBody> | JsonrpcRequestBody | Promise<JsonrpcError>;
}
