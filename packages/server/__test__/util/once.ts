export function createOnce(func: (...args: any[]) => any) {
  let hasBeenCalled = false;
  return function (...args: any[]) {
    if (!hasBeenCalled) {
      hasBeenCalled = true;
      return func(...args);
    }
  };
}
