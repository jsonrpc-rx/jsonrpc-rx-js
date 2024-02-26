import { uuid } from './util/uuid';
import { Deferred } from './util/deferred';
import { MessageSenderCtx } from './message-sender-ctx';
import { MessageReceiverCtx } from './message-receiver-ctx';
import { MessageSender } from './message/message-sender';
import { MessageReceiver } from './message/message-receiver';
import { JsonrpcRequestBody } from './jsonrpc/jsonrpc-request-body';
import { MessageType } from './message/message-type';
import { JsonrpcCecErrorMessage, JsonrpcError, JsonrpcErrorCode } from './jsonrpc/jsonrpc-error';
import { JsonrpcEnd } from './jsonrpc/jsonrpc-end';
import { MessageBody, isJsonrpcRequestBody, isJsonrpcResponseBody } from './message/message-body';
import { JsonrpcResponseBody } from './jsonrpc/jsonrpc-response-body';
import { invokeToPromise } from './util/invoke-to-promise';

export type CallHandler = (...args: any[]) => any;

export type JsonrpcCecConfig = {
  timeout?: number;
  jsonrpcEnd: JsonrpcEnd;
};

export type ReplyReception = {
  destory: () => void;
  whenBeCalled: (watcher: (params: any[], returnVal: any) => void) => void;
};

export interface IJsonrpcCec {
  /**
   * 调用“方法”
   * @param method 方法名称
   * @param params 方法参数
   * @returns 调用结果 (Promise)
   */
  call: <ReplyType = any>(method: string, ...params: any[]) => Promise<ReplyType>;
  /**
   * 通知
   * @param method 方法名称
   * @param params 方法参数
   */
  notify: (method: string, ...params: any[]) => void;
  /**
   * 处理”调用“ 或者 响应”通知“
   * @param method 方法名称
   * @param callHandler 方法的逻辑处理(调用处理逻辑)
   */
  reply: (method: string, callHandler: CallHandler) => ReplyReception;
}

type CallReception<T> = {
  resolve: Deferred<T>['resolve'];
  reject: Deferred<T>['reject'];
  clearTimer: () => void;
};

export class JsonrpcCec implements IJsonrpcCec {
  static DEFAULT_CALL_TIME_OUT = 36000;
  private callReceptionMap = new Map<string | number, CallReception<any>>();
  private callHandlerMap = new Map<string, CallHandler>();

  private msgSenderCtx: MessageSenderCtx;
  private msgReceiverCtx: MessageReceiverCtx;

  constructor(
    private msgSender: MessageSender,
    private msgReceiver: MessageReceiver,
    private jsonrpcCecConfig: JsonrpcCecConfig,
  ) {
    this.msgSenderCtx = new MessageSenderCtx(this.msgSender);
    this.msgReceiverCtx = new MessageReceiverCtx(this.msgReceiver);
    const messageType = this.jsonrpcCecConfig.jsonrpcEnd === JsonrpcEnd.Client ? MessageType.Request : MessageType.Response;
    this.handleMessagReceive(messageType);
  }

  call = <ReplyType = any>(method: string, ...params: any[]) => {
    const id = uuid();
    const { reject, resolve, promise } = new Deferred<ReplyType>();
    const delayTime = this.jsonrpcCecConfig?.timeout ?? JsonrpcCec.DEFAULT_CALL_TIME_OUT;

    const timer = setTimeout(() => {
      const jsonrpcError: JsonrpcError = {
        code: JsonrpcErrorCode.InternalError,
        message: JsonrpcCecErrorMessage + ': ' + `the method ${method} has called failed, reason: timeout`,
      };
      reject(new Error(jsonrpcError.toString()));
    }, delayTime);

    const clearTimer = () => clearTimeout(timer);
    this.callReceptionMap.set(id, { reject, resolve, clearTimer });

    const requestBody: JsonrpcRequestBody = { jsonrpc: '2.0', id, method, params };
    try {
      this.msgSenderCtx.send(requestBody, MessageType.Request)!;
    } catch (error) {
      reject(error);
    }
    return promise;
  };

  notify = (method: string, ...params: any[]) => {
    const requestBody: JsonrpcRequestBody = {
      jsonrpc: '2.0',
      method,
      params,
    };
    this.msgSenderCtx.send(requestBody, MessageType.Request)!;
  };

  reply = (method: string, callHandler: CallHandler): ReplyReception => {
    let replyWatcher: any = () => {};
    const replyReception: ReplyReception = {
      destory: () => this.callHandlerMap.delete(method),
      whenBeCalled: (watcher) => (replyWatcher = watcher),
    };

    const callHandlerWarpper = (...params: any[]) => {
      const callReturn = callHandler.call({}, ...params);
      try {
        replyWatcher.call({}, params, callReturn);
      } catch (_) {}
      return callReturn;
    };
    this.callHandlerMap.set(method, callHandlerWarpper);
    return replyReception;
  };

  private handleMessagReceive(messageType: MessageType) {
    const receiveHandler = (messageBody: MessageBody) => {
      const { id } = messageBody;

      if (isJsonrpcRequestBody(messageBody)) {
        if (this.callReceptionMap.has(id!)) return;

        const { method, params } = messageBody as JsonrpcRequestBody;
        const callHandler = this.callHandlerMap.get(method);
        if (!callHandler) {
          if (id != null) {
            const responseBody: JsonrpcResponseBody = {
              id,
              jsonrpc: '2.0',
              error: {
                code: JsonrpcErrorCode.MethodNotFound,
                message: JsonrpcCecErrorMessage.MethodNotFound + ': ' + `the method [${method}] does not have a corresponding handler`,
              },
            };
            this.msgSenderCtx.send(responseBody, MessageType.Response);
          }
          return;
        }

        const result = invokeToPromise(callHandler, ...(params as any[])); // TODO: 处理 关联名称 的情况
        if (id == null) return; // A Notification is a Request object without an "id" member. no Response object needs to be returned to the client.

        const responseBody: JsonrpcResponseBody = {} as any;
        result
          .then((res: any) => (responseBody.result = res))
          .catch(
            (err: Error) =>
              (responseBody.error = {
                code: JsonrpcErrorCode.ServerError,
                message: JsonrpcCecErrorMessage.ServerError,
                data: err,
              }),
          )
          .finally(() => {
            responseBody.jsonrpc = '2.0';
            responseBody.id = id;
            this.msgSenderCtx.send(messageBody, MessageType.Response);
          });
      } else if (isJsonrpcResponseBody(messageBody)) {
        if (id == null || !this.callReceptionMap.has(id!)) return;

        const { error, result } = messageBody as JsonrpcResponseBody;
        const { resolve, reject, clearTimer } = this.callReceptionMap.get(id!)!;
        error == null ? resolve(result) : reject(error);
        clearTimer();
        this.callReceptionMap.delete(id!);
      }
    };
    this.msgReceiverCtx.receive(receiveHandler, messageType);
  }
}
