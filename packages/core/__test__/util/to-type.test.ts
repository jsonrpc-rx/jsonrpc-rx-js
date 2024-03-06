import { toType } from '../../src/util/to-type';
import { describe, it } from 'vitest';

describe('toType normal', () => {
  const isString = toType('') === 'string';
  const isNumber = toType(1) === 'number';
  const isObj = toType({}) === 'object';
  const isArr = toType([]) === 'array';
  const isPromise = toType(Promise.resolve()) === 'promise';
  const isFunction = toType(() => {}) === 'function';

  it('toType normal: isString', ({ expect }) => expect(isString).toBeTruthy());
  it('toType normal: isNumber', ({ expect }) => expect(isNumber).toBeTruthy());
  it('toType normal: isObj', ({ expect }) => expect(isObj).toBeTruthy());
  it('toType normal: isArr', ({ expect }) => expect(isArr).toBeTruthy());
  it('toType normal: isPromise', ({ expect }) => expect(isPromise).toBeTruthy());
  it('toType normal: isFunction', ({ expect }) => expect(isFunction).toBeTruthy());
});
