import { stringify } from 'flatted';
import {
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
      } catch (error: any) {
        filteredResponseBody = {
          id: responseBody.id,
          jsonrpc: '2.0',
          error: {
            code: JsonrpcErrorCode.ServerError,
            message: 'the response interceptors throw error in server end',
            data: error.stack ?? error.toString(),
          },
        };
      }
    }

    if (filteredResponseBody == null) return;
    let message: string;
    try {
      message = stringify(filteredResponseBody);
    } catch (error: any) {
      const errorResponseBody: JsonrpcResponseBody = {
        jsonrpc: '2.0',
        id: filteredResponseBody.id,
        error: {
          code: JsonrpcErrorCode.ServerError,
          message: 'stringify error in server end',
          data: error.stack ?? error.toString(),
        },
      };
      message = stringify(errorResponseBody);
    }
    this.messageSender.call({}, message);
  };
}
