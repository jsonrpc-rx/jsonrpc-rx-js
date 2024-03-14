import { it } from 'vitest';
import { JsonrpcErrorMessage } from '@cec/jsonrpc-server';
import { JsonrpcClient } from '../src';

it('JsonrpcClient error', async ({ expect }) => {
  try {
    new JsonrpcClient(
      () => {},
      () => {},
      {
        timeout: '123',
      } as any,
    );
  } catch (error) {
    expect(error.toString()).includes(JsonrpcErrorMessage.InvalidParams);
  }
});
