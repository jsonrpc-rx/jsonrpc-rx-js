import { Deferred } from '../../src';
import { it } from 'vitest';

it('Defferred resolve', async ({ expect }) => {
  const { promise, resolve } = new Deferred<boolean>();
  setTimeout(() => resolve(true));
  const result = await promise;
  expect(result).toBeTruthy();
});

it('Defferred reject', async ({ expect }) => {
  const { promise, reject } = new Deferred<boolean>();
  setTimeout(() => reject('error'));
  try {
    await promise;
  } catch (error) {
    expect(error.toString()).toEqual('error');
  }
});
