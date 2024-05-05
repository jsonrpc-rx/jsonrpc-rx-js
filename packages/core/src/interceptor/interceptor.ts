import { MessageBody } from '../message/message-body';
import { JsonrpcEnd } from '../jsonrpc/jsonrpc-end';
import { MessageType } from '../message/message-type';
import { invokeAsPromise } from '../util/invoke-as-promise';
import { toType } from '../util/to-type';

export type InterceptorEnvInfo = { end: JsonrpcEnd; type: MessageType; sendMessage?: (messageBody: MessageBody) => void };

export type InterceptorSafeContext<T = any> = T;
export interface Interceptor<C = any> {
  (
    envInfo: InterceptorEnvInfo,
    safeContext: InterceptorSafeContext<C>,
  ): ((messageBody: MessageBody) => Promise<MessageBody> | MessageBody | void) | void;
}

export function composeInterceptors(interceptorInfo: { interceptor: Interceptor; envInfo: InterceptorEnvInfo; safeContext: any }[]) {
  const actualInterceptors = interceptorInfo
    .map(({ interceptor, envInfo, safeContext }) => interceptor.call({}, envInfo, safeContext))
    .filter((item) => toType(item) === 'function');
  return composeAsPromise(actualInterceptors as any);
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
