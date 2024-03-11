import { describe, it } from 'vitest';
import { getJsonrpcInstance } from './util/get-jsonrpc-instance';
import { JsonrpcErrorMessage } from '@cec/jsonrpc-client';

describe('onNotify', () => {
  it('onNotify invalid params', async ({ expect }) => {
    const { jsonrpcServer } = getJsonrpcInstance({ delay: 100 });
    try {
      await jsonrpcServer.onCall('errorMethod', 'errorParams' as any);
    } catch (error) {
      expect(error.toString()).includes(JsonrpcErrorMessage.InternalError);
      expect(error.toString()).includes('the parameters invalid');
    }
  });

  it('onNotify notify name repeated', async ({ expect }) => {
    const { jsonrpcServer } = getJsonrpcInstance({ delay: 100 });
    jsonrpcServer.onCall('repeatMethod', () => {});

    try {
      await jsonrpcServer.onCall('repeatMethod', () => {});
    } catch (error) {
      expect(error.toString()).includes(JsonrpcErrorMessage.InternalError);
      expect(error.toString()).includes('repeated');
    }
  });

  it('onNotify notify name repeated', async ({ expect }) => {
    const { jsonrpcServer } = getJsonrpcInstance({ delay: 100 });
    const disposable01 = jsonrpcServer.onCall('repeatMethod', () => {});

    disposable01.dispose();
    const disposable02 = await jsonrpcServer.onCall('repeatMethod', () => {});
    expect(disposable02).toBeDefined();
  });
});
