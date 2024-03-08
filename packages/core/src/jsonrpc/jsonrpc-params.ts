import { toType } from '../util/to-type';

export type JsonrpcParams = any[] | object | void;

export function isJsonrpcParams(params: JsonrpcParams) {
  return params == null || toType(params) === 'array' || toType(params) === 'object';
}
