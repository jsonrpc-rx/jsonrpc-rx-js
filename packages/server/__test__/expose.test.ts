import { it } from 'vitest';
import { Publisher } from '@jsonrpc-rx/core';
import { wrap } from '@jsonrpc-rx/client';
import { asNotify, asSubjuct, expose } from '../src';
import { getJsonrpcInstance } from './util/get-jsonrpc-instance';
import { sleep } from './util/sleep';

it('expose ', async ({ expect }) => {
  const { jsonrpcServer, jsonrpcClient } = getJsonrpcInstance({ delay: 1 });
  let notifyContent = '';
  const handlerConfig = {
    sum: (a: number, b: number) => {
      return a + b;
    },
    hello: asNotify((content: string) => (notifyContent = content)),
    tick: asSubjuct(({ next }: Publisher<string>, token: string) => {
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

it('expose: remove ', async ({ expect }) => {
  const { jsonrpcServer } = getJsonrpcInstance({ delay: 1 });
  let notifyContent = '';
  const handlerConfig = {
    sum: (a: number, b: number) => a + b,
    hello: (content: string) => (notifyContent = content),
    tick: asSubjuct(({ next }: Publisher<string>, token: string) => {
      setTimeout(() => next(token));
      return () => {};
    }),
  };

  const dispose = expose(jsonrpcServer, handlerConfig);

  // call remove
  await sleep(10);
  dispose.removeSum();
  await sleep(10);
  const disposeCall = expose(jsonrpcServer, { sum: (a: number, b: number) => a + b });
  expect(disposeCall).toBeDefined();

  // notify remove
  await sleep(10);
  dispose.removeHello();
  await sleep(10);
  const disposeNotify = expose(jsonrpcServer, { hello: (content: string) => (notifyContent = content) });
  expect(disposeNotify).toBeDefined();

  // subscribe remove
  await sleep(10);
  dispose.removeTick();
  await sleep(10);
  const disposeSubscribe = expose(jsonrpcServer, {
    tick: () => () => {},
  });
  expect(disposeSubscribe).toBeDefined();
});
