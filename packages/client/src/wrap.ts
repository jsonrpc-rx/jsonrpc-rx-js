import {
  Callable,
  ExposeMode,
  HandlerConfig,
  INNER_ONCALL_FOR_QUERY_MODE,
  Notifiable,
  Observable,
  Observer,
  Promisify,
  PromisifyReturn,
  Publisher,
} from '@jsonrpc-rx/core';
import { JsonrpcClient } from './jsonrpc-client';

type To<T> = T;

type ObservableTypeMapper<T extends (args: any) => any> = T extends (publisher: Publisher<infer P>, ...args: infer A) => infer R
  ? (observer: Observer<P>, ...rest: A) => Promisify<R>
  : PromisifyReturn<T>;

type DefaultTypeMapper<T extends { [key: string]: any }> = T extends () => unknown
  ? PromisifyReturn<T>
  : T extends (publisher: Publisher<infer P>, ...args: infer A) => infer R
    ? (observer: Observer<P>, ...rest: A) => Promisify<R>
    : PromisifyReturn<T>;

type NotifiableTypeMapper<T extends (args: any) => any> = To<(...params: Parameters<T>) => void>;

type CallableTypeMapper<T extends (args: any) => any> = To<(...params: Parameters<T>) => Promisify<ReturnType<T>>>;

type HandlersTypeMapper<T extends { [key: string]: any }> = To<{
  [K in keyof T]: T[K] extends Notifiable<any>
    ? NotifiableTypeMapper<T[K]>
    : T[K] extends Observable<any>
      ? ObservableTypeMapper<T[K]>
      : T[K] extends Callable<any>
        ? CallableTypeMapper<T[K]>
        : DefaultTypeMapper<T[K]>;
}>;

const unifyQueryModeMapKey = Symbol('unifyQueryModeMap');

export const wrap = <T extends HandlerConfig>(jsonrpcClient: JsonrpcClient): HandlersTypeMapper<T> => {
  if ((jsonrpcClient as any)[unifyQueryModeMapKey] == null) {
    (jsonrpcClient as any)[unifyQueryModeMapKey] = new Map();
  }

  const proxyHandler: ProxyHandler<object> = {
    get: function (_, name: string) {
      return async (...params: any[]) => {
        const unifyQueryModeMap = (jsonrpcClient as any)[unifyQueryModeMapKey] as Map<string, ExposeMode>;

        let mode: ExposeMode;
        if (unifyQueryModeMap.has(name)) {
          mode = unifyQueryModeMap.get(name)!;
        } else {
          mode = await jsonrpcClient.call<ExposeMode>(INNER_ONCALL_FOR_QUERY_MODE, [name]);
          unifyQueryModeMap.set(name, mode);
        }

        if (mode === 'subscribe') {
          const disposable = await jsonrpcClient[mode](name, params[0], params.slice(1));
          return disposable.dispose.bind(disposable);
        } else {
          return jsonrpcClient[mode](name, params);
        }
      };
    },
  };
  return new Proxy({}, proxyHandler) as any;
};

// export const handlers = {
//   sum: (a: number, b: number) => a + b,
//   upperCase: asCall((a: string) => a.toUpperCase()),
//   math: asCall(async (calculator: (...nums: number[]) => number, a: number, b: number) => {
//     return await calculator(a, b);
//   }),
//   hello: asNotify((a: string) => {
//     console.log('hello jsonrpc-rx');
//   }),
//   hello01: () => {
//     console.log('hello jsonrpc-rx');
//   },
//   timer: asSubject((publisher: Publisher<number>, maxSecond: number = 10) => {
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
//   timer01: asBehaviorSubject((publisher: Publisher<number>, maxSecond: number = 10) => {
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
//   timer02: (publisher: Publisher<number>, maxSecond: number = 10) => {
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
//   },
// };

// type HandlersType = typeof handlers;
// const remote = wrap<HandlersType>({} as any);
// remote.sum;
// remote.hello;
// remote.hello01;
// remote.timer;
// remote.timer02;
