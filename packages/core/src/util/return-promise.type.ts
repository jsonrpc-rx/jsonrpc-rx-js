import { IsNotStrictAny } from './is.type';

type AsPromise<T> = IsNotStrictAny<T> extends never ? Promise<any> : T extends Promise<any> ? T : Promise<T>;

export type ReturnPromise<T> = T extends (...args: infer A) => infer R ? (...args: A) => AsPromise<R> : T;

export type ReturnPromiseEachItem<T> = T extends {
  [key: string]: any;
  [key: number]: any;
  [key: symbol]: any;
}
  ? {
      [K in keyof T]: ReturnPromise<T[K]>;
    }
  : T;

// type Xxx = ReturnPromise<() => number>;
// type Yyy = ReturnPromise<() => any>;
// type Zzz = ReturnPromise<() => Promise<string>>;
