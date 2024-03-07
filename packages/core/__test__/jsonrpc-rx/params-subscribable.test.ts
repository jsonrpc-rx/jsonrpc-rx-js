import { Observer, isObserver } from '../../src';
import { describe, it } from 'vitest';

describe('isObserver normal', async () => {
  const observer01: Observer = {
    onNext: (value) => {},
    onError: (error) => {},
    onComplete: () => {},
  };
  const observer02 = {
    onNext: (value) => {},
  };
  const observer03: Observer = {
    onNext: (value) => {},
    onError: (error) => {},
  };
  const observer04: Observer = {
    onNext: (value) => {},
    onComplete: () => {},
  };

  it('isObserver normal 01', ({ expect }) => expect(isObserver(observer01)).toBeTruthy());
  it('isObserver normal 02', ({ expect }) => expect(isObserver(observer02)).toBeTruthy());
  it('isObserver normal 03', ({ expect }) => expect(isObserver(observer03)).toBeTruthy());
  it('isObserver normal 04', ({ expect }) => expect(isObserver(observer04)).toBeTruthy());
});

describe('isObserver error', async () => {
  const observer01: any = {};
  const observer02: any = {
    onError: (error) => {},
    onComplete: () => {},
  };
  const observer03: any = {
    onError: (error) => {},
  };
  const observer04: any = {
    onComplete: () => {},
  };

  it('isObserver error 01', ({ expect }) => expect(isObserver(observer01)).toBeFalsy());
  it('isObserver error 02', ({ expect }) => expect(isObserver(observer02)).toBeFalsy());
  it('isObserver error 03', ({ expect }) => expect(isObserver(observer03)).toBeFalsy());
  it('isObserver error 04', ({ expect }) => expect(isObserver(observer04)).toBeFalsy());
  it('isObserver error 04', ({ expect }) => expect(isObserver(undefined as any)).toBeFalsy());
});
