import { parse } from 'flatted';
import {
  MessageHandler,
  MessageReceiver,
  MessageBody,
  JsonrpcErrorMessage,
  JsonrpcErrorCode,
  ResponseInterceptor,
  composeInterceptors,
  invokeAsPromise,
  JsonrpcResponseBody,
  isJsonrpcResponseBody,
  JsonrpcBaseConfig,
} from '@cec/jsonrpc-core';

export class MessageReceiverCtx {
  constructor(
    private messageReceiver: MessageReceiver,
    private baseConfig?: JsonrpcBaseConfig,
  ) {}

  receive = (receiveHandler: (message: MessageBody) => void) => {
    const messageHandler: MessageHandler = async (message: string) => {
     
      let responseBody = parseMessage(message) as JsonrpcResponseBody; // 这一步发生错误的话，错误就不能和传递给 call 方法。所以这里的错误暂时不处理
      if (!isJsonrpcResponseBody(responseBody)) return;

      if (this.baseConfig?.responseInterceptors) {
        try {
          const interceptor = composeInterceptors<ResponseInterceptor>(this.baseConfig.responseInterceptors!);
          responseBody = await invokeAsPromise(interceptor, responseBody);
        } catch (data) {
          responseBody = {
            ...responseBody,
            result: undefined,
            error: {
              code: JsonrpcErrorCode.InternalError,
              message: JsonrpcErrorMessage.InternalError + ': ' + 'the response interceptors throw error',
              data,
            },
          };
        }
      }

      receiveHandler.call({}, responseBody);
    };
    return this.messageReceiver.call({}, messageHandler);
  };
}

function parseMessage(message: string): MessageBody {
  try {
    return parse(message) as MessageBody;
  } catch (error) {
    const serverError = {
      code: JsonrpcErrorCode.ServerError,
      message: JsonrpcErrorMessage.ServerError + ': ' + 'The response of server-end can not be parsed',
      data: error,
    };
    throw new Error(serverError.toString());
  }
}
