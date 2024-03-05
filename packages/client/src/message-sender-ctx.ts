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

  send = async (messageBody: JsonrpcRequestBody) => {
    let requestBody: JsonrpcRequestBody;

    if (this.baseConfig?.requestInterceptors) {
      try {
        const interceptor = composeInterceptors<RequestInterceptor>(this.baseConfig?.requestInterceptors);
        requestBody = await invokeAsPromise(interceptor, messageBody);
      } catch (error) {
        const internalError = {
          code: JsonrpcErrorCode.InternalError,
          message: JsonrpcCecErrorMessage.InternalError + ': ' + 'the request interceptors throw error',
          data: error,
        };
        throw new Error(internalError.toString());
      }
    }
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
      message: JsonrpcCecErrorMessage.InvalidRequest,
      data: error,
    };
    throw new Error(invalidRequest.toString());
  }
}
