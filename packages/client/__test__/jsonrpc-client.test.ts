import { it } from 'vitest';
import { JsonrpcErrorMessage } from '@jsonrpc-rx/core';
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

it('JsonrpcClient normal 01', async ({ expect }) => {
  const clinet = new JsonrpcClient(
    () => {},
    () => {},
  );
  expect(clinet).toBeDefined();
});

it('JsonrpcClient normal 01', async ({ expect }) => {
  const interceptor = () => () => {};
  const clinet = new JsonrpcClient(
    () => {},
    () => {},
    {
      interceptors: [interceptor],
      timeout: 1000,
    },
  );
  expect(clinet).toBeDefined();
});
