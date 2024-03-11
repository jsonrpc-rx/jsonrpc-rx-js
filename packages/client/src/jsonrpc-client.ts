import {
  JsonrpcError,
  JsonrpcErrorCode,
  JsonrpcRequestBody,
  JsonrpcResponseBody,
  JsonrpcBaseConfig,
  MessageSender,
  MessageReceiver,
  MessageBody,
  Deferred,
  Disposable,
  Dispose,
  isSubscribleResult,
  isJsonrpcBaseConfig,
  isJsonrpcResponseBody,
  isJsonrpcRequestBodyParams,
  isObserver,
  FOR_SUBSCRIBLE_SUFFIX,
  FOR_SUBSCRIBLE_CANCEL_SUFFIX,
  SubscribleResult,
  SubscribleResultSatate,
  IJsonrpcClient,
  IDisposable,
  toType,
  uuid,
  Observer,
  JsonrpcParams,
  JsonrpcCostomError,
} from '@cec/jsonrpc-core';
import { MessageSenderCtx } from './message-sender-ctx';
import { MessageReceiverCtx } from './message-receiver-ctx';

export interface JsonrpcClientConfig extends JsonrpcBaseConfig {
  timeout?: number; // default by 36000ms
}

type CallReception<T> = {
  resolve: Deferred<T>['resolve'];
  reject: Deferred<T>['reject'];
  clearTimer: () => void;
};

export class JsonrpcClient implements IJsonrpcClient {
  static TIMEOUT_DEFAULT = 36_000;

  private callReceptionMap = new Map<string | number, CallReception<any>>();
  private subscribeObserverMap: Map<
    string,
    {
      observers: Map<string | number, Observer<any>>;
      disposable: IDisposable;
    }
  > = new Map();

  private msgSenderCtx: MessageSenderCtx;
  private msgReceiverCtx: MessageReceiverCtx;

  constructor(
    private msgSender: MessageSender,
    private msgReceiver: MessageReceiver,
    private jsonrpcClientConfig?: JsonrpcClientConfig,
  ) {
    const isJsonrpcClientConfig =
      toType(msgSender) === 'function' && toType(msgReceiver) === 'function' && this.isJsonrpcClientConfig(jsonrpcClientConfig!);
    if (!isJsonrpcClientConfig) {
      this.throwParamsInvalidError();
    }

    this.msgSenderCtx = new MessageSenderCtx(this.msgSender, this.jsonrpcClientConfig);
    this.msgReceiverCtx = new MessageReceiverCtx(this.msgReceiver, this.jsonrpcClientConfig);
    this.receiveMessage();
  }

  call = <ReplyValue>(method: string, params: JsonrpcParams): Promise<ReplyValue> => {
    if (!(toType(method) === 'string' && isJsonrpcRequestBodyParams(params))) this.throwParamsInvalidError();

    const id = uuid();
    const { reject, resolve, promise } = new Deferred<ReplyValue>();
    const delayTime = this.jsonrpcClientConfig?.timeout ?? JsonrpcClient.TIMEOUT_DEFAULT;

    const timer = setTimeout(() => {
      const jsonrpcError: JsonrpcError = {
        code: JsonrpcErrorCode.InternalError,
        message: `the method ${method} has called failed, reason: timeout`,
      };
      reject(new JsonrpcCostomError(jsonrpcError));
    }, delayTime);

    const clearTimer = () => clearTimeout(timer);
    this.callReceptionMap.set(id, { reject, resolve, clearTimer });

    const requestBody: JsonrpcRequestBody = { jsonrpc: '2.0', id, method, params };
    try {
      this.msgSenderCtx.send(requestBody);
    } catch (error) {
      reject(error);
    }
    return promise;
  };

  notify = (notifyName: string, params: JsonrpcParams) => {
    if (!(toType(notifyName) === 'string' && isJsonrpcRequestBodyParams(params))) this.throwParamsInvalidError();

    const requestBody: JsonrpcRequestBody = { jsonrpc: '2.0', method: notifyName, params };
    this.msgSenderCtx.send(requestBody);
  };

