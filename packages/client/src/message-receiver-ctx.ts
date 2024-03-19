import { parse } from 'flatted';
import {
  MessageHandler,
  MessageReceiver,
  MessageBody,
  JsonrpcErrorCode,
  composeInterceptors,
  invokeAsPromise,
  JsonrpcResponseBody,
  isJsonrpcResponseBody,
  JsonrpcBaseConfig,
  JsonrpcEnd,
  MessageType,
  InterceptorSafeContext,
  JsonrpcCostomError,
} from '@cec/jsonrpc-core';

export class MessageReceiverCtx {
  private interceptorInvoker = (messageBody: MessageBody) => Promise.resolve(messageBody);

  constructor(
    private messageReceiver: MessageReceiver,
    private interceptorSafeContextArr: InterceptorSafeContext[],
    private baseConfig?: JsonrpcBaseConfig,
  ) {
    if (this.baseConfig?.interceptors?.length) {
      const interceptorInfo = this.baseConfig.interceptors.map((interceptor, index) => ({
        interceptor,
        envInfo: {
          end: JsonrpcEnd.Client,
          type: MessageType.Response,
          messageReceiver: this.messageReceiver,
        },
        safeContext: this.interceptorSafeContextArr[index],
      }));
      try {
        this.interceptorInvoker = composeInterceptors(interceptorInfo);
      } catch (error: any) {
        throw new JsonrpcCostomError({
          code: JsonrpcErrorCode.InternalError,
          message: 'interceptors initialization failed',
          data: error,
        });
      }
    }
  }

  receive = (receiveHandler: (message: MessageBody) => void) => {
    const messageHandler: MessageHandler = async (message: string) => {
      let responseBody = parse(message) as JsonrpcResponseBody; // 这一步发生错误的话，错误就不能和传递给 call 方法。所以这里的错误暂时不处理
      if (!isJsonrpcResponseBody(responseBody)) return;

      try {
        responseBody = await invokeAsPromise(this.interceptorInvoker, responseBody);
      } catch (error: any) {
        responseBody = {
          jsonrpc: '2.0',
          id: responseBody.id,
          error: {
            code: JsonrpcErrorCode.InternalError,
            message: 'the interceptors execution error',
            data: error.stack,
          },
        };
      }

      if (responseBody == null) return;
      receiveHandler.call({}, responseBody);
    };
    return this.messageReceiver.call({}, messageHandler);
  };
}
