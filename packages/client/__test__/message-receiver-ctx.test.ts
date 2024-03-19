import {
  JsonrpcRequestBody,
  JsonrpcResponseBody,
  MessageHandler,
  MessageReceiver,
  Interceptor,
  MessageType,
  MessageBody,
} from '@cec/jsonrpc-core';
import { MessageReceiverCtx } from '../src/message-receiver-ctx';
import { describe, it } from 'vitest';
import { stringify } from 'flatted';

describe('MessageReceiverCtx normal', () => {
  let messageHandler: MessageHandler;
  const messageReceiver: MessageReceiver = (handler) => (messageHandler = handler);
  const messageReceiverCtx = new MessageReceiverCtx(messageReceiver, []);

  let receiveResponseBody: JsonrpcResponseBody;
  messageReceiverCtx.receive((responseBody) => {
    receiveResponseBody = responseBody as JsonrpcResponseBody;
  });

  const responseBody: JsonrpcResponseBody = { jsonrpc: '2.0', id: 'xxx', result: 1 };
  messageHandler!(stringify(responseBody));

  it('MessageReceiverCtx normal 01', ({ expect }) => expect(receiveResponseBody).toStrictEqual(responseBody));
});

describe('MessageReceiverCtx error', async () => {
  let messageHandler: MessageHandler;
  const messageReceiver: MessageReceiver = (handler) => (messageHandler = handler);
  const messageReceiverCtx = new MessageReceiverCtx(messageReceiver, []);

  let receiveResponseBody: JsonrpcResponseBody;
  messageReceiverCtx.receive((responseBody) => {
    receiveResponseBody = responseBody as JsonrpcResponseBody;
  });

  const requestBody: JsonrpcRequestBody = { jsonrpc: '2.0', id: 'xxx', method: 'xxx' };
  messageHandler!(stringify(requestBody));
  it('MessageReceiverCtx error receive requestBody', ({ expect }) => expect(receiveResponseBody).toBeUndefined());

  messageHandler!(stringify(null as any));
  it('MessageReceiverCtx error receive null', ({ expect }) => expect(receiveResponseBody).toBeUndefined());
});

describe('MessageReceiverCtx ResponseInterceptor', async () => {
  let messageHandler: MessageHandler;
  const messageReceiver: MessageReceiver = (handler) => (messageHandler = handler);

  const interceptor01: Interceptor = (envInfo) => {
    if ((envInfo.type = MessageType.Response)) {
      return (messageBody: MessageBody) => {
        const responseBody = messageBody as JsonrpcResponseBody;
        responseBody.result = [1, 2, 3];
        return responseBody;
      };
    }
  };
  const interceptor02: Interceptor = (envInfo) => {
    if ((envInfo.type = MessageType.Response)) {
      return () => {};
    }
  };
  const interceptor03: Interceptor = (envInfo) => () => {
    if ((envInfo.type = MessageType.Response)) {
      throw new Error('error coming');
    }
  };

  const messageReceiverCtx01 = new MessageReceiverCtx(messageReceiver, [{}], {
    interceptors: [interceptor01],
  });
  let receiveResponseBody01: JsonrpcResponseBody;
  messageReceiverCtx01.receive((responseBody) => {
    receiveResponseBody01 = responseBody as JsonrpcResponseBody;
  });
  const responseBody01: JsonrpcResponseBody = { jsonrpc: '2.0', id: 'xxx' };
  const changedResponseBody01: JsonrpcResponseBody = { jsonrpc: '2.0', id: 'xxx', result: [1, 2, 3] };
  messageHandler!(stringify(responseBody01));
  it('MessageReceiverCtx ResponseInterceptor change value', ({ expect }) => {
    expect(changedResponseBody01).toStrictEqual(receiveResponseBody01);
  });

  const messageReceiverCtx02 = new MessageReceiverCtx(messageReceiver, [{}, {}], {
    interceptors: [interceptor01, interceptor02],
  });
  let receiveResponseBody02: JsonrpcResponseBody;
  messageReceiverCtx02.receive((responseBody) => {
    receiveResponseBody02 = responseBody as JsonrpcResponseBody;
  });
  messageHandler!(stringify({ jsonrpc: '2.0', id: 'xxx' }));
  it('MessageReceiverCtx ResponseInterceptor with null', ({ expect }) => {
    expect(receiveResponseBody02).toBeUndefined();
  });

  const messageReceiverCtx03 = new MessageReceiverCtx(messageReceiver, [{}, {}, {}], {
    interceptors: [interceptor01, interceptor02, interceptor03],
  });
  let receiveResponseBody03: JsonrpcResponseBody;
  messageReceiverCtx03.receive((responseBody) => {
    receiveResponseBody03 = responseBody as JsonrpcResponseBody;
  });
  messageHandler!(stringify({ jsonrpc: '2.0', id: 'xxx' }));
  it('MessageReceiverCtx ResponseInterceptor occur error 01', ({ expect }) => {
    expect(receiveResponseBody03.error).toBeDefined();
  });

  const messageReceiverCtx04 = new MessageReceiverCtx(messageReceiver, []);
  messageReceiverCtx04.receive(() => {});
  it('MessageReceiverCtx ResponseInterceptor occur error 02', ({ expect }) => {
    expect(messageHandler!('{ "jsonrpc": "2.0",')).rejects.toThrowError();
  });
});
