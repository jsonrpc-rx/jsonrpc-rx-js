import {
  HandlerConfig,
  Dispose,
  IJsonrpcServer,
  JsonrpcParams,
  Publisher,
  IDisposable,
  Observable,
  Notifiable,
  Callable,
} from '@jsonrpc-rx/core';

const REMOVE_PREFIX = 'remove';
type TO<T> = T;
type RemoveWrapper<T> = TO<{
  [K in keyof T as `${typeof REMOVE_PREFIX}${Capitalize<string & K>}`]: Dispose;
}>;
type ExtractPublisherGeneric<T> = T extends Publisher<infer R> ? R : any;

const subjectMarker = Symbol('subject');
const notifyMarker = Symbol('notify');
const callMarker = Symbol('call');
const firstUpper = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

export const asSubject = <T extends (publisher: Publisher, ...params: any[]) => Dispose>(subscribleHandler: T) => {
  (subscribleHandler as any)[subjectMarker] = true;
  return subscribleHandler as unknown as Observable<T>;
};

export const asBehaviorSubject = <T extends (publisher: Publisher, ...params: any[]) => Dispose>(
  subscribleHandler: T,
  initialValue: ExtractPublisherGeneric<Parameters<T>[0]> | null,
) => {
  const behaviorSubscribleHandler = ((publisher: Publisher, ...params: any) => {
    publisher.next(initialValue);

    const behaviorNext: Publisher['next'] = (value) => {
      publisher.next(value);
      initialValue = value;
    };
    return subscribleHandler({ ...publisher, next: behaviorNext }, ...params);
  }) as T;
  (behaviorSubscribleHandler as any)[subjectMarker] = true;
  return behaviorSubscribleHandler as unknown as Observable<T>;
};

export const asNotify = <F extends (param?: any, ...params: any[]) => void>(notifyHandler: F) => {
  (notifyHandler as any)[notifyMarker] = true;
  return notifyHandler as unknown as Notifiable<F>;
};

export const asCall = <F extends (param?: any, ...params: any[]) => any>(callHandler: F) => {
  (callHandler as any)[callMarker] = true;
  return callHandler as unknown as Callable<F>;
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

// export const handlers = {
//   sum: (a: number, b: number) => a + b,
//   upperCase: asCall((a: string) => a.toUpperCase()),
//   math: asCall(async (calculator: (...nums: number[]) => number, a: number, b: number) => {
//     return await calculator(a, b);
//   }),
//   hello: asNotify(() => {
//     console.log('hello jsonrpc-rx');
//   }),
//   timer: asSubject((publisher: Publisher<number>, maxSecond = 10) => {
//     let second = 0;
//     const interval = setInterval(() => {
//       if (++second > maxSecond) {
//         clearInterval(interval);
//         publisher.complete();
//         return;
//       }
//       publisher.next(second);
//     }, 1000);
//     return () => {
//       clearInterval(interval);
//     };
//   }),
//   timer01: asBehaviorSubject((publisher: Publisher<number>, maxSecond = 10) => {
//     let second = 0;
//     const interval = setInterval(() => {
//       if (++second > maxSecond) {
//         clearInterval(interval);
//         publisher.complete();
//         return;
//       }
//       publisher.next(second);
//     }, 1000);
//     return () => {
//       clearInterval(interval);
//     };
//   }, 0),
// };
