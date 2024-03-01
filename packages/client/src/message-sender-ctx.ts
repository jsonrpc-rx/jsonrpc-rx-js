import { stringify } from 'flatted';
import {
  MessageBody,
  JsonrpcCecErrorMessage,
  JsonrpcErrorCode,
  MessageSender,
  JsonrpcBaseConfig,
  composeInterceptors,
  RequestInterceptor,
  JsonrpcRequestBody,
  invokeAsPromise,
} from '@cec/jsonrpc-core';

export class MessageSenderCtx {
  constructor(
    private messageSender: MessageSender,
    private baseConfig?: JsonrpcBaseConfig,
  ) {}

  send = (messageBody: JsonrpcRequestBody) => {
    if (this.baseConfig?.requestInterceptors) {
      const interceptor = composeInterceptors<RequestInterceptor>(this.baseConfig?.requestInterceptors);
      invokeAsPromise(interceptor, messageBody).then(() => {
        const message = stringifyMessageBody(messageBody);
        this.messageSender.call({}, message);
      });
    }
  };
}

function stringifyMessageBody(messageBody: MessageBody): string {
  try {
    return stringify(messageBody) as string;
  } catch (error) {
    const invalidRequest = {
      code: JsonrpcErrorCode.InvalidRequest,
      message: JsonrpcCecErrorMessage.InvalidRequest,
      data: error,
    };
    throw new Error(invalidRequest.toString());
  }
}
