import { Dispose, IJsonrpcClient, Publisher, ReturnPromiseEachItem } from '@jsonrpc-rx/core';

export type HandlerConfig = {
  call?: {
    [method: string]: (...params: any[]) => any;
  };
  notify?: {
    [notifyName: string]: (...params: any[]) => void;
  };
  subscribe?: {
    [subjectName: string]: (publisher: Publisher, ...params: any[]) => Dispose;
  };
};

export type HandlerConfigReturnPromise<T extends HandlerConfig> = {
  [K in keyof T]: K extends 'call' ? ReturnPromiseEachItem<T[K]> : T[K];
};

export const wrap = <T extends HandlerConfig>(jsonrpcClient: IJsonrpcClient): HandlerConfigReturnPromise<T> => {
  const proxyHandler: ProxyHandler<object> = {
    get: function (target: { method: 'call' | 'notify' | 'subscribe' }, prop: string) {
      return (...params: any[]) => {
        switch (target.method) {
          case 'call':
            return jsonrpcClient.call(prop, params);
          case 'notify':
            return jsonrpcClient.notify(prop, params);
          case 'subscribe':
            return jsonrpcClient.subscribe(prop, params?.[0], params?.slice(1));
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

export const wrapCall = <T extends HandlerConfig['call']>(jsonrpcClient: IJsonrpcClient): ReturnPromiseEachItem<T> => {
  return wrap(jsonrpcClient).call as any;
};

export const wrapNotify = <T extends HandlerConfig['notify']>(jsonrpcClient: IJsonrpcClient): T => {
  return wrap(jsonrpcClient).notify as any;
};

export const wrapSubscribe = <T extends HandlerConfig['subscribe']>(jsonrpcClient: IJsonrpcClient): T => {
  return wrap(jsonrpcClient).subscribe as any;
};
