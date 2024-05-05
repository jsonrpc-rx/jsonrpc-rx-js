import { IsNotStrictAny } from './is.type';

export type Promisify<T> = IsNotStrictAny<T> extends never ? Promise<any> : T extends Promise<unknown> ? T : Promise<T>;

export type PromisifyReturn<T> = T extends (...args: infer P) => infer R ? (...args: P) => Promisify<R> : T;

type AnyObj = { [key: string]: any; [key: number]: any; [key: symbol]: any };
export type PromisifyReturnEach<T> = T extends AnyObj ? { [K in keyof T]: PromisifyReturn<T[K]> } : T;