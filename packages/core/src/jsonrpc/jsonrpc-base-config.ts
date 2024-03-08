import { toType } from '../util/to-type';
import { JsonrpcRequestBody } from './jsonrpc-request-body';
import { JsonrpcResponseBody } from './jsonrpc-response-body';
import { invokeAsPromise } from '../util/invoke-as-promise';

export interface Interceptor<T extends JsonrpcRequestBody | JsonrpcResponseBody> {
  (messageBody: T): Promise<T> | T | void;
}

export interface RequestInterceptor extends Interceptor<JsonrpcRequestBody> {}

export interface ResponseInterceptor extends Interceptor<JsonrpcResponseBody> {}

export interface JsonrpcBaseConfig {
  requestInterceptors?: RequestInterceptor[];
  responseInterceptors?: ResponseInterceptor[];
}

export function isJsonrpcBaseConfig(jsonrpcBaseConfig?: JsonrpcBaseConfig): boolean {
  const { requestInterceptors, responseInterceptors } = jsonrpcBaseConfig ?? {};

  const isRequestInterceptors =
    requestInterceptors == null ||
    (toType(requestInterceptors) === 'array' && !!requestInterceptors?.every((item) => toType(item) === 'function'));
  const isResponseInterceptors =
    responseInterceptors == null ||
    (toType(responseInterceptors) === 'array' && !!responseInterceptors?.every((item) => toType(item) === 'function'));

  return isRequestInterceptors && isResponseInterceptors;
}

export function composeInterceptors<T extends JsonrpcRequestBody | JsonrpcResponseBody>(interceptors: Interceptor<T>[]) {
  return composeAsPromise(interceptors) as Interceptor<T>;
}

export function composeAsPromise(funcs: ((arg: any) => Promise<any> | any)[]) {
  const finalFunc = async (param: any) => {
    let currResult = param;
    for (const func of funcs) {
      currResult = await invokeAsPromise(func, currResult);
    }
    return currResult;
  };

  return finalFunc;
}
