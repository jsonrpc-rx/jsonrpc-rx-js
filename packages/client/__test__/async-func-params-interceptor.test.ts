import { it } from 'vitest';
import { describe } from 'vitest';
import { getJsonrpcInstance } from './util/get-jsonrpc-instance';
import { sleep } from './util/sleep';

describe('asyncFuncParamsInterceptor for call', () => {
  it('call normal', async ({ expect }) => {
    const { jsonrpcClient, jsonrpcServer } = getJsonrpcInstance({
      delay: 100,
    });

    jsonrpcServer.onCall<[number, (a: number, b: number) => number]>('ADD', async ([a, operation]) => {
      return await operation(a, 9);
    });
    const result = await jsonrpcClient.call<number>('ADD', [9, (a: number, b: number) => a + b]);
    expect(result).toEqual(18);
  });

  it('call error', async ({ expect }) => {
    const { jsonrpcClient, jsonrpcServer } = getJsonrpcInstance({
      delay: 100,
    });

    jsonrpcServer.onCall<[() => void]>('throwError', async ([operation]) => {
      try {
        await operation();
      } catch (error) {
        expect(error.toString().includes('error occur')).toBeTruthy();
      }
    });
    await jsonrpcClient.call<number>('throwError', [
      () => {
        throw Error('error occur');
      },
    ]);
  });
});

describe('asyncFuncParamsInterceptor for notify', () => {
  it('notify normal', async ({ expect }) => {
    const { jsonrpcClient, jsonrpcServer } = getJsonrpcInstance({
      delay: 10,
    });

    jsonrpcServer.onNotify<[(next: string) => string, string]>('hello', async ([sayHello, p]) => {
      const momo = await sayHello(p);
      expect(momo).toEqual('nihao jsonrpc!');
    });
    jsonrpcClient.notify('hello', [(next: string) => `nihao ${next}!`, 'jsonrpc']);
    await sleep(100);
  });
});

describe('asyncFuncParamsInterceptor for subscribe', () => {
  it('subscribe normal', async ({ expect }) => {
    // 这里将实现一个 Behaviorsubject 的例子
    const { jsonrpcClient, jsonrpcServer } = getJsonrpcInstance({
      delay: 10,
    });

    jsonrpcServer.onSubscribe<[(state: number) => string]>('hello', (publisher, params) => {
      const [asFirst] = params!;
      const { next } = publisher;
      asFirst(1);
      const timer = setTimeout(() => next(2), 100);
      return () => clearTimeout(timer);
    });

    let state: number;
    jsonrpcClient.subscribe<number>(
      'hello',
      {
        next: (value) => {
          state = value;
          expect(state).toEqual(2);
        },
      },
      [
        (value) => {
          state = value;
          expect(state).toEqual(1);
        },
      ],
    );
    await sleep(200);
  });
});
