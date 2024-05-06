import { Callable, HandlerConfig, Notifiable, Observable, Observer, Promisify, PromisifyReturn, Publisher } from '@jsonrpc-rx/core';
import { JsonrpcClient } from './jsonrpc-client';

type To<T> = T;
type ObservableTypeMapper<T extends (args: any) => any> = T extends (publisher: Publisher<infer P>, ...args: infer A) => infer R
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
        : PromisifyReturn<T[K]>;
}>;

export const wrap = <T extends HandlerConfig>(jsonrpcClient: JsonrpcClient): HandlersTypeMapper<T> => {
  const proxyHandler: ProxyHandler<object> = {
    get: function (target, prop: string) {
      return (...params: any[]) => jsonrpcClient._unify(prop, params);
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
//   hello: asNotify(() => {
//     console.log('hello jsonrpc-rx');
//   }),
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
// };

// type HandlersType = typeof handlers;
// const remote = wrap<HandlersType>({} as any);
// remote.sum;
// remote.hello;
// remote.timer;
