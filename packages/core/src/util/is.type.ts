export type IsStrictAny<T> = 0 extends 1 & T ? T : never;

export type IsVoid<T> = T extends void ? T : never;

export type IsNotStrictAny<T> = T extends IsStrictAny<T> ? never : T;

export type IsStrictVoid<T> = IsVoid<T> & IsNotStrictAny<T>;
