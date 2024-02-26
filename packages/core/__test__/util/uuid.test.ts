import { uuid } from '../../src/util/uuid';

describe('uuid', () => {
  test('[Normal] uuid', () => {
    expect(uuid().length).toEqual(36);
    expect(uuid(16).length).toEqual(16);
  });
});
