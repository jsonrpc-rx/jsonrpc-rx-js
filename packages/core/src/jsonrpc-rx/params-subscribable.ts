import { JsonrpcParams } from '../jsonrpc/jsonrpc-params';
import { toType } from '../util/to-type';
import { IDisposable } from './disposable';

export interface Observer<T = any> {
  onNext: (value: T) => void;
  onError?: (error: any) => void;
  onComplete?: () => void;
}

export interface ParamsSubscribable {
  /**
   * 订阅
   * @param method 订阅名称
   * @param params 订阅参数
   */
  subscribe<NextValue>(subjectName: string, observer: Observer<NextValue>, params: JsonrpcParams): Promise<IDisposable>;
}

export function isObserver(observer: Observer): boolean {
  const { onNext, onError, onComplete } = observer ?? {};

  return (
    toType(observer) === 'object' &&
    toType(onNext) === 'function' &&
    (toType(onError) === 'function' || onError == null) &&
    (toType(onComplete) === 'function' || onComplete == null)
  );
}
