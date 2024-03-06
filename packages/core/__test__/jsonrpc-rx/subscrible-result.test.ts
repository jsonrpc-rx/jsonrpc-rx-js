import { SubscribleResult, SubscribleResultSatate, isSubscribleResult } from '../../src/jsonrpc-rx/subscrible-result';
import { describe, it } from 'vitest';

describe('isSubscribleResult normal', async () => {
  const subscribleResult01: SubscribleResult = {
    isSubscribleResult: true,
    state: SubscribleResultSatate.Complete,
    subjectName: 'xxx',
    data: [
      {
        subscribeId: 'qwertyui',
        subscribeValue: 'xxx',
      },
    ],
  };

  const subscribleResult02: SubscribleResult = {
    isSubscribleResult: true,
    state: SubscribleResultSatate.Complete,
    subjectName: 'xxx',
    error: [
      {
        subscribeId: 'qwertyui',
        subscribeError: 'xxx',
      },
    ],
  };

  it('isSubscribleResult normal 01', ({ expect }) => expect(isSubscribleResult(subscribleResult01)).toBeTruthy());
  it('isSubscribleResult normal 02', ({ expect }) => expect(isSubscribleResult(subscribleResult02)).toBeTruthy());
});

describe('isSubscribleResult error', async () => {
  const subscribleResult01: any = {
    state: SubscribleResultSatate.Complete,
    subjectName: 'xxx',
  };
  const subscribleResult02: any = {
    isSubscribleResult: true,
    state: 1,
    subjectName: 'xxx',
    data: [
      {
        subscribeId: 'qwertyui',
        subscribeValue: 'xxx',
      },
    ],
  };
  const subscribleResult03: any = {
    isSubscribleResult: true,
    state: SubscribleResultSatate.Complete,
    error: [
      {
        subscribeId: 'qwertyui',
        subscribeError: 'xxx',
      },
    ],
  };
  const subscribleResult04: any = {
    isSubscribleResult: true,
    state: SubscribleResultSatate.Complete,
    subjectName: 'xxx',
    data: [
      {
        subscribeId: 'qwertyui',
        subscribeValue: 'xxx',
      },
    ],
    error: [
      {
        subscribeId: 'qwertyui',
        subscribeError: 'xxx',
      },
    ],
  };
  const subscribleResult05: any = {
    isSubscribleResult: true,
    state: SubscribleResultSatate.Complete,
    subjectName: 'xxx',
    data: [
      {
        subscribeIdd: 'qwertyui',
        subscribeValue: 'xxx',
      },
    ],
  };
  const subscribleResult06: any = {
    isSubscribleResult: true,
    state: SubscribleResultSatate.Complete,
    subjectName: 'xxx',

    error: [
      {
        subscribeIdx: 'qwertyui',
        subscribeError: 'xxx',
      },
    ],
  };
  const subscribleResult07: any = {
    isSubscribleResult: true,
    state: SubscribleResultSatate.Complete,
    subjectName: 'xxx',
    data: [[]],
  };
  const subscribleResult08: any = {
    isSubscribleResult: true,
    state: SubscribleResultSatate.Next,
    subjectName: 'xxx',
    error: [
      {
        subscribeId: 'qwertyui',
      },
    ],
  };

  const subscribleResult09: any = {
    isSubscribleResult: true,
    state: SubscribleResultSatate.Complete,
    subjectName: 'xxx',
    data: [null],
  };

  const subscribleResult10: any = {
    isSubscribleResult: true,
    state: SubscribleResultSatate.Complete,
    subjectName: 'xxx',
    error: [null],
  };

  const subscribleResult11: any = undefined;


  it('isSubscribleResult error 01', ({ expect }) => expect(isSubscribleResult(subscribleResult01)).toBeFalsy());
  it('isSubscribleResult error 02', ({ expect }) => expect(isSubscribleResult(subscribleResult02)).toBeFalsy());
  it('isSubscribleResult error 03', ({ expect }) => expect(isSubscribleResult(subscribleResult03)).toBeFalsy());
  it('isSubscribleResult error 04', ({ expect }) => expect(isSubscribleResult(subscribleResult04)).toBeFalsy());
  it('isSubscribleResult error 05', ({ expect }) => expect(isSubscribleResult(subscribleResult05)).toBeFalsy());
  it('isSubscribleResult error 06', ({ expect }) => expect(isSubscribleResult(subscribleResult06)).toBeFalsy());
  it('isSubscribleResult error 07', ({ expect }) => expect(isSubscribleResult(subscribleResult07)).toBeFalsy());
  it('isSubscribleResult error 08', ({ expect }) => expect(isSubscribleResult(subscribleResult08)).toBeFalsy());
  it('isSubscribleResult error 09', ({ expect }) => expect(isSubscribleResult(subscribleResult09)).toBeFalsy());
  it('isSubscribleResult error 10', ({ expect }) => expect(isSubscribleResult(subscribleResult10)).toBeFalsy());
  it('isSubscribleResult error 11', ({ expect }) => expect(isSubscribleResult(subscribleResult11)).toBeFalsy());
});