  subscribe<NextValue>(subjectName: string, observer: Observer<NextValue>, params: JsonrpcParams): IDisposable {
    if (!(toType(subjectName) === 'string' && isObserver(observer) && isJsonrpcRequestBodyParams(params))) this.throwParamsInvalidError();

    let subscribeDispose: Dispose = () => {};
    const toSubscribe = (subscribeId: string | number) => {
      if (!(toType(subscribeId) === 'string' || toType(subscribeId) === 'number')) {
        const internalError = {
          code: JsonrpcErrorCode.InternalError,
          message: 'the subscribe-id of response is invalid when subscribing',
        };
        throw new JsonrpcCostomError(internalError);
      }
      if (this.subscribeObserverMap.has(subjectName)) {
        this.subscribeObserverMap.get(subjectName)?.observers.set(subscribeId, observer);
      } else {
        this.subscribeObserverMap.set(subjectName, {
          observers: new Map([[subscribeId, observer]]),
          disposable: new Disposable(() => {
            this.subscribeObserverMap.delete(subjectName);
          }),
        });
      }
      subscribeDispose = () => {
        this.subscribeObserverMap.get(subjectName)?.observers.delete(subscribeId);
        const forSubscribleCancel = subjectName + FOR_SUBSCRIBLE_CANCEL_SUFFIX;
        this.notify(forSubscribleCancel, [subscribeId]);
      };
    };
    const forSubscrible = subjectName + FOR_SUBSCRIBLE_SUFFIX;
    this.call<string | number>(forSubscrible, params).then(toSubscribe);

    return Disposable.from(subscribeDispose, () => {
      if (this.subscribeObserverMap.has(subjectName)) {
        const { observers, disposable } = this.subscribeObserverMap.get(subjectName)!;
        if (observers.size === 0) disposable.dispose();
      }
    });
  }

  private receiveMessage() {
    const receiveHandler = (messageBody: MessageBody) => {
      this.receiveMessageForCall(messageBody as JsonrpcResponseBody);
      this.receiveMessageForSubscribe(messageBody as JsonrpcResponseBody);
    };
    this.msgReceiverCtx.receive(receiveHandler);
  }

  private receiveMessageForCall(responseBody: JsonrpcResponseBody) {
    if (!(isJsonrpcResponseBody(responseBody) && !isSubscribleResult(responseBody.result))) return;

    const { id } = responseBody;
    if (!this.callReceptionMap.has(id)) return;

    const { error, result } = responseBody;
    const { resolve, reject, clearTimer } = this.callReceptionMap.get(id)!;
    error == null ? resolve(result) : reject(new JsonrpcCostomError(error));
    clearTimer();
    this.callReceptionMap.delete(id);
  }

  private receiveMessageForSubscribe(responseBody: JsonrpcResponseBody<SubscribleResult>) {
    if (!(isJsonrpcResponseBody(responseBody) && isSubscribleResult(responseBody.result!))) return;

    const { state, subjectName, data, error } = responseBody.result!;

    if (!this.subscribeObserverMap.has(subjectName)) return;
    const { observers, disposable } = this.subscribeObserverMap.get(subjectName)!;

    switch (state) {
      case SubscribleResultSatate.Next:
        for (const { subscribeId, subscribeValue } of data ?? []) {
          observers.get(subscribeId)?.onNext.call({}, subscribeValue);
        }
        break;
      case SubscribleResultSatate.Error:
        for (const { subscribeId, subscribeError } of error ?? []) {
          observers.get(subscribeId)?.onError?.call({}, subscribeError);
        }
        break;
      case SubscribleResultSatate.Complete:
        for (const { subscribeId } of data ?? []) {
          observers.get(subscribeId)?.onComplete?.call({});
          observers.delete(subscribeId);
          if (observers.size === 0) disposable?.dispose();
        }
        break;
    }
  }

  private isJsonrpcClientConfig(config?: JsonrpcClientConfig): boolean {
    const { timeout } = config ?? {};
    return (toType(timeout) === 'number' || timeout == null) && isJsonrpcBaseConfig(config);
  }

  private throwParamsInvalidError() {
    const internalError = {
      code: JsonrpcErrorCode.InternalError,
      message: 'the parameters invalid',
    };
    throw new JsonrpcCostomError(internalError);
  }
}
