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
      // TODO: 实现插件的功能
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
    const parseError = {
      code: JsonrpcErrorCode.ParseError,
      message: JsonrpcCecErrorMessage.ParseError,
      data: error,
    };
    throw new Error(parseError.toString());
  }
}
