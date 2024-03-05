import { stringify } from 'flatted';
import {
  MessageBody,
  JsonrpcCecErrorMessage,
  JsonrpcErrorCode,
  MessageSender,
  JsonrpcBaseConfig,
  JsonrpcResponseBody,
  composeInterceptors,
  ResponseInterceptor,
  invokeAsPromise,
} from '@cec/jsonrpc-core';

export class MessageSenderCtx {
  constructor(
    private messageSender: MessageSender,
    private baseConfig?: JsonrpcBaseConfig,
  ) {}

  send = async (responseBody: JsonrpcResponseBody) => {
    let filteredResponseBody = responseBody;
    if (this.baseConfig?.responseInterceptors) {
      try {
        const interceptor = composeInterceptors<ResponseInterceptor>(this.baseConfig?.responseInterceptors);
        filteredResponseBody = await invokeAsPromise(interceptor, responseBody);
      } catch (error) {
        filteredResponseBody = {
          id: responseBody.id,
          jsonrpc: '2.0',
          error: {
            code: JsonrpcErrorCode.ServerError,
            message: JsonrpcCecErrorMessage.ServerError + ': ' + 'the response interceptors throw error in server end',
            data: error,
          },
        };
      }
    }

    let message: string;
    try {
      message = stringifyMessageBody(filteredResponseBody);
    } catch (error) {
      const errorResponseBody: JsonrpcResponseBody = {
        ...filteredResponseBody,
        result: undefined,
        error: error,
      };
      message = stringifyMessageBody(errorResponseBody);
    }

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
