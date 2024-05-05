export type HandlerConfig = {
  [name: string]: (...params: any[]) => any;
};
