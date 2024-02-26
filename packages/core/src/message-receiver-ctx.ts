import { parse } from 'flatted';
import { MessageHandler, MessageReceiver } from './message/message-receiver';
import { MessageBody } from './message/message-body';
import { MessageType } from './message/message-type';
import { JsonrpcCecErrorMessage, JsonrpcError, JsonrpcErrorCode } from './jsonrpc/jsonrpc-error';

export class MessageReceiverCtx {
  constructor(private messageReceiver: MessageReceiver) {}
  // TODO MessageType 判断修改为 JsonrpcEnd
  receive = (receiveHandler: (message: MessageBody) => void, messageType: MessageType) => {
    const messageHandler: MessageHandler = (message: string) => {
      const messageBody = parseMessage(message, messageType);
      // TODO: 实现插件的功能
      receiveHandler.call({}, messageBody);
    };
    return this.messageReceiver.call({}, messageHandler);
  };
}

function parseMessage(message: string, messageType: MessageType): MessageBody {
  try {
    return parse(message) as MessageBody;
  } catch (error) {
    const parseError = {
      code: JsonrpcErrorCode.ParseError,
      message: JsonrpcCecErrorMessage.ParseError,
      data: error,
    };
    const serverError = {
      code: JsonrpcErrorCode.ServerError,
      message: JsonrpcCecErrorMessage.ServerError + ': ' + 'The response of server-end can not be parsed',
      data: error,
    };
    const errorMesssage: JsonrpcError = messageType === MessageType.Request ? parseError : serverError;

    throw new Error(errorMesssage.toString());
  }
}
