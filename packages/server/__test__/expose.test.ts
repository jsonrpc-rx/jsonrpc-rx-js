import { it } from 'vitest';
import { Publisher } from '@jsonrpc-rx/core';
import { wrap } from '@jsonrpc-rx/client';
import { asBehaviorSubject, asNotify, asSubject, expose } from '../src';
import { getJsonrpcInstance } from './util/get-jsonrpc-instance';
import { sleep } from './util/sleep';
import { createOnce } from './util/once';

it('expose ', async ({ expect }) => {
  const { jsonrpcServer, jsonrpcClient } = getJsonrpcInstance({ delay: 1 });
  let notifyContent = '';
  const handlerConfig = {
    sum: (a: number, b: number) => {
      return a + b;
    },
    hello: asNotify((content: string) => (notifyContent = content)),
    tick: asSubject(({ next }: Publisher<string>, token: string) => {
      setTimeout(() => next(token));
      return () => {};
    }),
  };

  expose(jsonrpcServer, handlerConfig);
  const remote = wrap<typeof handlerConfig>(jsonrpcClient);
  const sum = await remote.sum(1, 2);
  expect(sum).toEqual(3);

  remote.hello('1');
  await sleep(10);
  expect(notifyContent).toEqual('1');

  remote.tick(
    {
      next: (token) => expect(token).toEqual('token01'),
    },
    'token01',
  );
  await sleep(200);

  // repeated error
  try {
    expose(jsonrpcServer, handlerConfig);
  } catch (error) {
    expect(error.toString().includes('the method sum is repeated')).toBeTruthy();
  }
});

it('expose: asBehaviorSubject ', async ({ expect }) => {
  const { jsonrpcServer, jsonrpcClient } = getJsonrpcInstance({ delay: 0 });

  let count = 0;
  const nexts: Set<Publisher['next']> = new Set();
  const interval = setInterval(() => {
    nexts.forEach((n) => n(count));
    count++;
  }, 500);

  const handlerConfig = {
    // values:   initialValue --> 0 -----> 1 -----> 2 -----> ...
    // timespan: 0 ---------------500------1000-----1500---- ...
    tick: asBehaviorSubject(({ next }: Publisher<string>) => {
      nexts.add(next);
      return () => nexts.delete(next);
    }, 'initialValue'),
  };

  expose(jsonrpcServer, handlerConfig);
  const remote = wrap<typeof handlerConfig>(jsonrpcClient);

  const once01 = createOnce((value) => {
    expect(value).toEqual('initialValue');
  });
  remote.tick({ next: once01 });

  await sleep(250);

  // 250ms 时
  const once02 = createOnce((value) => {
    expect(value).toEqual('initialValue');
  });
  remote.tick({ next: once02 });

  await sleep(500);

  // 750ms 时
  const once03 = createOnce((value) => {
    expect(value).toEqual(0);
  });
  remote.tick({ next: once03 });
  await sleep(100);
  clearInterval(interval);
});
