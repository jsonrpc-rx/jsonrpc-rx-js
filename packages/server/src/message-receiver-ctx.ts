import { parse } from 'flatted';
import {
  MessageHandler,
  MessageReceiver,
  MessageBody,
  JsonrpcErrorCode,
  JsonrpcBaseConfig,
  JsonrpcRequestBody,
  isJsonrpcRequestBody,
  composeInterceptors,
  invokeAsPromise,
  JsonrpcResponseBody,
  JsonrpcEnd,
  MessageType,
} from '@cec/jsonrpc-core';

export class MessageReceiverCtx {
  constructor(
    private messageReceiver: MessageReceiver,
    private baseConfig?: JsonrpcBaseConfig,
  ) {}

  receive = (receiveHandler: (messageBody: MessageBody) => void) => {
    const messageHandler: MessageHandler = async (message: string) => {
      let messageBody = parse(message) as MessageBody; // 这一步发生错误的话，错误暂时不处理: 如果解析错误，那么就没有办法将错误向任何一端传递
      if (!isJsonrpcRequestBody(messageBody)) return;

      if (this.baseConfig?.interceptors?.length) {
        try {
          const interceptor = composeInterceptors(this.baseConfig.interceptors!, { end: JsonrpcEnd.Server, type: MessageType.Request });
          messageBody = (await invokeAsPromise(interceptor, messageBody)) as JsonrpcRequestBody;
        } catch (error: any) {
          messageBody = {
            id: messageBody.id,
            jsonrpc: '2.0',
            error: {
              code: JsonrpcErrorCode.ServerError,
              message: 'the request interceptors throw error in server end',
              data: error.stack ?? error.toString(),
            },
          } as JsonrpcResponseBody;
        }
      }

      if (messageBody == null) return;
      receiveHandler.call({}, messageBody);
    };
    return this.messageReceiver.call({}, messageHandler);
  };
}
