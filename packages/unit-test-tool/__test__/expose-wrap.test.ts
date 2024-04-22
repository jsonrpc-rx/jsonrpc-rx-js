import { Publisher } from '@jsonrpc-rx/core';
import { expose } from '@jsonrpc-rx/server';
import { wrap } from '@jsonrpc-rx/client';
import { getJsonrpcInstance, sleep } from '../src';
import { describe, it } from 'vitest';

describe('expose-wrap', () => {
  it('expose-wrap call', async ({ expect }) => {
    const { jsonrpcServer, jsonrpcClient } = getJsonrpcInstance({ delay: 10 });
    const config = {
      call: {
        sum: (a: number, b: number) => {
          return a + b;
        },
        upperCase: (a: string) => Promise.resolve(a.toUpperCase()),
      },
    };
    expose(jsonrpcServer, config);
    const remote = wrap<typeof config>(jsonrpcClient);

    const sum = await remote.call.sum(1, 2);
    expect(sum).toEqual(3);
    const upperCase = await remote.call.upperCase('a');
    expect(upperCase).toEqual('A');
  });

  it('expose-wrap notify', async ({ expect }) => {
    const { jsonrpcServer, jsonrpcClient } = getJsonrpcInstance({ delay: 10 });
    let hasNotify = false;
    const config = {
      notify: {
        hello: () => (hasNotify = true),
      },
    };
    expose(jsonrpcServer, config);
    const remote = wrap<typeof config>(jsonrpcClient);

    remote.notify.hello();
    await sleep(100);
    expect(hasNotify).toBeTruthy();
  });

  it('expose-wrap call', async ({ expect }) => {
    const { jsonrpcServer, jsonrpcClient } = getJsonrpcInstance({ delay: 10 });
    const config = {
      subscribe: {
        tick: ({ next }: Publisher<string>, token: string) => {
          setTimeout(() => next(token), 50);
          return () => {};
        },
      },
    };
    expose(jsonrpcServer, config);

    const remote = wrap<typeof config>(jsonrpcClient);
    remote.subscribe.tick({ next: (token) => expect(token).toEqual('istoken') }, 'istoken');

    await sleep(150);
  });
});
