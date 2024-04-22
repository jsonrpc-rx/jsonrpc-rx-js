import { Publisher } from '@jsonrpc-rx/core';
import { wrap, getJsonrpcInstance, sleep } from '@jsonrpc-rx/unit-test-tool';
import { it } from 'vitest';
import { exposeCall, exposeNotify, exposeSubscribe } from '../src';

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

  // error
  try {
    exposeCall(jsonrpcServer, handlerConfig.call);
  } catch (error) {
    expect(error.toString().includes('the method sum is repeated')).toBeTruthy();
  }
});
