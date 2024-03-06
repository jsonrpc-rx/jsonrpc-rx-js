import { invokeAsPromise } from '../../src/util/invoke-as-promise';
import { describe, it } from 'vitest';

describe('invokeAsPromise', () => {
  const func = (a, b) => {
    if (isNaN(a) || isNaN(b)) {
      throw new Error('params invalid');
    } else {
      return 0 + a + b;
    }
  };
  const funcPromise = invokeAsPromise(func, 1, 2);

  it('invokeAsPromise return type is promise', ({ expect }) => {
    expect(Object.prototype.toString.call(funcPromise)).toEqual('[object Promise]');
  });

  it('invokeAsPromise in normal function', async ({ expect }) => {
    const result = await funcPromise;
    expect(result).toEqual(3);
  });

  it('invokeAsPromise in function throw error', async ({ expect }) => {
    const funcPromise = invokeAsPromise(func, 'x', 'y');
    funcPromise.catch((err) => {
      expect(err.toString().includes('params invalid')).toBeTruthy();
    });
  });

  it('invokeAsPromise in promise function', async ({ expect }) => {
    const resolveFunc = (a: number, b: number) => Promise.resolve(a + b);
    const asPromise = invokeAsPromise(resolveFunc, 1, 2);
    const result = await asPromise;
    expect(result).toEqual(3);
  });
});
