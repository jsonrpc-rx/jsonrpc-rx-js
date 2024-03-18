import { toType } from '../util/to-type';
import { Interceptor } from '../interceptor/interceptor';

export interface JsonrpcBaseConfig {
  interceptors?: Interceptor[];
}

export function isJsonrpcBaseConfig(jsonrpcBaseConfig?: JsonrpcBaseConfig): boolean {
  const { interceptors } = jsonrpcBaseConfig ?? {};

  const isInterceptors =
    interceptors == null || (toType(interceptors) === 'array' && !!interceptors?.every((item) => toType(item) === 'function'));

  return isInterceptors;
}
