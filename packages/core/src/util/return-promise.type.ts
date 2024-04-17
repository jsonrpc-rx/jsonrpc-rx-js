type AsPromise<T> = T extends Promise<any> ? T : Promise<T>;

export type ReturnPromise<T> = T extends (...args: infer A) => infer R ? (...args: A) => AsPromise<R> : T;

export type ReturnPromiseEachItem<T> = T extends {
  [key: string]: any;
  [key: number]: any;
  [key: symbol]: any;
}
  ? {
      [key in keyof T]: ReturnPromise<T[key]>;
    }
  : T;
