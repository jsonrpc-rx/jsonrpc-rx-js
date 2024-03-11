import { stringify } from 'flatted';
import {
  MessageBody,
  JsonrpcErrorCode,
  MessageSender,
  JsonrpcBaseConfig,
  composeInterceptors,
  JsonrpcRequestBody,
  invokeAsPromise,
  JsonrpcCostomError,
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
      } catch (error: any) {
        const internalError = {
          code: JsonrpcErrorCode.InternalError,
          message: 'the request interceptors throw error',
          data: error.stack ?? error.toString(),
        };
        throw new JsonrpcCostomError(internalError);
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
  } catch (error: any) {
    const invalidRequest = {
      code: JsonrpcErrorCode.InvalidRequest,
      message: 'stringify error in client end',
      data: error.stack ?? error.toString(),
    };
    throw new JsonrpcCostomError(invalidRequest);
  }
}
