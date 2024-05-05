import { HandlerConfig, Observer, Promisify, PromisifyReturn, Publisher } from '@jsonrpc-rx/core';
import { JsonrpcClient } from './jsonrpc-client';

type To<T> = T;
type TypeMapper<T extends { [key: string]: any }> = To<{
  [K in keyof T]: T[K] extends (publisher: Publisher<infer T>, ...args: infer A) => infer R
    ? (observer: Observer<T>, ...rest: A) => Promisify<R>
    : PromisifyReturn<T[K]>;
}>;

export const wrap = <T extends HandlerConfig>(jsonrpcClient: JsonrpcClient): TypeMapper<T> => {
  const proxyHandler: ProxyHandler<object> = {
    get: function (target, prop: string) {
      return (...params: any[]) => jsonrpcClient.$unify(prop, params);
    },
  };
  return new Proxy({}, proxyHandler) as any;
};

// const handlerConfig: {
//   sum: (a: number, b: number) => any;
//   upperCase: (a: string) => Promise<string>;
//   hello: (content: string) => string;
//   tick01: ({ next }: Publisher<string>, token: string) => () => void;
//   tick02: ( publisher: { error: (v : number) => void }, token: string) => () => void;
// } = {} as any;

// const remote = wrap<typeof handlerConfig>({} as any);
// remote.sum;
// remote.hello;
// remote.tick02;
