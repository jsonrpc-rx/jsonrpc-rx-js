import { MessageBody } from '../message/message-body';
import { JsonrpcEnd } from '../jsonrpc/jsonrpc-end';
import { MessageType } from '../message/message-type';
import { invokeAsPromise } from '../util/invoke-as-promise';
import { toType } from '../util/to-type';
import { MessageSender } from 'src/message/message-sender';
import { MessageReceiver } from 'src/message/message-receiver';

export type InterceptorEnvInfo = { end: JsonrpcEnd; type: MessageType; messageSender?: MessageSender; messageReceiver?: MessageReceiver };

export type InterceptorSafeContext<T extends { [key: string | number | symbol]: any } = { [key: string | number | symbol]: any }> = T;

export interface Interceptor {
  (
    envInfo: InterceptorEnvInfo,
    safeContext: InterceptorSafeContext,
  ): ((messageBody: MessageBody) => Promise<MessageBody> | MessageBody | void) | void;
}

export function composeInterceptors(interceptorInfo: { interceptor: Interceptor; envInfo: InterceptorEnvInfo; safeContext: object }[]) {
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
