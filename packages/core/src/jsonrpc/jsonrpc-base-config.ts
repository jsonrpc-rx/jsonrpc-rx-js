import { toType } from 'src/util/to-type';
import { JsonrpcError } from './jsonrpc-error';
import { JsonrpcRequestBody } from './jsonrpc-request-body';
import { JsonrpcResponseBody } from './jsonrpc-response-body';
import { invokeAsPromise } from 'src/util/invoke-as-promise';

export interface RequestInterceptor {
  (requestBody: JsonrpcRequestBody): Promise<JsonrpcRequestBody | Error> | JsonrpcRequestBody;
}

export interface ResponseInterceptor {
  (responseBody: JsonrpcResponseBody): Promise<JsonrpcResponseBody | Error> | JsonrpcResponseBody;
}

export interface JsonrpcBaseConfig {
  requestInterceptors?: RequestInterceptor[];
  responseInterceptors?: ResponseInterceptor[];
}

export function isJsonrpcBaseConfig(jsonrpcBaseConfig?: JsonrpcBaseConfig): boolean {
  const { requestInterceptors, responseInterceptors } = jsonrpcBaseConfig ?? {};

  const isRequestInterceptors =
    requestInterceptors == null ||
    (toType(requestInterceptors) === 'array' && !!responseInterceptors?.every((item) => toType(item) === 'function'));
  const isResponseInterceptors =
    responseInterceptors == null ||
    (toType(responseInterceptors) === 'array' && !!responseInterceptors?.every((item) => toType(item) === 'function'));

  return isRequestInterceptors && isResponseInterceptors;
}

export function composeInterceptors<T extends RequestInterceptor | ResponseInterceptor>(interceptors: T[]): T {
  const interceptor = async (messageBody: any) => {
    let currResult = messageBody;
    for (const intercep of interceptors) {
      await invokeAsPromise(intercep, currResult);
    }
    return currResult;
  };

  return interceptor as any;
}
