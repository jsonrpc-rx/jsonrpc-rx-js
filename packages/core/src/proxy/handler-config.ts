import { Dispose } from '../jsonrpc-rx/disposable';
import { Publisher } from '../jsonrpc-rx/params-subject';

export type HandlerConfig = {
  call?: {
    [method: string]: (...params: any[]) => any;
  };
  notify?: {
    [notifyName: string]: (...params: any[]) => void;
  };
  subscribe?: {
    [subjectName: string]: (publisher: Publisher, ...params: any[]) => Dispose;
  };
};
