export interface Dispose {
  (): void;
}

export interface IDisposable {
  dispose: Dispose;
}

export class Disposable implements IDisposable {
  private disposed = false;

  constructor(private callOnDispose: Dispose) {}

  static from(...disposes: Dispose[]): IDisposable {
    return new Disposable(() => {
      disposes.forEach((item) => item.call({}));
    });
  }

  dispose(): void {
    if (!this.disposed) this.callOnDispose.call({});
    this.disposed = true;
  }
}
