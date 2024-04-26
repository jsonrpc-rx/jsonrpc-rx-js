import { it } from 'vitest';
import { Publisher } from '@jsonrpc-rx/core';
import { wrap, getJsonrpcInstance, sleep } from '@jsonrpc-rx/unit-test-tool';
import { expose, exposeCall, exposeNotify, exposeSubscribe } from '../src';

it('expose: call, notify, subscribe ', async ({ expect }) => {
  const { jsonrpcServer, jsonrpcClient } = getJsonrpcInstance({ delay: 1 });
  let notifyContent = '';
  const handlerConfig = {
    call: {
      sum: (a: number, b: number) => {
        return a + b;
      },
    },
    notify: {
      hello: (content: string) => (notifyContent = content),
    },
    subscribe: {
      tick: ({ next }: Publisher<string>, token: string) => {
        setTimeout(() => next(token));
        return () => {};
      },
    },
  };

  exposeCall(jsonrpcServer, handlerConfig.call);
  exposeNotify(jsonrpcServer, handlerConfig.notify);
  exposeSubscribe(jsonrpcServer, handlerConfig.subscribe);

  const remote = wrap<typeof handlerConfig>(jsonrpcClient);
  const sum = await remote.call.sum(1, 2);
  expect(sum).toEqual(3);

  remote.notify.hello('1');
  await sleep(10);
  expect(notifyContent).toEqual('1');

  remote.subscribe.tick(
    {
      next: (token) => expect(token).toEqual('token01'),
    },
    'token01',
  );
  await sleep(200);

  // repeated error
  try {
    exposeCall(jsonrpcServer, handlerConfig.call);
  } catch (error) {
    expect(error.toString().includes('the method sum is repeated')).toBeTruthy();
  }
});

it('expose: remove ', async ({ expect }) => {
  const { jsonrpcServer } = getJsonrpcInstance({ delay: 1 });
  let notifyContent = '';
  const handlerConfig = {
    call: {
      sum: (a: number, b: number) => a + b,
    },
    notify: {
      hello: (content: string) => (notifyContent = content),
    },
    subscribe: {
      tick: ({ next }: Publisher<string>, token: string) => {
        setTimeout(() => next(token));
        return () => {};
      },
    },
  };

  const dispose = expose(jsonrpcServer, handlerConfig);

  // call remove
  await sleep(10);
  dispose.call.removeSum();
  await sleep(10);
  const disposeCall = exposeCall(jsonrpcServer, { sum: (a: number, b: number) => a + b });
  expect(disposeCall).toBeDefined();

  // notify remove
  await sleep(10);
  dispose.notify.removeHello();
  await sleep(10);
  const disposeNotify = exposeNotify(jsonrpcServer, { hello: (content: string) => (notifyContent = content) });
  expect(disposeNotify).toBeDefined();

  // subscribe remove
  await sleep(10);
  dispose.subscribe.removeTick();
  await sleep(10);
  const disposeSubscribe = exposeSubscribe(jsonrpcServer, {
    tick: () => () => {},
  });
  expect(disposeSubscribe).toBeDefined();
});
