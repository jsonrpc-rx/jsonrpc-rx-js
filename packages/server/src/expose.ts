import { HandlerConfig, Dispose, IJsonrpcServer, JsonrpcParams, Publisher } from '@jsonrpc-rx/core';

const REMOVE_PREFIX = 'remove';

type TO<T> = T;

type RemoveWrapper<T> = TO<{
  [K in keyof T as `${typeof REMOVE_PREFIX}${Capitalize<string & K>}`]: Dispose;
}>;

type RemoveItemWrapper<T> = TO<{
  [K in keyof T]: RemoveWrapper<T[K]>;
}>;

const firstUpper = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

export const expose = <R extends HandlerConfig>(jsonrpcServer: IJsonrpcServer, handlerConfig: R): RemoveItemWrapper<R> => {
  const onCallList = Object.entries(handlerConfig.call ?? {});
  const onNotifyList = Object.entries(handlerConfig.notify ?? {});
  const onSubscribeList = Object.entries(handlerConfig.subscribe ?? {});

  const disposes: any = {
    call: {},
    notify: {},
    subscribe: {},
  };

  for (const [method, callHandler] of onCallList) {
    const callWrapper = (params: JsonrpcParams) => callHandler(...(params as any[]));
    disposes.call[REMOVE_PREFIX + firstUpper(method)] = jsonrpcServer.onCall(method, callWrapper).dispose;
  }

  for (const [notifyName, notifyHandler] of onNotifyList) {
    const notifyWrapper = (params: JsonrpcParams) => notifyHandler(...(params as any[]));
    disposes.notify[REMOVE_PREFIX + firstUpper(notifyName)] = jsonrpcServer.onNotify(notifyName, notifyWrapper).dispose;
  }

  for (const [subjectName, subscribeHandler] of onSubscribeList) {
    const subscribeWarpper = (publisher: Publisher, params: JsonrpcParams) => subscribeHandler(publisher, ...(params as any[]));
    disposes.subscribe[REMOVE_PREFIX + firstUpper(subjectName)] = jsonrpcServer.onSubscribe(subjectName, subscribeWarpper).dispose;
  }

  return disposes;
};

export const exposeCall = <R extends HandlerConfig['call']>(jsonrpcServer: IJsonrpcServer, handlerConfig: R): RemoveWrapper<R> => {
  return expose(jsonrpcServer, { call: handlerConfig }).call;
};

export const exposeNotify = <R extends HandlerConfig['notify']>(jsonrpcServer: IJsonrpcServer, handlerConfig: R): RemoveWrapper<R> => {
  return expose(jsonrpcServer, { notify: handlerConfig }).notify;
};

export const exposeSubscribe = <R extends HandlerConfig['subscribe']>(
  jsonrpcServer: IJsonrpcServer,
  handlerConfig: R,
): RemoveWrapper<R> => {
  return expose(jsonrpcServer, { subscribe: handlerConfig }).subscribe;
};
