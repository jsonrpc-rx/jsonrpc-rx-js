import { describe, it } from 'vitest';
import { JsonrpcResponseBody, validJsonrpcResponseBody } from '../../src/jsonrpc/jsonrpc-response-body';
import { JsonrpcErrorMessage, JsonrpcErrorCode } from '../../src/jsonrpc/jsonrpc-error';

describe('validJsonrpcResponseBody error', () => {
  const responseBody01 = undefined;
  const responseBody02 = {
    jsonrpc: '1.0',
    id: 'xxx',
  };
  const responseBody03 = {
    jsonrpc: '2.0',
    id: Symbol(),
  };
  const responseBody04 = {
    jsonrpc: '2.0',
    id: 'xxx',
    error: 'error',
  };

  const { validMessage: validMessage01 } = validJsonrpcResponseBody(responseBody01);
  const { validMessage: validMessage02 } = validJsonrpcResponseBody(responseBody02);
  const { validMessage: validMessage03 } = validJsonrpcResponseBody(responseBody03);
  const { validMessage: validMessage04 } = validJsonrpcResponseBody(responseBody04);

  const isValidMessage01 = validMessage01.includes('MUST be object');
  const isValidMessage02 = validMessage02.includes('MUST be exactly "2.0"');
  const isValidMessage03 = validMessage03.includes('MUST contain a a String, or Number');
  const isValidMessage04 = validMessage04.length > 0;

  it('validJsonrpcResponseBody error 01', async ({ expect }) => expect(isValidMessage01).toBeTruthy());
  it('validJsonrpcResponseBody error 02', async ({ expect }) => expect(isValidMessage02).toBeTruthy());
  it('validJsonrpcResponseBody error 03', async ({ expect }) => expect(isValidMessage03).toBeTruthy());
  it('validJsonrpcResponseBody error 04', async ({ expect }) => expect(isValidMessage04).toBeTruthy());
});

describe('validJsonrpcResponseBody normal', () => {
  const responseBody01 = {
    id: 'qwertyuio',
    jsonrpc: '2.0',
    result: 'xxx',
  };
  const responseBody02: JsonrpcResponseBody = {
    id: 'qwertyuio',
    jsonrpc: '2.0',
    error: {
      code: JsonrpcErrorCode.InternalError,
      message: JsonrpcErrorMessage.InternalError,
    },
  };
  const responseBody03 = {
    id: 'qwertyuio',
    jsonrpc: '2.0',
  };

  const { isValid: isValid01 } = validJsonrpcResponseBody(responseBody01);
  const { isValid: isValid02 } = validJsonrpcResponseBody(responseBody02);
  const { isValid: isValid03 } = validJsonrpcResponseBody(responseBody03);

  it('validJsonrpcResponseBody normal 01', async ({ expect }) => expect(isValid01).toBeTruthy());
  it('validJsonrpcResponseBody normal 02', async ({ expect }) => expect(isValid02).toBeTruthy());
  it('validJsonrpcResponseBody normal 03', async ({ expect }) => expect(isValid03).toBeTruthy());
});
