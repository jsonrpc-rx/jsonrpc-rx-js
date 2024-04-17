import { uuid } from '@jsonrpc-rx/core';

export class FuncFlatted {
  private static funcuuidRe = /@@Function@([\w\W]+)@@@/;
  private funcuuidStrGetter = (funcuuid: string) => `@@Function@${funcuuid}@@@`;
  private funcMap: Map<string, (...args: any[]) => any> = new Map();

  constructor() {}

  parse(funcStrOrFuncuuid: string) {
    const funcuuid = FuncFlatted.funcuuidRe.test(funcStrOrFuncuuid)
      ? funcStrOrFuncuuid.match(FuncFlatted.funcuuidRe)?.[1]
      : funcStrOrFuncuuid;
    return this.funcMap.get(funcuuid!);
  }

  stringify(func: () => any) {
    const funcuuid = uuid();
    this.funcMap.set(funcuuid, func);
    return this.funcuuidStrGetter(funcuuid);
  }

  static isFlatted(stringifyFunc: string) {
    return FuncFlatted.funcuuidRe.test(stringifyFunc);
  }

  static matchFuncuuid(stringifyFunc: string) {
    return stringifyFunc.match(FuncFlatted.funcuuidRe)?.[1];
  }
}
