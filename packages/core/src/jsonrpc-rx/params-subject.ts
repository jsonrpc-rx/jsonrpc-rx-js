import { Dispose, IDisposable } from './disposable';

// TODO 如何防止 complete 被重复调用，和实现 complete 被调用后的“idle”的能力
export interface Publisher {
  next: (value: any) => void;
  error: (error: any) => void;
  complete: () => void;
}

export interface SubscribeHandler {
  (publisher: Publisher, params?: any[] | object): Dispose;
}

export interface ParamsSubject {
  /**
   * 注册主题
   * @param subjectName 主题名称
   * @param subscribeHandler 订阅的逻辑处理（主题的逻辑）
   */
  onSubscribe(subjectName: string, subscribeHandler: SubscribeHandler): IDisposable;
}

/**
 *
 */
export function ensurePublisher(rawPublisher: Publisher) {
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
