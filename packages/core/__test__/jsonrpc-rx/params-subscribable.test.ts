import { Observer, isObserver } from '../../src';
import { describe, it } from 'vitest';

describe('isObserver normal', async () => {
  const observer01: Observer = {
    next: (value) => {},
    error: (error) => {},
    complete: () => {},
  };
  const observer02 = {
    next: (value) => {},
  };
  const observer03: Observer = {
    next: (value) => {},
    error: (error) => {},
  };
  const observer04: Observer = {
    next: (value) => {},
    complete: () => {},
  };

  it('isObserver normal 01', ({ expect }) => expect(isObserver(observer01)).toBeTruthy());
  it('isObserver normal 02', ({ expect }) => expect(isObserver(observer02)).toBeTruthy());
  it('isObserver normal 03', ({ expect }) => expect(isObserver(observer03)).toBeTruthy());
  it('isObserver normal 04', ({ expect }) => expect(isObserver(observer04)).toBeTruthy());
});

describe('isObserver error', async () => {
  const observer01: any = {};
  const observer02: any = {
    error: (error) => {},
    complete: () => {},
  };
  const observer03: any = {
    error: (error) => {},
  };
  const observer04: any = {
    complete: () => {},
  };

  it('isObserver error 01', ({ expect }) => expect(isObserver(observer01)).toBeFalsy());
  it('isObserver error 02', ({ expect }) => expect(isObserver(observer02)).toBeFalsy());
  it('isObserver error 03', ({ expect }) => expect(isObserver(observer03)).toBeFalsy());
  it('isObserver error 04', ({ expect }) => expect(isObserver(observer04)).toBeFalsy());
  it('isObserver error 04', ({ expect }) => expect(isObserver(undefined as any)).toBeFalsy());
});
