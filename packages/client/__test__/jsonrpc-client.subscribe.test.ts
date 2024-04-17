import { describe, it } from 'vitest';
import { getJsonrpcInstance } from '@cec/unit-test-tool';
import { Deferred, JsonrpcErrorMessage } from '@cec/jsonrpc-core';

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('subscribe', () => {
  it('subscribe normal', async ({ expect }) => {
    const { jsonrpcClient, jsonrpcServer } = getJsonrpcInstance({ delay: 30 });
    const { promise: promise01, resolve: receive01 } = new Deferred<string>();
    const { promise: promise02, resolve: receive02 } = new Deferred<string>();

    jsonrpcServer.onSubscribe<void, void>('hello', (publisher) => {
      const { next, complete } = publisher;
      const timer01 = setTimeout(() => next(), 10);
      const timer02 = setTimeout(() => complete(), 20);
      return () => {
        clearTimeout(timer01);
        clearTimeout(timer02);
      };
    });
    jsonrpcClient.subscribe<string>('hello', {
      onNext: () => receive01('next'),
      onComplete: () => receive02('complete'),
    });

    const result01 = await promise01;
    expect(result01).toEqual('next');

    const result02 = await promise02;
    expect(result02).toEqual('complete');
  });

  it('subscribe invalid params', async ({ expect }) => {
    const { jsonrpcClient } = getJsonrpcInstance({ delay: 50 });
    try {
      await jsonrpcClient.subscribe<number>('errorMethod', 'errorParams' as any);
    } catch (error) {
      expect(error.toString()).includes(JsonrpcErrorMessage.InvalidParams);
      expect(error.toString()).includes('the parameters invalid');
    }
  });

  it('subscribe multiple params', async ({ expect }) => {
    const { jsonrpcClient, jsonrpcServer } = getJsonrpcInstance({ delay: 30 });
    const { promise, resolve } = new Deferred<number>();

    jsonrpcServer.onSubscribe<[number, number], number>('sum', (publisher, [a, b]) => {
      const { next } = publisher;
      const timer = setTimeout(() => next(a + b));
      return () => {
        clearTimeout(timer);
      };
    });

    const observer = { onNext: resolve };
    jsonrpcClient.subscribe<number>('sum', observer, [2, 3]);

    const result = await promise;
    expect(result).toEqual(5);
  });

  it('subscribe multiple to subscribe', async ({ expect }) => {
    const { jsonrpcClient, jsonrpcServer } = getJsonrpcInstance({ delay: 10 });
    const { promise: promise01, resolve: resolve01 } = new Deferred<number>();
    const { promise: promise02, resolve: resolve02 } = new Deferred<number>();
    const { promise: promise03, resolve: resolve03 } = new Deferred<number>();

    const nextPublishers: any[] = [];
    jsonrpcServer.onSubscribe<[number, number]>('hello', (publisher, [a, b]) => {
      const { next } = publisher;
      nextPublishers.push(() => next(a + b));
      return () => {};
    });
    jsonrpcClient.subscribe<number>('hello', { onNext: resolve01 }, [1, 1]);
    jsonrpcClient.subscribe<number>('hello', { onNext: resolve02 }, [2, 2]);
    jsonrpcClient.subscribe<number>('hello', { onNext: resolve03 }, [3, 3]);

    await sleep(20);
    nextPublishers.forEach((func) => func());
    const allResult02 = await Promise.all([promise01, promise02, promise03]);
    const sum02 = allResult02.reduce((sum, next) => sum + next, 0);
    expect(sum02).toEqual(2 + 4 + 6);

    await sleep(20);
  });

  it('subscribe to disposable', async ({ expect }) => {
    const { jsonrpcClient, jsonrpcServer } = getJsonrpcInstance({ delay: 10 });
    const { promise: promise01, resolve: resolve01 } = new Deferred<number>();
    const { promise: promise02, resolve: resolve02 } = new Deferred<number>();

    let count = 0;
    jsonrpcServer.onSubscribe('hello', (publisher) => {
      const { next } = publisher;
      const timer = setTimeout(() => {
        count++;
        next();
      }, 50);
      return () => {
        count--;
      };
    });
    const disposable01 = await jsonrpcClient.subscribe<number>('hello', { onNext: resolve01 });
    const disposable02 = await jsonrpcClient.subscribe<number>('hello', { onNext: resolve02 });
    disposable01.dispose();
    disposable02.dispose();
    await sleep(100);
    expect(count).toEqual(0);
  });

  it('subscribe for Obsever', async ({ expect }) => {
    const { jsonrpcClient, jsonrpcServer } = getJsonrpcInstance({ delay: 10 });
    const { promise: nextPromise, resolve: nextReceive } = new Deferred<string>();
    const { promise: errorPromise, resolve: errorReceive } = new Deferred<string>();
    const { promise: completePromise, resolve: completeReceive } = new Deferred<void>();

    jsonrpcServer.onSubscribe<void, string>('hello', (publisher) => {
      const { next, error, complete } = publisher;
      const timer01 = setTimeout(() => next('next'), 100);
      const timer02 = setTimeout(() => error('error'), 200);
      const timer03 = setTimeout(() => complete(), 300);
      return () => {
        clearTimeout(timer01);
        clearTimeout(timer02);
        clearTimeout(timer03);
      };
    });
    jsonrpcClient.subscribe('hello', {
      onNext: nextReceive,
      onError: errorReceive,
      onComplete: completeReceive,
    });

    const result01 = await nextPromise;
    expect(result01).toEqual('next');

    const result02 = await errorPromise;
    expect(result02).toEqual('error');

    const result03 = await completePromise;
    expect(result03).toBeUndefined();
  });
});
