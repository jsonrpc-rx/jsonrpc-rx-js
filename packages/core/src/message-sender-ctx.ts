import { stringify } from 'flatted';
import { MessageSender } from './message/message-sender';
import { MessageBody } from './message/message-body';
import { MessageType } from './message/message-type';
import { JsonrpcCecErrorMessage, JsonrpcError, JsonrpcErrorCode } from './jsonrpc/jsonrpc-error';

export class MessageSenderCtx {
  constructor(private messageSender: MessageSender) {}
  // TODO MessageType 判断修改为 JsonrpcEnd
  send = (messageBody: MessageBody, messageType: MessageType) => {
    const message = stringifyMessageBody(messageBody, messageType);
    // TODO：实现插件的功能
    this.messageSender.call({}, message);
  };
}

function stringifyMessageBody(messageBody: MessageBody, messageType: MessageType): string {
  try {
    return stringify(messageBody) as string;
  } catch (error) {
    const invalidRequest = {
      code: JsonrpcErrorCode.InvalidRequest,
      message: JsonrpcCecErrorMessage.InvalidRequest,
      data: error,
    };
    const serverError = {
      code: JsonrpcErrorCode.ServerError,
      message: JsonrpcCecErrorMessage.ServerError,
      data: error,
    };
    const errorMesssage: JsonrpcError = messageType === MessageType.Request ? invalidRequest : serverError;

    throw new Error(errorMesssage.toString());
  }
}
