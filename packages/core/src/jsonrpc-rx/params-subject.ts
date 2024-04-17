import { JsonrpcParams } from '../jsonrpc/jsonrpc-params';
import { Dispose, IDisposable } from './disposable';
import { ReturnPromiseEachItem } from '../util/return-promise.type';

export interface Publisher<Value = any> {
  next: (value?: Value) => void;
  error: (error: any) => void;
  complete: () => void;
}

export interface SubscribeHandler<Params extends JsonrpcParams, PublishValue = any> {
  (publisher: Publisher<PublishValue>, params: Params): Dispose;
}

export interface ParamsSubject {
  /**
   * 注册主题
   * @param subjectName 主题名称
   * @param subscribeHandler 订阅的逻辑处理（主题的逻辑）
   */
  onSubscribe<Params extends JsonrpcParams, PublishValue = any>(
    subjectName: string,
    subscribeHandler: SubscribeHandler<ReturnPromiseEachItem<Params>, PublishValue>,
  ): IDisposable;
}

/**
 *
 */
export function ensurePublisher(rawPublisher: Publisher): Publisher {
  let hasCompleted = false;

  return {
    next: (value: any) => {
      if (hasCompleted) return;
      rawPublisher.next(value);
    },
    error: (error: any) => {
      if (hasCompleted) return;
      rawPublisher.error(error);
    },
    complete: () => {
      if (hasCompleted) return;
      rawPublisher.complete();
      hasCompleted = true;
    },
  };
}
