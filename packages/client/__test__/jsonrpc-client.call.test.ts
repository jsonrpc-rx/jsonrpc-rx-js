import { describe, it } from 'vitest';
import { getJsonrpcInstance } from './util/get-jsonrpc-instance';
import { JsonrpcErrorMessage } from '@cec/jsonrpc-server';

describe('call', () => {
  it('call method sum', async ({ expect }) => {
    const { jsonrpcClient, jsonrpcServer } = getJsonrpcInstance({ delay: 100 });

    jsonrpcServer.onCall<[number, number]>('sum', ([a, b]) => a + b);
    const result = await jsonrpcClient.call<number>('sum', [1, 2]);
    expect(result).toEqual(3);
  });

  it('call throw error', async ({ expect }) => {
    const { jsonrpcClient, jsonrpcServer } = getJsonrpcInstance({ delay: 100 });

    jsonrpcServer.onCall('errorMethod', () => {
      JSON.parse('{"a":1');
    });

    try {
      await jsonrpcClient.call<number>('errorMethod');
    } catch (error) {
      expect(error.toString()).includes(JsonrpcErrorMessage.ServerError);
    }
  });

  it('call timeout', async ({ expect }) => {
    const { jsonrpcClient, jsonrpcServer } = getJsonrpcInstance({ delay: 100, client: { timeout: 99 } });

    jsonrpcServer.onCall('timeout', () => {});
    try {
      await jsonrpcClient.call('timeout');
    } catch (error) {
      expect(error.toString()).includes(JsonrpcErrorMessage.InternalError);
      expect(error.toString()).includes('timeout');
    }
  });

  it('call method not found', async ({ expect }) => {
    const { jsonrpcClient } = getJsonrpcInstance({ delay: 100 });

    try {
      await jsonrpcClient.call('notMethod');
    } catch (error) {
      expect(error.toString()).includes(JsonrpcErrorMessage.MethodNotFound);
    }
  });

  it('call method invalid params', async ({ expect }) => {
    const { jsonrpcClient } = getJsonrpcInstance({ delay: 100 });

    try {
      await jsonrpcClient.call('notMethod', 'params' as any);
    } catch (error) {
      expect(error.toString()).includes('the parameters invalid');
    }
  });

  it('call throw error on send', async ({ expect }) => {
    const { jsonrpcClient, jsonrpcServer } = getJsonrpcInstance({ delay: 100 });

    jsonrpcServer.onCall('errorMethod', () => {});

    try {
      await jsonrpcClient.call<number>('errorMethod', [BigInt(123123123123)]);
    } catch (error) {
      expect(error.toString()).includes(JsonrpcErrorMessage.InvalidRequest);
    }
  });
});
