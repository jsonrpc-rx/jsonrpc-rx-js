import { describe, it } from 'vitest';
import { getJsonrpcInstance } from '@cec/unit-test-tool';
import { JsonrpcErrorMessage } from '@cec/jsonrpc-core';

describe('onNotify', () => {
  it('onNotify invalid params', async ({ expect }) => {
    const { jsonrpcServer } = getJsonrpcInstance({ delay: 100 });
    try {
      await jsonrpcServer.onNotify('errorMethod', 'errorParams' as any);
    } catch (error) {
      expect(error.toString()).includes(JsonrpcErrorMessage.InternalError);
      expect(error.toString()).includes('the parameters invalid');
    }
  });

  it('onNotify notify name repeated', async ({ expect }) => {
    const { jsonrpcServer } = getJsonrpcInstance({ delay: 100 });
    jsonrpcServer.onNotify('repeatNotify', () => {});

    try {
      jsonrpcServer.onNotify('repeatNotify', () => {});
    } catch (error) {
      expect(error.toString()).includes(JsonrpcErrorMessage.InternalError);
      expect(error.toString()).includes('repeated');
    }
  });

  it('onNotify disposable', async ({ expect }) => {
    const { jsonrpcServer } = getJsonrpcInstance({ delay: 100 });
    const disposable01 = jsonrpcServer.onNotify('repeatMethod', () => {});

    disposable01.dispose();
    const disposable02 = await jsonrpcServer.onNotify('repeatMethod', () => {});
    expect(disposable02).toBeDefined();
  });
});
