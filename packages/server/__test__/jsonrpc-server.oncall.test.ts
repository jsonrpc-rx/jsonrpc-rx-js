import { describe, it } from 'vitest';
import { JsonrpcErrorMessage } from '@jsonrpc-rx/core';
import { getJsonrpcInstance } from './util/get-jsonrpc-instance';

describe('onCall', () => {
  it('onCall method invalid params', async ({ expect }) => {
    const { jsonrpcServer } = getJsonrpcInstance({ delay: 100 });

    try {
      await jsonrpcServer.onCall('method', '123' as any);
    } catch (error) {
      expect(error.toString()).includes(JsonrpcErrorMessage.InternalError);
      expect(error.toString()).includes('the parameters invalid');
    }
  });

  it('onCall method repeated', async ({ expect }) => {
    const { jsonrpcServer } = getJsonrpcInstance({ delay: 100 });
    jsonrpcServer.onCall('repeatMethod', () => {});

    try {
      await jsonrpcServer.onCall('repeatMethod', () => {});
    } catch (error) {
      expect(error.toString()).includes(JsonrpcErrorMessage.InternalError);
      expect(error.toString()).includes('repeated');
    }
  });

  it('onCall method disposable', async ({ expect }) => {
    const { jsonrpcServer, jsonrpcClient } = getJsonrpcInstance({ delay: 100 });
    const disposable = jsonrpcServer.onCall('disposableMethod', () => {
      return true;
    });

    const result = await jsonrpcClient.call('disposableMethod');
    expect(result).toBeTruthy();

    disposable.dispose();
    try {
      await jsonrpcClient.call('disposableMethod');
    } catch (error) {
      expect(error.toString()).includes(JsonrpcErrorMessage.MethodNotFound);
    }
  });

  it('onCall callHandler throw error', async ({ expect }) => {
    const { jsonrpcServer, jsonrpcClient } = getJsonrpcInstance({ delay: 100 });
    jsonrpcServer.onCall('errorMethod', () => {
      return Promise.reject('error');
    });

    try {
      await jsonrpcClient.call('errorMethod');
    } catch (error) {
       expect(error.message).includes('the call handler throw error');
    }
  });
});
