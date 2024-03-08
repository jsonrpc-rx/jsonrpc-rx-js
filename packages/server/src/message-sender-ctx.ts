import { stringify } from 'flatted';
import {
  JsonrpcErrorMessage,
  JsonrpcErrorCode,
  MessageSender,
  JsonrpcBaseConfig,
  JsonrpcResponseBody,
  composeInterceptors,
  invokeAsPromise,
} from '@cec/jsonrpc-core';

export class MessageSenderCtx {
  constructor(
    private messageSender: MessageSender,
    private baseConfig?: JsonrpcBaseConfig,
  ) {}

  send = async (responseBody: JsonrpcResponseBody) => {
    let filteredResponseBody = responseBody;
    if (this.baseConfig?.responseInterceptors?.length) {
      try {
        const interceptor = composeInterceptors<JsonrpcResponseBody>(this.baseConfig?.responseInterceptors);
        filteredResponseBody = await invokeAsPromise(interceptor, responseBody);
      } catch (error) {
        filteredResponseBody = {
          id: responseBody.id,
          jsonrpc: '2.0',
          error: {
            code: JsonrpcErrorCode.ServerError,
            message: JsonrpcErrorMessage.ServerError + ': ' + 'the response interceptors throw error in server end',
            data: error,
          },
        };
      }
    }

    if (filteredResponseBody == null) return;
    let message: string;
    try {
      message = stringify(filteredResponseBody);
    } catch (error) {
      const errorResponseBody: JsonrpcResponseBody = {
        jsonrpc: '2.0',
        id: filteredResponseBody.id,
        error: {
          code: JsonrpcErrorCode.ServerError,
          message: JsonrpcErrorMessage.ServerError + ': ' + 'stringify error in server end',
          data: JSON.stringify(error),
        },
      };
      message = stringify(errorResponseBody);
    }
    this.messageSender.call({}, message);
  };
}
