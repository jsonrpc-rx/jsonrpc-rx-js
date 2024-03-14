import { describe, it } from 'vitest';
import { getJsonrpcInstance } from './util/get-jsonrpc-instance';
import { Deferred, JsonrpcErrorMessage } from '@cec/jsonrpc-client';
import { sleep } from './util/sleep';

describe('onSubscribe', () => {
  it('onSubscribe normal', async ({ expect }) => {
    const { jsonrpcClient, jsonrpcServer } = getJsonrpcInstance({ delay: 1 });
    const { promise: nextPromise, resolve: nextReceive } = new Deferred<string>();
    const { promise: errorPromise, resolve: errorReceive } = new Deferred<string>();
    const { promise: completePromise, resolve: completeReceive } = new Deferred<void>();

    jsonrpcServer.onSubscribe<void, string>('hello', (publisher) => {
      const { next, error, complete } = publisher;
      const timer01 = setTimeout(() => next('next'), 10);
      const timer02 = setTimeout(() => error('error'), 20);
      const timer03 = setTimeout(() => complete(), 30);
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

  it('onSubscribe invalid params', async ({ expect }) => {
    const { jsonrpcServer } = getJsonrpcInstance({ delay: 50 });
    try {
      await jsonrpcServer.onSubscribe('errorMethod', 'errorParams' as any);
    } catch (error) {
      expect(error.toString()).includes(JsonrpcErrorMessage.InternalError);
      expect(error.toString()).includes('the parameters invalid');
    }
  });

  it('onSubscribe method repeated', async ({ expect }) => {
    const { jsonrpcServer } = getJsonrpcInstance({ delay: 10 });
    jsonrpcServer.onSubscribe('repeatedMethod', () => () => {});
    try {
      jsonrpcServer.onSubscribe('repeatedMethod', () => () => {});
    } catch (error) {
      expect(error.toString()).includes(JsonrpcErrorMessage.InternalError);
      expect(error.toString()).includes('repeated');
    }
  });

  it('onSubscribe to cancel', async ({ expect }) => {
    const { jsonrpcClient, jsonrpcServer } = getJsonrpcInstance({ delay: 10 });

    let count = 0;
    jsonrpcServer.onSubscribe('hello', () => {
      count++;
      return () => {
        count--;
      };
    });
    const disposable01 = await jsonrpcClient.subscribe<number>('hello', { onNext: () => {} });
    const disposable02 = await jsonrpcClient.subscribe<number>('hello', { onNext: () => {} });

    await sleep(20);
    disposable01.dispose();
    disposable02.dispose();
    await sleep(30);
    expect(count).toEqual(0);
  });

  it('onSubscribe to disposable', async ({ expect }) => {
    const { jsonrpcServer } = getJsonrpcInstance({ delay: 10 });
    const disposable = jsonrpcServer.onSubscribe('hello', () => () => {});
    disposable.dispose();
    jsonrpcServer.onSubscribe('hello', () => () => {});
    expect(true).toBeTruthy();
  });

  it('onSubscribe to disposable', async ({ expect }) => {
    const { jsonrpcServer, jsonrpcClient } = getJsonrpcInstance({
      delay: 1,
      server: {
        requestInterceptors: [() => Promise.reject('requestInterceptor error')],
      },
    });
    jsonrpcServer.onSubscribe('hello', () => () => {});
    const reason = jsonrpcClient.subscribe('hello', { onNext: () => {} });
    expect(reason).rejects.toThrowError();
  });
});
