import { stringify } from 'flatted';
import {
  JsonrpcErrorCode,
  MessageSender,
  JsonrpcBaseConfig,
  JsonrpcResponseBody,
  composeInterceptors,
  invokeAsPromise,
  JsonrpcEnd,
  MessageType,
  InterceptorSafeContext,
  MessageBody,
  JsonrpcCostomError,
} from '@cec/jsonrpc-core';

export class MessageSenderCtx {
  private interceptorInvoker = (messageBody: MessageBody) => Promise.resolve(messageBody);

  constructor(
    private messageSender: MessageSender,
    private interceptorSafeContextArr: InterceptorSafeContext[],
    private baseConfig?: JsonrpcBaseConfig,
  ) {
    if (this.baseConfig?.interceptors?.length) {
      const interceptorInfo = this.baseConfig.interceptors.map((interceptor, index) => ({
        interceptor,
        envInfo: {
          end: JsonrpcEnd.Server,
          type: MessageType.Response,
          messageSender: this.messageSender,
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

  send = async (responseBody: JsonrpcResponseBody) => {
    let filteredResponseBody = responseBody;
    try {
      filteredResponseBody = await invokeAsPromise(this.interceptorInvoker, responseBody);
    } catch (error: any) {
      filteredResponseBody = {
        id: responseBody.id,
        jsonrpc: '2.0',
        error: {
          code: JsonrpcErrorCode.ServerError,
          message: 'the response interceptors throw error in server end',
          data: error.stack,
        },
      };
    }

    if (filteredResponseBody == null) return;
    let message: string;
    try {
      message = stringify(filteredResponseBody);
    } catch (error: any) {
      const errorResponseBody: JsonrpcResponseBody = {
        jsonrpc: '2.0',
        id: filteredResponseBody.id,
        error: {
          code: JsonrpcErrorCode.ServerError,
          message: 'stringify error in server end',
          data: error.stack,
        },
      };
      message = stringify(errorResponseBody);
    }
    this.messageSender.call({}, message);
  };
}
