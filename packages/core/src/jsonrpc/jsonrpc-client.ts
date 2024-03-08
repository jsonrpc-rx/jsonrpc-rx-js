import { ParamsSubscribable } from '../jsonrpc-rx/params-subscribable';
import { JsonrpcParams } from './jsonrpc-params';

export interface IJsonrpcClient extends ParamsSubscribable {
  /**
   * 调用
   * @param method 方法名称
   * @param params 方法参数
   * @returns 调用结果 (Promise)
   */
  call: <ReplyValue>(method: string, params: JsonrpcParams) => Promise<ReplyValue>;

  /**
   * 通知
   * @param notifyName 通知名称
   * @param params 通知参数
   */
  notify: (notifyName: string, params: JsonrpcParams) => void;
}
