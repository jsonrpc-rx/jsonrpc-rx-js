import {
  JsonrpcErrorMessage,
  JsonrpcErrorCode,
  JsonrpcRequestBody,
  JsonrpcResponseBody,
  SubscribleResult,
  SubscribleResultSatate,
  SubscribeHandler,
  SubscribleResultDataItem,
  SubscribleResultErrorItem,
  MessageSender,
  MessageReceiver,
  MessageBody,
  Disposable,
  Dispose,
  isJsonrpcResponseBody,
  isJsonrpcRequestBody,
  FOR_SUBSCRIBLE_SUFFIX,
  FOR_SUBSCRIBLE_CANCEL_SUFFIX,
  IDisposable,
  IJsonrpcServer,
  toType,
  invokeAsPromise,
  uuid,
  Publisher,
  ensurePublisher,
  validJsonrpcError,
  JsonrpcParams,
  JsonrpcBaseConfig,
} from '@cec/jsonrpc-core';
import { MessageSenderCtx } from './message-sender-ctx';
import { MessageReceiverCtx } from './message-receiver-ctx';

export class JsonrpcServer implements IJsonrpcServer {
  static SUBSCRIBLE_RESULT_CACHE_MILLIS = 32;

  private callHandlerMap = new Map<string, (args: any) => any>();
  private notifyHandlerMap = new Map<string, (args: any) => void>();
  private onSubscribeSubjectSet = new Set<string>();

  private msgSenderCtx: MessageSenderCtx;
  private msgReceiverCtx: MessageReceiverCtx;

  constructor(
    private msgSender: MessageSender,
    private msgReceiver: MessageReceiver,
    private jsonrpcBaseConfig?: JsonrpcBaseConfig,
  ) {
    this.msgSenderCtx = new MessageSenderCtx(this.msgSender, this.jsonrpcBaseConfig);
    this.msgReceiverCtx = new MessageReceiverCtx(this.msgReceiver, this.jsonrpcBaseConfig);
    this.receiveMessage();
  }
  onCall = <Params extends JsonrpcParams>(method: string, callHandler: (params: Params) => any): IDisposable => {
    if (!(toType(method) === 'string' && toType(callHandler) === 'function')) this.throwParamsInvalidError();

    if (this.callHandlerMap.has(method)) this.throwParamsRepeatedError(`the method ${method} is repeated`);
    this.callHandlerMap.set(method, callHandler);

    return new Disposable(() => this.callHandlerMap.delete(method));
  };
  onNotify = <Params extends JsonrpcParams>(notifyName: string, notifyHandler: (params: Params) => void): IDisposable => {
    if (!(toType(notifyName) === 'string' && toType(notifyHandler) === 'function')) this.throwParamsInvalidError();

    if (this.callHandlerMap.has(notifyName)) this.throwParamsRepeatedError(`the notify ${notifyName} is repeated`);
    this.notifyHandlerMap.set(notifyName, notifyHandler);

    return new Disposable(() => this.notifyHandlerMap.delete(notifyName));
  };
  onSubscribe<Params extends JsonrpcParams, PublishValue = any>(
    subjectName: string,
    subscribeHandler: SubscribeHandler<Params, PublishValue>,
  ): IDisposable {
    if (!(toType(subjectName) === 'string' && toType(subscribeHandler) === 'function')) this.throwParamsInvalidError();

    if (this.onSubscribeSubjectSet.has(subjectName)) this.throwParamsRepeatedError(`the subject ${subjectName} is repeated`);
    this.onSubscribeSubjectSet.add(subjectName);

    const onSubscribeCancelMap: Map<string | number, Dispose> = new Map();
    const subscribleResultCache = new Set<SubscribleResultDataItem>();
    const subscribleErrorCache = new Set<SubscribleResultErrorItem>();
    const subscribleCompleteCache = new Set<SubscribleResultDataItem>();
    let subscribleResultCacheTimer: any = -1;
    let subscribleErrorCacheTimer: any = -1;
    let subscribleCompleteCacheTimer: any = -1;

    const subscribleCallHandler = (params: JsonrpcParams) => {
      const subscribeId = uuid();

      const sendJsonrpcResponseBody = (result: Pick<SubscribleResult, 'state' | 'data' | 'error'>) => {
        const responseBody: JsonrpcResponseBody<SubscribleResult> = {
          jsonrpc: '2.0',
          id: subscribeId, // 这个 id 不能被采信，这里只是为了数据结构能通过验证，实际上，这个 id 也不会被采用
          result: {
            ...result,
            isSubscribleResult: true,
            subjectName,
          },
        };
        this.msgSenderCtx.send(responseBody);
      };

      const publisher: Publisher = ensurePublisher({
        next: (value) => {
          subscribleResultCache.add({ subscribeId, subscribeValue: value });
          clearTimeout(subscribleResultCacheTimer);
          subscribleResultCacheTimer = setTimeout(() => {
            sendJsonrpcResponseBody({ state: SubscribleResultSatate.Next, data: Array.from(subscribleResultCache) });
            subscribleResultCache.clear();
          }, JsonrpcServer.SUBSCRIBLE_RESULT_CACHE_MILLIS);
        },
        error: (error) => {
          subscribleErrorCache.add({ subscribeId, subscribeError: error });
          clearTimeout(subscribleErrorCacheTimer);
          subscribleErrorCacheTimer = setTimeout(() => {
            sendJsonrpcResponseBody({ state: SubscribleResultSatate.Error, error: Array.from(subscribleErrorCache) });
            subscribleErrorCache.clear();
          }, JsonrpcServer.SUBSCRIBLE_RESULT_CACHE_MILLIS);
        },
        complete: () => {
          subscribleCompleteCache.add({ subscribeId, subscribeValue: undefined });
          clearTimeout(subscribleCompleteCacheTimer);
          subscribleCompleteCacheTimer = setTimeout(() => {
            sendJsonrpcResponseBody({ state: SubscribleResultSatate.Complete, data: Array.from(subscribleCompleteCache) });
            subscribleCompleteCache.clear();
          }, JsonrpcServer.SUBSCRIBLE_RESULT_CACHE_MILLIS);
        },
      });

      const dispose: Dispose = (subscribeHandler as SubscribeHandler<JsonrpcParams>).call({}, publisher, params);
      onSubscribeCancelMap.set(subscribeId, dispose);

      return subscribeId;
    };
    const forSubscrible = subjectName + FOR_SUBSCRIBLE_SUFFIX;
    const forSubscribleDisposable = this.onCall(forSubscrible, subscribleCallHandler);

    const subscribleCancelCallHandler = (params: JsonrpcParams) => {
      const [subscribeId] = params as [string | number];
      const dispose = onSubscribeCancelMap.get(subscribeId);
      if (dispose) {
        dispose.call({});
        onSubscribeCancelMap.delete(subscribeId);
      }
    };
    const forSubscribleCancel = subjectName + FOR_SUBSCRIBLE_CANCEL_SUFFIX;
    const forSubscribleCancelDisposable = this.onCall(forSubscribleCancel, subscribleCancelCallHandler);

    return Disposable.from(
      forSubscribleDisposable.dispose,
      forSubscribleCancelDisposable.dispose,
      ...Array.from(onSubscribeCancelMap.values()),
      () => this.onSubscribeSubjectSet.delete(subjectName),
    );
  }

