import { MessageBody } from '../message/message-body';
import { JsonrpcEnd } from '../jsonrpc/jsonrpc-end';
import { MessageType } from '../message/message-type';
import { invokeAsPromise } from '../util/invoke-as-promise';
import { toType } from '../util/to-type';

export type InterceptorEnvInfo = { end: JsonrpcEnd; type: MessageType };

export interface Interceptor {
  (envInfo: InterceptorEnvInfo): ((messageBody: MessageBody) => Promise<MessageBody> | MessageBody | void) | void;
}

export function composeInterceptors(interceptors: Interceptor[], envInfo: InterceptorEnvInfo) {
  const actualInterceptors = interceptors.map((item) => item.call({}, envInfo)).filter((item) => toType(item) === 'function');
  return composeAsPromise(actualInterceptors as unknown as Interceptor[]);
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
