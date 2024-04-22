import { Publisher } from '@jsonrpc-rx/core';
import { expose, getJsonrpcInstance, sleep } from '@jsonrpc-rx/unit-test-tool';
import { it } from 'vitest';
import { wrap, wrapCall, wrapNotify, wrapSubscribe } from '../src';

it('wrap: call, notify, subscribe ', async ({ expect }) => {
  const { jsonrpcServer, jsonrpcClient } = getJsonrpcInstance({ delay: 1 });
  let notifyContent = '';
  const handlerConfig = {
    call: {
      sum: (a: number, b: number) => {
        return a + b;
      },
      upperCase: (a: string) => Promise.resolve(a.toUpperCase()),
    },
    notify: {
      hello: (content: string) => (notifyContent = content),
    },
    subscribe: {
      tick01: ({ next }: Publisher<string>, token: string) => {
        setTimeout(() => next(token));
        return () => {};
      },
      tick02: ({ next }: Publisher<string>, token: string) => {
        setTimeout(() => next(token));
        return () => {};
      },
    },
  };
  expose(jsonrpcServer, handlerConfig);

  // warp
  const remote = wrap<typeof handlerConfig>(jsonrpcClient);
  const sum = await remote.call.sum(1, 2);
  expect(sum).toEqual(3);

  remote.notify.hello('1');
  await sleep(10);
  expect(notifyContent).toEqual('1');

  remote.subscribe.tick01(
    {
      next: (token) => expect(token).toEqual('token01'),
    },
    'token01',
  );
  await sleep(200);

  // wrapCall
  const remoteCall = wrapCall<typeof handlerConfig.call>(jsonrpcClient);
  const upperCase = await remoteCall.upperCase('aaa');
  expect(upperCase).toEqual('AAA');

  // wrapNotify
  const remoteNotify = wrapNotify<typeof handlerConfig.notify>(jsonrpcClient);
  remoteNotify.hello('2');
  await sleep(10);
  expect(notifyContent).toEqual('2');

  // warpSubcribe
  const remoteSubcribe = wrapSubscribe<typeof handlerConfig.subscribe>(jsonrpcClient);
  remoteSubcribe.tick02(
    {
      next: (token) => expect(token).toEqual('token02'),
    },
    'token02',
  );
  await sleep(200);
});
