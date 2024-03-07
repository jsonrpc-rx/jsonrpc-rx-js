import { isJsonrpcRequestBody, isJsonrpcResponseBody, JsonrpcResponseBody, JsonrpcRequestBody } from '../../src';
import { it } from 'vitest';

it('isJsonrpcRequestBody', ({ expect }) => {
  const requestBody01: JsonrpcRequestBody = {
    jsonrpc: '2.0',
    method: 'xxx',
  };
  const requestBody02: any = {
    jsonrpc: '2.0',
  };
  expect(isJsonrpcRequestBody(requestBody01)).toBeTruthy();
  expect(isJsonrpcRequestBody(requestBody02)).toBeFalsy();
});

it('isJsonrpcResponseBody', ({ expect }) => {
  const responsetBody01: JsonrpcResponseBody = {
    jsonrpc: '2.0',
    id: 'qwerty',
  };
  const responsetBody02: any = {
    jsonrpc: '2.0',
    method: 'xxx',
  };
  expect(isJsonrpcResponseBody(responsetBody01)).toBeTruthy();
  expect(isJsonrpcResponseBody(responsetBody02)).toBeFalsy();
});
