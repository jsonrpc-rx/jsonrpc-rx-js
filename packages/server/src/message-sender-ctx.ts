import { stringify } from 'flatted';
import { MessageBody, JsonrpcCecErrorMessage, JsonrpcErrorCode, MessageSender, JsonrpcBaseConfig } from '@cec/jsonrpc-core';

export class MessageSenderCtx {
  constructor(
    private messageSender: MessageSender,
    baseConfig?: JsonrpcBaseConfig,
  ) {}

  send = (messageBody: MessageBody) => {
    const message = stringifyMessageBody(messageBody);
    // TODO：实现插件的功能
    this.messageSender.call({}, message);
  };
}

function stringifyMessageBody(messageBody: MessageBody): string {
  try {
    return stringify(messageBody) as string;
  } catch (error) {
    const serverError = {
      code: JsonrpcErrorCode.ServerError,
      message: JsonrpcCecErrorMessage.ServerError + ': ' + 'stringify error in server end',
      data: error,
    };
    throw new Error(serverError.toString());
  }
}
