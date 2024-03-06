import { describe, it } from 'vitest';
import { isJsonrpcRequestBodyParams, validJsonrpcResquestBody } from '../../src/jsonrpc/jsonrpc-request-body';

describe('isJsonrpcRequestBodyParams', async () => {
  const isParams01 = isJsonrpcRequestBodyParams({});
  const isParams02 = isJsonrpcRequestBodyParams([]);
  const isParams03 = isJsonrpcRequestBodyParams(void 0);
  const isParams04 = isJsonrpcRequestBodyParams('' as any);
  it('isJsonrpcRequestBodyParams when object', async ({ expect }) => expect(isParams01).toBeTruthy());
  it('isJsonrpcRequestBodyParams when array', async ({ expect }) => expect(isParams02).toBeTruthy());
  it('isJsonrpcRequestBodyParams when undefind', async ({ expect }) => expect(isParams03).toBeTruthy());
  it('isJsonrpcRequestBodyParams when string', async ({ expect }) => expect(isParams04).toBeFalsy());
});

describe('validJsonrpcResquestBody error', () => {
  const resquestBody01 = undefined;
  const resquestBody02 = {
    jsonrpc: '1.0',
    method: 'xxx',
  };
  const resquestBody03 = {
    jsonrpc: '2.0',
    method: 'xxx',
    id: Symbol(),
  };
  const resquestBody04 = {
    jsonrpc: '2.0',
    method: 1,
  };
  const resquestBody05 = {
    jsonrpc: '2.0',
    method: 'xxx',
    params: 1,
  };

  const { validMessage: validMessage01 } = validJsonrpcResquestBody(resquestBody01);
  const { validMessage: validMessage02 } = validJsonrpcResquestBody(resquestBody02);
  const { validMessage: validMessage03 } = validJsonrpcResquestBody(resquestBody03);
  const { validMessage: validMessage04 } = validJsonrpcResquestBody(resquestBody04);
  const { validMessage: validMessage05 } = validJsonrpcResquestBody(resquestBody05);

  const isValidMessage01 = validMessage01.includes('MUST be object');
  const isValidMessage02 = validMessage02.includes('MUST be exactly "2.0"');
  const isValidMessage03 = validMessage03.includes('MUST contain a a String, Number, or NULL');
  const isValidMessage04 = validMessage04.includes('call MUST be String');
  const isValidMessage05 = validMessage05.includes('call MUST contain a Object, Array, or NULL');

  it('validJsonrpcResquestBody error 01', async ({ expect }) => expect(isValidMessage01).toBeTruthy());
  it('validJsonrpcResquestBody error 02', async ({ expect }) => expect(isValidMessage02).toBeTruthy());
  it('validJsonrpcResquestBody error 03', async ({ expect }) => expect(isValidMessage03).toBeTruthy());
  it('validJsonrpcResquestBody error 04', async ({ expect }) => expect(isValidMessage04).toBeTruthy());
  it('validJsonrpcResquestBody error 05', async ({ expect }) => expect(isValidMessage05).toBeTruthy());
});

describe('validJsonrpcResquestBody normal', () => {
  const resquestBody01 = {
    id: 'qwertyuio',
    jsonrpc: '2.0',
    method: 'xxx',
    params: [1, 2],
  };
  const resquestBody02 = {
    id: 'qwertyuio',
    jsonrpc: '2.0',
    method: 'xxx',
  };
  const resquestBody03 = {
    jsonrpc: '2.0',
    method: 'xxx',
  };

  const { isValid: isValid01 } = validJsonrpcResquestBody(resquestBody01);
  const { isValid: isValid02 } = validJsonrpcResquestBody(resquestBody02);
  const { isValid: isValid03 } = validJsonrpcResquestBody(resquestBody03);

  it('validJsonrpcResquestBody normal 01', async ({ expect }) => expect(isValid01).toBeTruthy());
  it('validJsonrpcResquestBody normal 02', async ({ expect }) => expect(isValid02).toBeTruthy());
  it('validJsonrpcResquestBody normal 03', async ({ expect }) => expect(isValid03).toBeTruthy());
});
