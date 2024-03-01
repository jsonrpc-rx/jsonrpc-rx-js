import { parse } from 'flatted';
import {
  MessageHandler,
  MessageReceiver,
  MessageBody,
  JsonrpcCecErrorMessage,
  JsonrpcErrorCode,
  JsonrpcBaseConfig,
} from '@cec/jsonrpc-core';

export class MessageReceiverCtx {
  constructor(
    private messageReceiver: MessageReceiver,
    baseConfig?: JsonrpcBaseConfig,
  ) {}

  receive = (receiveHandler: (message: MessageBody) => void) => {
    const messageHandler: MessageHandler = (message: string) => {
      const messageBody = parseMessage(message);
      // TODO: 处理执行中的异常
      receiveHandler.call({}, messageBody);
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
      message: JsonrpcCecErrorMessage.ServerError + ': ' + 'The response of server-end can not be parsed',
      data: error,
    };
    throw new Error(serverError.toString());
  }
}
