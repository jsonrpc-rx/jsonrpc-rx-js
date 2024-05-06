export type HandlerConfig = {
  [name: string]: (...params: any[]) => any;
};

export type Callable<T extends (args: any) => any> = {
  (...params: Parameters<T>): ReturnType<T>;
  isCallable: true;
};

export type Observable<T extends (args: any) => any> = {
  (...params: Parameters<T>): ReturnType<T>;
  isObservable: true;
};

export type Notifiable<T extends (args: any) => any> = {
  (...params: Parameters<T>): ReturnType<T>;
  isNotifiable: true;
};