  private receiveMessage() {
    const receiveHandler = (messageBody: MessageBody) => {
      if (messageBody.id != null && isJsonrpcResponseBody(messageBody) && validJsonrpcError(messageBody).isValid) {
        this.msgSenderCtx.send(messageBody as JsonrpcResponseBody);
        return;
      }

      this.receiveMessageForOnCall(messageBody as JsonrpcRequestBody);
      this.receiveMessageForOnNotify(messageBody as JsonrpcRequestBody);
    };
    this.msgReceiverCtx.receive(receiveHandler); // TODO: 错误处理————给 client 返回错误
  }

  private receiveMessageForOnCall(requestBody: JsonrpcRequestBody) {
    if (!(requestBody.id != null && isJsonrpcRequestBody(requestBody))) return;

    const { id, method, params } = requestBody;
    const callHandler = this.callHandlerMap.get(method);
    if (!callHandler) {
      const responseBody: JsonrpcResponseBody = {
        id,
        jsonrpc: '2.0',
        error: {
          code: JsonrpcErrorCode.MethodNotFound,
          message: JsonrpcErrorMessage.MethodNotFound + ': ' + `the method [${method}] not found`,
        },
      };
      this.msgSenderCtx.send(responseBody);
      return;
    }

    const invokeResult = invokeAsPromise(callHandler, params);
    const responseBody: JsonrpcResponseBody = {} as any;
    invokeResult
      .then((res: any) => (responseBody.result = res))
      .catch(
        (err: Error) =>
          (responseBody.error = {
            code: JsonrpcErrorCode.ServerError,
            message: JsonrpcErrorMessage.ServerError,
            data: err,
          }),
      )
      .finally(() => {
        responseBody.jsonrpc = '2.0';
        responseBody.id = id;
        this.msgSenderCtx.send(responseBody);
      });
  }

  private receiveMessageForOnNotify(requestBody: JsonrpcRequestBody) {
    if (!(requestBody.id == null && isJsonrpcRequestBody(requestBody))) return;

    const { method, params } = requestBody;
    const notifyHandler = this.notifyHandlerMap.get(method);
    if (notifyHandler) {
      notifyHandler.call({}, params);
    }
  }

  private throwParamsInvalidError() {
    const internalError = {
      code: JsonrpcErrorCode.InternalError,
      message: JsonrpcErrorMessage.InternalError + ': ' + 'the parameters invalid',
    };
    throw new Error(internalError.toString());
  }

  private throwParamsRepeatedError(additionMessage: string) {
    const internalError = {
      code: JsonrpcErrorCode.InternalError,
      message: JsonrpcErrorMessage.InternalError + ': ' + additionMessage,
    };
    throw new Error(internalError.toString());
  }
}
