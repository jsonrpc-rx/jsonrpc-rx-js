import { stringify } from 'flatted';
import {
  MessageBody,
  JsonrpcErrorMessage,
  JsonrpcErrorCode,
  MessageSender,
  JsonrpcBaseConfig,
  composeInterceptors,
  JsonrpcRequestBody,
  invokeAsPromise,
} from '@cec/jsonrpc-core';

export class MessageSenderCtx {
  constructor(
    private messageSender: MessageSender,
    private baseConfig?: JsonrpcBaseConfig,
  ) {}

  send = async (messageBody: MessageBody) => {
    let requestBody = messageBody as JsonrpcRequestBody;

    if (this.baseConfig?.requestInterceptors?.length) {
      try {
        const interceptor = composeInterceptors<JsonrpcRequestBody>(this.baseConfig?.requestInterceptors);
        requestBody = await invokeAsPromise(interceptor, messageBody);
      } catch (error) {
        const internalError = {
          code: JsonrpcErrorCode.InternalError,
          message: JsonrpcErrorMessage.InternalError + ': ' + 'the request interceptors throw error',
          data: error,
        };
        throw new Error(JSON.stringify(internalError));
      }
    }

    if (requestBody == null) return;
    const message = stringifyMessageBody(requestBody!);
    this.messageSender.call({}, message);
  };
}

function stringifyMessageBody(messageBody: MessageBody): string {
  try {
    return stringify(messageBody) as string;
  } catch (error) {
    const invalidRequest = {
      code: JsonrpcErrorCode.InvalidRequest,
      message: JsonrpcErrorMessage.InvalidRequest,
      data: error,
    };
    throw new Error(JSON.stringify(invalidRequest));
  }
}
