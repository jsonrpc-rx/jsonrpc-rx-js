import {
  JsonrpcErrorCode,
  JsonrpcRequestBody,
  JsonrpcResponseBody,
  MessageHandler,
  MessageReceiver,
  RequestInterceptor,
} from '@cec/jsonrpc-core';
import { MessageReceiverCtx } from '../src/message-receiver-ctx';
import { describe, it } from 'vitest';
import { stringify } from 'flatted';

describe('MessageReceiverCtx normal', () => {
  let messageHandler: MessageHandler;
  const messageReceiver: MessageReceiver = (handler) => (messageHandler = handler);
  const messageReceiverCtx = new MessageReceiverCtx(messageReceiver);

  let receiveRequestBody: JsonrpcRequestBody;
  messageReceiverCtx.receive((requestBody) => {
    receiveRequestBody = requestBody as JsonrpcRequestBody;
  });

  const requestBody: JsonrpcRequestBody = { jsonrpc: '2.0', id: 'xxx', method: 'xxx' };
  messageHandler!(stringify(requestBody));

  it('MessageReceiverCtx normal 01', ({ expect }) => expect(receiveRequestBody).toStrictEqual(requestBody));
});

describe('MessageReceiverCtx error', async () => {
  let messageHandler: MessageHandler;
  const messageReceiver: MessageReceiver = (handler) => (messageHandler = handler);
  const messageReceiverCtx = new MessageReceiverCtx(messageReceiver);

  let receiveRequestBody: JsonrpcRequestBody;
  messageReceiverCtx.receive((requestBody) => {
    receiveRequestBody = requestBody as JsonrpcRequestBody;
  });

  const responseBody: JsonrpcResponseBody = { jsonrpc: '2.0', id: 'xxx' };
  messageHandler!(stringify(responseBody));
  it('MessageReceiverCtx error receive requestBody', ({ expect }) => expect(receiveRequestBody).toBeUndefined());

  messageHandler!(stringify(null as any));
  it('MessageReceiverCtx error receive null', ({ expect }) => expect(receiveRequestBody).toBeUndefined());
});

describe('MessageReceiverCtx ResponseInterceptor', async () => {
  let messageHandler: MessageHandler;
  const messageReceiver: MessageReceiver = (handler) => (messageHandler = handler);

  const interceptor01: RequestInterceptor = (requestBody: JsonrpcRequestBody) => {
    requestBody.params = [1, 2, 3];
    return requestBody;
  };
  const interceptor02: RequestInterceptor = () => {};
  const interceptor03: RequestInterceptor = () => {
    throw new Error('error coming');
  };

  const messageReceiverCtx01 = new MessageReceiverCtx(messageReceiver, {
    requestInterceptors: [interceptor01],
  });
  let receiveRequestBody01: JsonrpcRequestBody;
  messageReceiverCtx01.receive((requestBody) => {
    receiveRequestBody01 = requestBody as JsonrpcRequestBody;
  });
  const requestBody01: JsonrpcRequestBody = { jsonrpc: '2.0', id: 'xxx', method: 'xxx' };
  const changedRequestBody01: JsonrpcRequestBody = { jsonrpc: '2.0', id: 'xxx', method: 'xxx', params: [1, 2, 3] };
  messageHandler!(stringify(requestBody01));
  it('MessageReceiverCtx ResponseInterceptor change value', ({ expect }) => {
    expect(changedRequestBody01).toStrictEqual(receiveRequestBody01);
  });

  const messageReceiverCtx02 = new MessageReceiverCtx(messageReceiver, {
    requestInterceptors: [interceptor01, interceptor02],
  });
  let receiveRequestBody02: JsonrpcRequestBody;
  messageReceiverCtx02.receive((requestBody) => {
    receiveRequestBody02 = requestBody as JsonrpcRequestBody;
  });
  messageHandler!(stringify({ jsonrpc: '2.0', id: 'xxx', method: 'xxx' }));
  it('MessageReceiverCtx ResponseInterceptor with null', ({ expect }) => {
    expect(receiveRequestBody02).toBeUndefined();
  });

  const messageReceiverCtx03 = new MessageReceiverCtx(messageReceiver, {
    requestInterceptors: [interceptor01, interceptor02, interceptor03],
  });
  let receiveRequestBody03: any;
  messageReceiverCtx03.receive((requestBody) => {
    receiveRequestBody03 = requestBody;
  });
  messageHandler!(stringify({ jsonrpc: '2.0', id: 'xxx', method: 'xxx' }));
  it('MessageReceiverCtx ResponseInterceptor occur error 01', ({ expect }) => {
    expect(receiveRequestBody03.error.code).toEqual(JsonrpcErrorCode.ServerError);
  });

  const messageReceiverCtx04 = new MessageReceiverCtx(messageReceiver);
  messageReceiverCtx04.receive(() => {});
  it('MessageReceiverCtx ResponseInterceptor occur error 02', ({ expect }) => {
    expect(messageHandler!('{ "jsonrpc": "2.0",')).rejects.toThrowError();
  });
});
