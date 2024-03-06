import { Publisher, ensurePublisher } from '../../src/jsonrpc-rx/params-subject';
import { it } from 'vitest';

it('ensurePublisher normal', async ({ expect }) => {
  let publishCount = 0;
  let hasCompleted = false;
  const rawPublisher: Publisher = {
    next: (value: any) => {
      publishCount++;
    },
    error: (error: any) => {
      publishCount++;
    },
    complete: () => {
      hasCompleted = true;
    },
  };

  const publisher = ensurePublisher(rawPublisher);
  publisher.next(1);
  publisher.error(2);
  publisher.complete();
  publisher.next(3);
  publisher.error(3);
  publisher.complete();
  expect(publishCount).toEqual(2);
});
