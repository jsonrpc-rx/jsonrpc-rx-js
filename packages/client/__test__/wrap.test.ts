import { Publisher } from '@jsonrpc-rx/core';
import { asNotify, asSubject, expose } from '@jsonrpc-rx/server';
import { it } from 'vitest';
import { wrap } from '../src/wrap';
import { getJsonrpcInstance } from './util/get-jsonrpc-instance';
import { sleep } from './util/sleep';

it('wrap ', async ({ expect }) => {
  const { jsonrpcServer, jsonrpcClient } = getJsonrpcInstance({ delay: 0 });
  let notifyContent = '';
  const handlerConfig = {
    sum: (a: number, b: number) => {
      return a + b;
    },
    upperCase: (a: string) => Promise.resolve(a.toUpperCase()),
    hello: asNotify((content: string) => (notifyContent = content)),
    tick01: asSubject(({ next }: Publisher<string>, token: string) => {
      setTimeout(() => next(token));
      return () => {};
    }),
    tick02: asSubject(({ next }: Publisher<string>, token: string) => {
      setTimeout(() => next(token));
      return () => {};
    }),
  };
  expose(jsonrpcServer, handlerConfig);

  // warp
  const remote = wrap<typeof handlerConfig>(jsonrpcClient);
  const sum = await remote.sum(1, 2);
  expect(sum).toEqual(3);

  remote.hello('1');
  await sleep(100);
  expect(notifyContent).toEqual('1');

  remote.tick01(
    {
      next: (token) => expect(token).toEqual('token01'),
    },
    'token01',
  );
  await sleep(200);
});
