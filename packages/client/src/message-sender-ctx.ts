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
  JsonrpcEnd,
  MessageType,
} from '@cec/jsonrpc-core';

export class MessageSenderCtx {
  constructor(
    private messageSender: MessageSender,
    private baseConfig?: JsonrpcBaseConfig,
  ) {}

  send = async (messageBody: MessageBody) => {
    let requestBody = messageBody as JsonrpcRequestBody;

    if (this.baseConfig?.interceptors?.length) {
      try {
        const interceptor = composeInterceptors(this.baseConfig?.interceptors!, { end: JsonrpcEnd.Client, type: MessageType.Request });
        requestBody = await invokeAsPromise(interceptor, messageBody);
      } catch (error: any) {
        const internalError = {
          code: JsonrpcErrorCode.InternalError,
          message: 'the request interceptors throw error',
          data: error.stack,
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
      data: error.stack,
    };
    throw new JsonrpcCostomError(invalidRequest);
  }
}
