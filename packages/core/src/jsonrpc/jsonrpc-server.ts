import { IDisposable } from '../jsonrpc-rx/disposable';
import { ParamsSubject } from '../jsonrpc-rx/params-subject';

export interface IJsonrpcServer extends ParamsSubject {
  /**
   * 处理调用
   * @param method 方法名称
   * @param callHandler 处理调用的逻辑
   */
  onCall: (method: string, callHandler: (params: any[] | object) => any) => IDisposable;

  /**
   * 响应通知
   * @param notifyName 通知名称
   * @param notifyHandler 通知的逻辑处理
   */
  onNotify: (notifyName: string, notifyHandler: (params: any[] | object) => void) => IDisposable;
}
