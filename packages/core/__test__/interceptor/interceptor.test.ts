import { it } from 'vitest';
import {
  JsonrpcRequestBody,
  composeInterceptors,
  composeAsPromise,
  InterceptorEnvInfo,
  MessageBody,
  JsonrpcEnd,
  MessageType,
} from '../../src';

it('compose normal', async ({ expect }) => {
  const func01 = (a) => a * 1;
  const func02 = (a) => a * 2;
  const funcPromise = (a) => Promise.resolve(a * 3);
  const func03 = (a) => a * 4;

  const allFunc = composeAsPromise([func01, func02, funcPromise, func03]);
  const result = await allFunc(2);
  expect(result).toEqual(2 * 1 * 2 * 3 * 4);
});

it('compose error', async ({ expect }) => {
  const func01 = (a) => a * 1;
  const funcPromise = () => Promise.reject('compose error');
  const func02 = (a) => a * 2;

  const allFunc = composeAsPromise([func01, funcPromise, func02]);
  try {
    await allFunc(2);
  } catch (error) {
    expect(error.toString().includes('compose error')).toBeTruthy();
  }
});

it('composeInterceptors normal', async ({ expect }) => {
  const interceptor1 = (envInfo: InterceptorEnvInfo) => (messageBody: MessageBody) => Promise.resolve(messageBody);
  const interceptor2 = (envInfo: InterceptorEnvInfo) => (messageBody: MessageBody) => JSON.parse(JSON.stringify(messageBody));
  const interceptor3 = (envInfo: InterceptorEnvInfo) => undefined;

  const interceptors = [interceptor1, interceptor2, interceptor3].map((item) => ({
    interceptor: item,
    envInfo: { end: JsonrpcEnd.Client, type: MessageType.Request },
    safeContext: {},
  }));
  const allFunc = composeInterceptors(interceptors);
  const param: JsonrpcRequestBody = { jsonrpc: '2.0', method: 'test', params: [1, 2], id: 1 };
  const result = await allFunc(param);
  expect(result).toStrictEqual(param);
});

it('composeInterceptors error', async ({ expect }) => {
  const interceptor1 = (envInfo: InterceptorEnvInfo) => (messageBody: MessageBody) => Promise.resolve(messageBody);
  const interceptor2 = (envInfo: InterceptorEnvInfo) => (messageBody: MessageBody) => Promise.reject('interceptor error');

  const interceptors = [interceptor1, interceptor2].map((item) => ({
    interceptor: item,
    envInfo: { end: JsonrpcEnd.Client, type: MessageType.Request },
    safeContext: {},
  }));
  const allFunc = composeInterceptors(interceptors);
  const param: JsonrpcRequestBody = { jsonrpc: '2.0', method: 'test', params: [1, 2], id: 1 };
  try {
    await allFunc(param);
  } catch (error) {
    expect(error.toString().includes('interceptor error')).toBeTruthy();
  }
});
