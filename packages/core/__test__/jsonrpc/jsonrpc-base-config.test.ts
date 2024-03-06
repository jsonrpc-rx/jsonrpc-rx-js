import { JsonrpcBaseConfig, composeAsPromise, composeInterceptors, isJsonrpcBaseConfig } from '../../src/jsonrpc/jsonrpc-base-config';
import { JsonrpcRequestBody } from '../../src/jsonrpc/jsonrpc-request-body';
import { JsonrpcResponseBody } from '../../src/jsonrpc/jsonrpc-response-body';
import { describe, it } from 'vitest';

describe('isJsonrpcBaseConfig normal', async () => {
  const jsonrpcBaseConfig01: JsonrpcBaseConfig = {
    requestInterceptors: [(requestBody: JsonrpcRequestBody) => Promise.resolve(requestBody)],
  };
  const jsonrpcBaseConfig02: JsonrpcBaseConfig = {
    responseInterceptors: [(responseBody: JsonrpcResponseBody) => Promise.resolve(responseBody)],
  };
  const jsonrpcBaseConfig03: JsonrpcBaseConfig = {};
  const jsonrpcBaseConfig04: JsonrpcBaseConfig = {
    requestInterceptors: [(requestBody: JsonrpcRequestBody) => Promise.resolve(requestBody)],
    responseInterceptors: [(responseBody: JsonrpcResponseBody) => Promise.resolve(responseBody)],
  };
  const jsonrpcBaseConfig05: JsonrpcBaseConfig = {
    requestInterceptors: [],
    responseInterceptors: [],
  };

  it('isJsonrpcBaseConfig normal 01', async ({ expect }) => expect(isJsonrpcBaseConfig(jsonrpcBaseConfig01)).toBeTruthy());
  it('isJsonrpcBaseConfig normal 02', async ({ expect }) => expect(isJsonrpcBaseConfig(jsonrpcBaseConfig02)).toBeTruthy());
  it('isJsonrpcBaseConfig normal 03', async ({ expect }) => expect(isJsonrpcBaseConfig(jsonrpcBaseConfig03)).toBeTruthy());
  it('isJsonrpcBaseConfig normal 04', async ({ expect }) => expect(isJsonrpcBaseConfig(jsonrpcBaseConfig04)).toBeTruthy());
  it('isJsonrpcBaseConfig normal 05', async ({ expect }) => expect(isJsonrpcBaseConfig(jsonrpcBaseConfig05)).toBeTruthy());
  it('isJsonrpcBaseConfig normal 05', async ({ expect }) => expect(isJsonrpcBaseConfig(undefined)).toBeTruthy());
});

describe('isJsonrpcBaseConfig error', async () => {
  const jsonrpcBaseConfig01: any = {
    requestInterceptors: [[], {}],
  };
  const jsonrpcBaseConfig02: any  = {
    responseInterceptors: [1, ''],
  };

  it('isJsonrpcBaseConfig error 01', async ({ expect }) => expect(isJsonrpcBaseConfig(jsonrpcBaseConfig01)).toBeFalsy());
  it('isJsonrpcBaseConfig error 02', async ({ expect }) => expect(isJsonrpcBaseConfig(jsonrpcBaseConfig02)).toBeFalsy());
});

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
  const interceptor1 = (requestBody: JsonrpcRequestBody) => Promise.resolve(requestBody);
  const interceptor2 = (requestBody: JsonrpcRequestBody) => JSON.parse(JSON.stringify(requestBody));

  const allFunc = composeInterceptors([interceptor1, interceptor2]);
  const param: JsonrpcRequestBody = { jsonrpc: '2.0', method: 'test', params: [1, 2], id: 1 };
  const result = await allFunc(param);
  expect(result).toStrictEqual(param);
});

it('composeInterceptors error', async ({ expect }) => {
  const interceptor1 = (requestBody: JsonrpcRequestBody) => Promise.resolve(requestBody);
  const interceptor2 = (requestBody: JsonrpcRequestBody) => Promise.reject('interceptor error');

  const allFunc = composeInterceptors([interceptor1, interceptor2]);
  const param: JsonrpcRequestBody = { jsonrpc: '2.0', method: 'test', params: [1, 2], id: 1 };
  try {
    await allFunc(param);
  } catch (error) {
    expect(error.toString().includes('interceptor error')).toBeTruthy();
  }
});
