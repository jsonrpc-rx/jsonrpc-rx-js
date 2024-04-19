import { Dispose, IJsonrpcServer, Publisher } from '@jsonrpc-rx/core';

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

const OFF_PREFIX = 'remove';

type TO<T> = T;

type ToUnload<T> = TO<{
  [K in keyof T as `${typeof OFF_PREFIX}${Capitalize<string & K>}`]: Dispose;
}>;

type ToUnloadSecondStege<T> = TO<{
  [K in keyof T]: ToUnload<T[K]>;
}>;

const firstUpper = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

export const expose = <R extends HandlerConfig>(jsonrpcServer: IJsonrpcServer, handlerConfig: R): ToUnloadSecondStege<R> => {
  const onCallList = Object.entries(handlerConfig.call ?? {});
  const onNotifyList = Object.entries(handlerConfig.notify ?? {});
  const onSubscribeList = Object.entries(handlerConfig.subscribe ?? {});

  const disposes: any = {
    call: {},
    notify: {},
    subscribe: {},
  };

  for (const [method, callHandler] of onCallList) {
    disposes.call[OFF_PREFIX + firstUpper(method)] = jsonrpcServer.onCall(method, callHandler).dispose;
  }

  for (const [notifyName, notifyHandler] of onNotifyList) {
    disposes.notify[OFF_PREFIX + firstUpper(notifyName)] = jsonrpcServer.onNotify(notifyName, notifyHandler).dispose;
  }

  for (const [subjectName, subscribeHandler] of onSubscribeList) {
    const subscribeHandlerWarpper = (publisher: Publisher, ...params: any[]) => {
      return subscribeHandler(publisher, params);
    };
    disposes.subscribe[OFF_PREFIX + firstUpper(subjectName)] = jsonrpcServer.onSubscribe(subjectName, subscribeHandlerWarpper).dispose;
  }

  return disposes;
};

export const exposeCall = <R extends HandlerConfig['call']>(jsonrpcServer: IJsonrpcServer, handlerConfig: R): ToUnload<R> => {
  return expose(jsonrpcServer, { call: handlerConfig }).call;
};

export const exposeNotify = <R extends HandlerConfig['notify']>(jsonrpcServer: IJsonrpcServer, handlerConfig: R): ToUnload<R> => {
  return expose(jsonrpcServer, { notify: handlerConfig }).notify;
};

export const exposeSubscribe = <R extends HandlerConfig['subscribe']>(jsonrpcServer: IJsonrpcServer, handlerConfig: R): ToUnload<R> => {
  return expose(jsonrpcServer, { subscribe: handlerConfig }).subscribe;
};
