import { uuid } from '../../src';
import { it } from 'vitest';

it('uuid normal test', ({ expect }) => {
  expect(uuid().length).toEqual(36);
  expect(uuid(16).length).toEqual(16);
});
