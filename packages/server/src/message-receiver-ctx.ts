import { parse } from 'flatted';
import {
  MessageHandler,
  MessageReceiver,
  MessageBody,
  JsonrpcCecErrorMessage,
  JsonrpcErrorCode,
  JsonrpcBaseConfig,
  JsonrpcRequestBody,
  isJsonrpcRequestBody,
  composeInterceptors,
  RequestInterceptor,
  invokeAsPromise,
  JsonrpcResponseBody,
} from '@cec/jsonrpc-core';

export class MessageReceiverCtx {
  constructor(
    private messageReceiver: MessageReceiver,
    private baseConfig?: JsonrpcBaseConfig,
  ) {}

  receive = (receiveHandler: (messageBody: MessageBody) => void) => {
    const messageHandler: MessageHandler = async (message: string) => {
      let messageBody = parseMessage(message) as MessageBody; // 这一步发生错误的话，错误暂时不处理
      if (!isJsonrpcRequestBody(messageBody)) return;

      if (this.baseConfig?.requestInterceptors) {
        try {
          const interceptor = composeInterceptors<RequestInterceptor>(this.baseConfig.requestInterceptors);
          messageBody = (await invokeAsPromise(interceptor, messageBody)) as JsonrpcRequestBody;
        } catch (data) {
          messageBody = {
            id: messageBody.id,
            jsonrpc: '2.0',
            error: {
              code: JsonrpcErrorCode.ServerError,
              message: JsonrpcCecErrorMessage.ServerError + ': ' + 'the request interceptors throw error in server end',
              data,
            },
          } as JsonrpcResponseBody;
        }
      }

      receiveHandler.call({}, messageBody);
    };
    return this.messageReceiver.call({}, messageHandler);
  };
}

function parseMessage(message: string): MessageBody {
  try {
    return parse(message) as MessageBody;
  } catch (error) {
    const parseError = {
      code: JsonrpcErrorCode.ParseError,
      message: JsonrpcCecErrorMessage.ParseError,
      data: error,
    };
    throw new Error(parseError.toString());
  }
}
