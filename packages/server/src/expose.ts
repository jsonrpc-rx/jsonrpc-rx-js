import { HandlerConfig, Dispose, IJsonrpcServer, JsonrpcParams, Publisher, IDisposable } from '@jsonrpc-rx/core';

const REMOVE_PREFIX = 'remove';
type TO<T> = T;
type RemoveWrapper<T> = TO<{
  [K in keyof T as `${typeof REMOVE_PREFIX}${Capitalize<string & K>}`]: Dispose;
}>;
type ExtractPublisherGeneric<T> = T extends Publisher<infer R> ? R : any;

const subjectMarker = Symbol('subject');
const notifyMarker = Symbol('notify');
const firstUpper = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

export const asSubject = <T extends (publisher: Publisher, ...params: any[]) => Dispose>(subscribleHandler: T) => {
  (subscribleHandler as any)[subjectMarker] = true;
  return subscribleHandler as T;
};

export const asBehaviorSubject = <T extends (publisher: Publisher, ...params: any[]) => Dispose>(
  subscribleHandler: T,
  initialValue: ExtractPublisherGeneric<Parameters<T>[0]> | null,
) => {
  const behaviorSubscribleHandler = ((publisher: Publisher, ...params: any[]) => {
    publisher.next(initialValue);

    const behaviorNext: Publisher['next'] = (value) => {
      publisher.next(value);
      initialValue = value;
    };
    return subscribleHandler({ ...publisher, next: behaviorNext }, ...params);
  }) as T;
  (behaviorSubscribleHandler as any)[subjectMarker] = true;
  return behaviorSubscribleHandler;
};

export const asNotify = <F extends (...params: any[]) => void>(notifyHandler: F) => {
  (notifyHandler as any)[notifyMarker] = true;
  return notifyHandler as F;
};

export const expose = <R extends HandlerConfig>(jsonrpcServer: IJsonrpcServer, handlerConfig: R): RemoveWrapper<R> => {
  const disposes: any = {};

  for (const [name, handler] of Object.entries(handlerConfig)) {
    let disposable: IDisposable;
    if ((handler as any)[notifyMarker]) {
      const notifyWrapper = (params: JsonrpcParams) => handler(...(params as any[]));
      disposable = jsonrpcServer.onNotify(name, notifyWrapper);
    } else if ((handler as any)[subjectMarker]) {
      const subscribeWarpper = (publisher: Publisher, params: JsonrpcParams) => handler(publisher, ...(params as any[]));
      disposable = jsonrpcServer.onSubscribe(name, subscribeWarpper);
    } else {
      const callWrapper = (params: JsonrpcParams) => handler(...(params as any[]));
      disposable = jsonrpcServer.onCall(name, callWrapper);
    }
    disposes[REMOVE_PREFIX + firstUpper(name)] = disposable.dispose.bind(disposable);
  }

  return disposes;
};
