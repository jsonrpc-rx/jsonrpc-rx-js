import { JsonrpcErrorMessage, JsonrpcError, JsonrpcErrorCode, validJsonrpcError, JsonrpcCostomError } from '../../src';
import { describe, it } from 'vitest';
import { jsonrpcErrorCodeMessageMap } from '../../src/jsonrpc/jsonrpc-error';

describe('isJsonrpcBaseConfig normal', async () => {
  const jsonrpcError01: JsonrpcError = {
    code: JsonrpcErrorCode.InternalError,
    message: JsonrpcErrorMessage.InternalError + ': ' + 'xxx',
    data: 'xxx',
  };

  const jsonrpcError02: JsonrpcError = {
    code: JsonrpcErrorCode.ServerError,
    message: JsonrpcErrorMessage.ServerError,
  };

  const { isValid: isValid01 } = validJsonrpcError(jsonrpcError01);
  const { isValid: isValid02 } = validJsonrpcError(jsonrpcError02);

  it('isJsonrpcBaseConfig normal 01', async ({ expect }) => expect(isValid01).toBeTruthy());
  it('isJsonrpcBaseConfig normal 02', async ({ expect }) => expect(isValid02).toBeTruthy());
});

describe('isJsonrpcBaseConfig error', () => {
  const jsonrpcError01: any = undefined;
  const jsonrpcError02: any = {
    code: 123,
    message: 'xxx',
  };
  const jsonrpcError03: any = {
    code: JsonrpcErrorCode.InternalError,
    message: 123,
  };

  const { validMessage: validMessage01 } = validJsonrpcError(jsonrpcError01);
  const { validMessage: validMessage02 } = validJsonrpcError(jsonrpcError02);
  const { validMessage: validMessage03 } = validJsonrpcError(jsonrpcError03);

  const isValidMessage01 = validMessage01.includes('MUST be object');
  const isValidMessage02 = validMessage02.includes('-32700, -32600, -32601, -32602, -32603, or -32000 to -32099');
  const isValidMessage03 = validMessage03.includes('A String providing');

  it('isJsonrpcBaseConfig error 01', async ({ expect }) => expect(isValidMessage01).toBeTruthy());
  it('isJsonrpcBaseConfig error 02', async ({ expect }) => expect(isValidMessage02).toBeTruthy());
  it('isJsonrpcBaseConfig error 03', async ({ expect }) => expect(isValidMessage03).toBeTruthy());
});

it('JsonrpcCostomError', async ({ expect }) => {
  const jsonrpcError = {
    code: JsonrpcErrorCode.InternalError,
    message: 'it is a test error',
  };
  const error = new JsonrpcCostomError(jsonrpcError);

  const name = `[${jsonrpcError.code}]${jsonrpcErrorCodeMessageMap[jsonrpcError.code]}`;

  // console.error(error);

  expect(error.name).toEqual(name);
});
