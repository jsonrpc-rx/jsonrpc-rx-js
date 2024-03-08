import { describe, it } from 'vitest';
import { isJsonrpcParams, JsonrpcParams } from '../../src';

describe('isJsonrpcParams', async () => {
  const params01: JsonrpcParams = {};
  const params02: JsonrpcParams = [];
  it('isJsonrpcParams when object', async ({ expect }) => expect(isJsonrpcParams(params01)).toBeTruthy());
  it('isJsonrpcParams when array', async ({ expect }) => expect(isJsonrpcParams(params02)).toBeTruthy());
  it('isJsonrpcParams when null', async ({ expect }) => expect(isJsonrpcParams(null as any)).toBeTruthy());
});
