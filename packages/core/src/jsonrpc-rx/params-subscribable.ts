import { JsonrpcParams } from '../jsonrpc/jsonrpc-params';
import { toType } from '../util/to-type';
import { IDisposable } from './disposable';

export interface Observer<T = any> {
  next: (value: T) => void;
  error?: (error: any) => void;
  complete?: () => void;
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
  const { next, error, complete } = observer ?? {};

  return (
    toType(observer) === 'object' &&
    toType(next) === 'function' &&
    (toType(error) === 'function' || error == null) &&
    (toType(complete) === 'function' || complete == null)
  );
}
