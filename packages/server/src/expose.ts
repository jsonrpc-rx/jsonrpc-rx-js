import { Dispose, IJsonrpcServer, Publisher } from '@jsonrpc-rx/core';

export type HandlerConfig = {
  onCall?: {
    [method: string]: (...params: any[]) => any;
  };
  onNotify?: {
    [notifyName: string]: (...params: any[]) => void;
  };
  onSubscribe?: {
    [subjectName: string]: (publisher: Publisher, ...params: any[]) => Dispose;
  };
};

const OFF_PREFIX = 'off';

type TO<T> = T;

type ToUnload<T> = TO<{
  [K in keyof T as `${typeof OFF_PREFIX}${Capitalize<string & K>}`]: Dispose;
}>;

type ToUnloadSecondStege<T> = TO<{
  [K in keyof T]: ToUnload<T[K]>;
}>;

const firstUpper = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

export const expose = <R extends HandlerConfig>(jsonrpcServer: IJsonrpcServer, handlerConfig: R): ToUnloadSecondStege<R> => {
  const onCallList = Object.entries(handlerConfig.onCall ?? {});
  const onNotifyList = Object.entries(handlerConfig.onNotify ?? {});
  const onSubscribeList = Object.entries(handlerConfig.onSubscribe ?? {});

  const disposes: any = {
    onCall: {},
    onNotify: {},
    onSubscribe: {},
  };

  for (const [method, callHandler] of onCallList) {
    disposes.onCall[OFF_PREFIX + firstUpper(method)] = jsonrpcServer.onCall(method, callHandler).dispose;
  }

  for (const [notifyName, notifyHandler] of onNotifyList) {
    disposes.onNotify[OFF_PREFIX + firstUpper(notifyName)] = jsonrpcServer.onNotify(notifyName, notifyHandler).dispose;
  }

  for (const [subjectName, subscribeHandler] of onSubscribeList) {
    const subscribeHandlerWarpper = (publisher: Publisher, ...params: any[]) => {
      return subscribeHandler(publisher, params);
    };
    disposes.onSubscribe[OFF_PREFIX + firstUpper(subjectName)] = jsonrpcServer.onSubscribe(subjectName, subscribeHandlerWarpper).dispose;
  }

  return disposes;
};

export const exposeOnCall = <R extends HandlerConfig['onCall']>(jsonrpcServer: IJsonrpcServer, handlerConfig: R): ToUnload<R> => {
  return expose(jsonrpcServer, { onCall: handlerConfig }).onCall;
};

export const exposeOnNotify = <R extends HandlerConfig['onNotify']>(jsonrpcServer: IJsonrpcServer, handlerConfig: R): ToUnload<R> => {
  return expose(jsonrpcServer, { onNotify: handlerConfig }).onNotify;
};

export const exposeOnSubscribe = <R extends HandlerConfig['onSubscribe']>(jsonrpcServer: IJsonrpcServer, handlerConfig: R): ToUnload<R> => {
  return expose(jsonrpcServer, { onSubscribe: handlerConfig }).onSubscribe;
};
