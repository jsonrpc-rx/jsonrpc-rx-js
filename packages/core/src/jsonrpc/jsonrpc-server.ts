import { PromisifyReturnEach } from '../util/promisify.type';
import { IDisposable } from '../jsonrpc-rx/disposable';
import { ParamsSubject } from '../jsonrpc-rx/params-subject';
import { JsonrpcParams } from './jsonrpc-params';

export interface IJsonrpcServer extends ParamsSubject {
  /**
   * 处理调用
   * @param method 方法名称
   * @param callHandler 处理调用的逻辑
   */
  onCall: <Params extends JsonrpcParams>(method: string, callHandler: (params?: PromisifyReturnEach<Params>) => any) => IDisposable;

  /**
   * 响应通知
   * @param notifyName 通知名称
   * @param notifyHandler 通知的逻辑处理
   */
  onNotify: <Params extends JsonrpcParams>(notifyName: string, notifyHandler: (params?: PromisifyReturnEach<Params>) => void) => IDisposable;
}
