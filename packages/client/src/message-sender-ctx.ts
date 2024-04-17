import { stringify } from 'flatted';
import {
  MessageBody,
  JsonrpcErrorCode,
  MessageSender,
  JsonrpcBaseConfig,
  composeInterceptors,
  JsonrpcRequestBody,
  invokeAsPromise,
  JsonrpcCostomError,
  JsonrpcEnd,
  MessageType,
  InterceptorSafeContext,
} from '@jsonrpc-rx/core';

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
          end: JsonrpcEnd.Client,
          type: MessageType.Request,
          sendMessage: this.send.bind(this),
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

  send = async (messageBody: MessageBody) => {
    let requestBody = messageBody as JsonrpcRequestBody;

    try {
      requestBody = await invokeAsPromise(this.interceptorInvoker, messageBody);
    } catch (error: any) {
      const internalError = {
        code: JsonrpcErrorCode.InternalError,
        message: 'the interceptors execution error',
        data: error.stack,
      };
      throw new JsonrpcCostomError(internalError);
    }

    if (requestBody == null) return;
    const message = stringifyMessageBody(requestBody!);
    this.messageSender.call({}, message);
  };
}

function stringifyMessageBody(messageBody: MessageBody): string {
  try {
    return stringify(messageBody) as string;
  } catch (error: any) {
    const invalidRequest = {
      code: JsonrpcErrorCode.InvalidRequest,
      message: 'stringify error in client end',
      data: error.stack,
    };
    throw new JsonrpcCostomError(invalidRequest);
  }
}
