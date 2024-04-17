type IsStrictAny<T> = 0 extends 1 & T ? T : never;

type IsVoid<T> = T extends void ? T : never;

type IsNotStrictAny<T> = T extends IsStrictAny<T> ? never : T;

type IsStrictVoid<T> = IsVoid<T> & IsNotStrictAny<T>;
