export interface Dispose {
  (onDisposedDid?: () => void): void;
}

export interface IDisposable {
  dispose: Dispose;
}

export class Disposable implements IDisposable {
  private disposed = false;

  constructor(private callOnDispose: Dispose) {}

  static from(...disposes: Dispose[]): IDisposable {
    return new Disposable((onDisposedDid) => {
      disposes.forEach((item) => item.call({}, onDisposedDid));
    });
  }

  dispose(onDisposedDid?: () => void): void {
    if (!this.disposed) this.callOnDispose(onDisposedDid);
    this.disposed = true;
  }
}
