import { ParamsSubscribable } from 'src/jsonrpc-rx/params-subscribable';

export interface IJsonrpcClient extends ParamsSubscribable {
  /**
   * 调用
   * @param method 方法名称
   * @param params 方法参数
   * @returns 调用结果 (Promise)
   */
  call: <ReplyType = any>(method: string, params: any[] | object) => Promise<ReplyType>;

  /**
   * 通知
   * @param notifyName 通知名称
   * @param params 通知参数
   */
  notify: (notifyName: string, params: any[] | object) => void;
}
