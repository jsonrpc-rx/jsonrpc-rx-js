import { describe, it } from 'vitest';
import { getJsonrpcInstance } from '../util/getJsonrpcInstance';

it('call method sum', async ({ expect }) => {
  const { jsonrpcClient, jsonrpcServer } = getJsonrpcInstance({ delay: 100 });

  jsonrpcServer.onCall<[number, number]>('sum', ([a, b]) => a + b);
  const result = await jsonrpcClient.call<number>('sum', [1, 2]);
  expect(result).toEqual(3);
});

it('call throw error', ({ expect }) => {
  const { jsonrpcClient, jsonrpcServer } = getJsonrpcInstance({ delay: 100 });

  jsonrpcServer.onCall('errorMethod', () => {
    throw Error('error coming');
  });
  expect(jsonrpcClient.call<number>('errorMethod')).rejects.toThrowError();
});

it('call timeout', async ({ expect }) => {
  const { jsonrpcClient, jsonrpcServer } = getJsonrpcInstance({ delay: 100, client: { timeout: 99 } });

  jsonrpcServer.onCall('timeout', () => {});
  try {
    await jsonrpcClient.call('timeout');
  } catch (error) {
    console.log(error);
  }

  // expect(await ).rejects.toThrowError();
});

it.todo('call method not found', async ({ expect }) => {
  const { jsonrpcClient, jsonrpcServer } = getJsonrpcInstance({ delay: 100, client: { timeout: 99 } });
  // await jsonrpcClient.call('timeout')
  // expect(jsonrpcClient.call('timeout')).rejects.toThrowError();
});

describe.todo('call normal', async () => {});

describe.todo('call normal', async () => {});

describe.todo('call normal', async () => {});
