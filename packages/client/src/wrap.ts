import { HandlerConfig, IJsonrpcClient, Observer, Publisher, ReturnPromiseEachItem } from '@jsonrpc-rx/core';

type TO<T> = T;

type CallWrapper<T> = ReturnPromiseEachItem<T>;

type NotifyWrapper<T extends { [key: string]: any }> = TO<{
  [K in keyof T]: (...args: Parameters<T[K]>) => void;
}>;

type SubscribeWrapper<T extends { [key: string]: any }> = TO<{
  [K in keyof T]: T[K] extends (publisher: Publisher<infer T>, ...args: infer A) => infer R
    ? (observer: Observer<T>, ...rest: A) => Promise<R>
    : never;
}>;

export type HandlerConfigWrapper<T extends HandlerConfig> = TO<{
  [K in keyof T]: K extends 'call'
    ? CallWrapper<T[K]>
    : K extends 'notify'
      ? NotifyWrapper<NonNullable<T[K]>>
      : K extends 'subscribe'
        ? SubscribeWrapper<NonNullable<T[K]>>
        : T[K];
}>;

export const wrap = <T extends HandlerConfig>(jsonrpcClient: IJsonrpcClient): HandlerConfigWrapper<T> => {
  const proxyHandler: ProxyHandler<object> = {
    get: function (target: { method: 'call' | 'notify' | 'subscribe' }, prop: string) {
      return async (...params: any[]) => {
        switch (target.method) {
          case 'call':
            return jsonrpcClient.call(prop, params);
          case 'notify':
            return jsonrpcClient.notify(prop, params);
          case 'subscribe':
            return (await jsonrpcClient.subscribe(prop, params?.[0], params?.slice(1))).dispose;
        }
      };
    },
  };

  return {
    call: new Proxy({ method: 'call' }, proxyHandler),
    notify: new Proxy({ method: 'notify' }, proxyHandler),
    subscribe: new Proxy({ method: 'subscribe' }, proxyHandler),
  } as any;
};

export const wrapCall = <T extends HandlerConfig['call']>(jsonrpcClient: IJsonrpcClient): CallWrapper<T> => {
  return wrap(jsonrpcClient).call as any;
};

export const wrapNotify = <T extends HandlerConfig['notify']>(jsonrpcClient: IJsonrpcClient): NotifyWrapper<NonNullable<T>> => {
  return wrap(jsonrpcClient).notify as any;
};

export const wrapSubscribe = <T extends HandlerConfig['subscribe']>(jsonrpcClient: IJsonrpcClient): SubscribeWrapper<NonNullable<T>> => {
  return wrap(jsonrpcClient).subscribe as any;
};

// const config = {
//   call: {
//     sum: (a: number, b: number) => {
//       return a + b;
//     },
//     upperCase: (a: string) => Promise.resolve(a.toUpperCase()),
//   },
//   notify: {
//     hello: (a: string) => a,
//   },
//   subscribe: {
//     tick: (publisher: Publisher<number>, other: string, three: number) => () => {},
//   },
// };
// const remote = wrap<typeof config>({} as any);
// remote.call.sum;
// remote.notify.hello;
// remote.subscribe.tick;
