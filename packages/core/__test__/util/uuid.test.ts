import { uuid } from '../../src/util/uuid';
import { it } from 'vitest';

it('uuid normal test', ({ expect }) => {
  expect(uuid().length).toEqual(36);
  expect(uuid(16).length).toEqual(16); 
});
