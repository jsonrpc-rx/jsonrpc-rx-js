import {
  JsonrpcBaseConfig,
  isJsonrpcBaseConfig,
  InterceptorEnvInfo,
  MessageBody,
} from '../../src';
import { describe, it } from 'vitest';

describe('isJsonrpcBaseConfig normal', async () => {
  const jsonrpcBaseConfig01: JsonrpcBaseConfig = {
    interceptors: [(envInfo: InterceptorEnvInfo) => (messageBody: MessageBody) => Promise.resolve(messageBody)],
  };
  const jsonrpcBaseConfig03: JsonrpcBaseConfig = {};
  const jsonrpcBaseConfig05: JsonrpcBaseConfig = {
    interceptors: [],
  };

  it('isJsonrpcBaseConfig normal 01', async ({ expect }) => expect(isJsonrpcBaseConfig(jsonrpcBaseConfig01)).toBeTruthy());
  it('isJsonrpcBaseConfig normal 03', async ({ expect }) => expect(isJsonrpcBaseConfig(jsonrpcBaseConfig03)).toBeTruthy());
  it('isJsonrpcBaseConfig normal 05', async ({ expect }) => expect(isJsonrpcBaseConfig(jsonrpcBaseConfig05)).toBeTruthy());
  it('isJsonrpcBaseConfig normal 05', async ({ expect }) => expect(isJsonrpcBaseConfig(undefined)).toBeTruthy());
});

describe('isJsonrpcBaseConfig error', async () => {
  const jsonrpcBaseConfig01: any = {
    interceptors: [[], {}],
  };
  const jsonrpcBaseConfig02: any = {
    interceptors: [1, ''],
  };

  it('isJsonrpcBaseConfig error 01', async ({ expect }) => expect(isJsonrpcBaseConfig(jsonrpcBaseConfig01)).toBeFalsy());
  it('isJsonrpcBaseConfig error 02', async ({ expect }) => expect(isJsonrpcBaseConfig(jsonrpcBaseConfig02)).toBeFalsy());
});
