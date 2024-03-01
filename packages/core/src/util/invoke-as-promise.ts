export function invokeAsPromise(anyFunc: (...args: any[]) => any, ...args: any[]): Promise<any> {
  let returnVal: any;
  try {
    returnVal = anyFunc.call({}, ...args);
  } catch (error) {
    return Promise.reject(error);
  }
  if (Object.prototype.toString.call(returnVal) === '[object Promise]') {
    return returnVal;
  } else {
    return Promise.resolve(returnVal);
  }
}
