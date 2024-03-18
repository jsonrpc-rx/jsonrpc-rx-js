import { Interceptor, JsonrpcErrorCode, JsonrpcResponseBody, MessageSender, MessageType } from '@cec/jsonrpc-core';
import { MessageSenderCtx } from '../src/message-sender-ctx';
import { describe, it } from 'vitest';
import { parse, stringify } from 'flatted';

describe('MessageSenderCtx normal', () => {
  let sendMessage = '';
  const messageSender: MessageSender = (message: string) => (sendMessage = message);
  const messageSenderCtx = new MessageSenderCtx(messageSender);
  const messageBody: JsonrpcResponseBody = {
    jsonrpc: '2.0',
    id: 'qwertyu',
    result: [1, 2, 3],
  };
  messageSenderCtx.send(messageBody);
  it('MessageSenderCtx normal 01', ({ expect }) => expect(stringify(messageBody)).toStrictEqual(sendMessage));
});

describe('MessageSenderCtx error', () => {
  let sendMessage = '';
  const messageSender: MessageSender = (message: string) => (sendMessage = message);
  const messageSenderCtx = new MessageSenderCtx(messageSender);
  const messageBody: JsonrpcResponseBody = {
    jsonrpc: '2.0',
    id: '123',
    result: [BigInt(9007199254740991)],
  };
  messageSenderCtx.send(messageBody);
  it('MessageSenderCtx error 01', ({ expect }) => {
    expect(parse(sendMessage).error?.code).toEqual(JsonrpcErrorCode.ServerError);
  });
});

describe('MessageSenderCtx RequestInterceptor', async () => {
  const interceptor01: Interceptor = (envInfo) => {
    if ((envInfo.type = MessageType.Response)) {
      return (responseBody) => {
        return {
          ...responseBody,
          result: [1, 2, 3],
        };
      };
    }
  };
  const interceptor02: Interceptor = (envInfo) => {
    if ((envInfo.type = MessageType.Response)) {
      return (responseBody) => {
        return responseBody;
      };
    }
  };
  const interceptor03: Interceptor = (envInfo) => {
    if ((envInfo.type = MessageType.Response)) {
      return () => {
        throw new Error('error coming');
      };
    }
  };
  const interceptor04: Interceptor = (envInfo) => {
    if ((envInfo.type = MessageType.Response)) {
      return () => {};
    }
  };

  const messageBody: JsonrpcResponseBody = { jsonrpc: '2.0', id: 'qwe' };
  const messageBodyFilted: JsonrpcResponseBody = { jsonrpc: '2.0', id: 'qwe', result: [1, 2, 3] };

  let sendMessage01: string = '';
  const messageSenderCtx01 = new MessageSenderCtx((responseBody) => (sendMessage01 = responseBody), {
    interceptors: [interceptor01, interceptor02],
  });
  messageSenderCtx01.send(messageBody);
  it('MessageSenderCtx RequestInterceptor change value', ({ expect }) => {
    expect(stringify(messageBodyFilted)).toStrictEqual(sendMessage01);
  });

  let sendMessage02: string = '';
  const messageSenderCtx02 = new MessageSenderCtx(() => {}, {
    interceptors: [interceptor01, interceptor02, interceptor04],
  });
  messageSenderCtx02.send(messageBody);
  it('MessageSenderCtx RequestInterceptor in void', async ({ expect }) => {
    await expect(sendMessage02).toEqual('');
  });

  let sendMessage03: string = '';
  const messageSenderCtx03 = new MessageSenderCtx((responseBody) => (sendMessage03 = responseBody), {
    interceptors: [interceptor01, interceptor02, interceptor03],
  });
  messageSenderCtx03.send(messageBody);
  it('MessageSenderCtx RequestInterceptor occur error 01', async ({ expect }) => {
    await expect(parse(sendMessage03)?.error?.code).toEqual(JsonrpcErrorCode.ServerError);
  });
});
