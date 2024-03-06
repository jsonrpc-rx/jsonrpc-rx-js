import { Disposable } from '../../src/jsonrpc-rx/disposable';
import { it } from 'vitest';

it('Disposable new', async ({ expect }) => {
  let isDisposed = false;
  const disposable = new Disposable(() => (isDisposed = true));
  disposable.dispose();
  expect(isDisposed).toBeTruthy();
});

it('Disposable from', async ({ expect }) => {
  let isDisposed01 = false;
  let isDisposed02 = false;
  const disposable = Disposable.from(
    () => (isDisposed01 = true),
    () => (isDisposed02 = true),
  );
  disposable.dispose();
  expect(isDisposed01 && isDisposed02).toBeTruthy();
});
