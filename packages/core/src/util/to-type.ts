type JsBuildInObjType = 'string' | 'number' | 'object' | 'array' | 'promise'  | 'function' | 'asyncfunction';

export function toType(obj: any): JsBuildInObjType {
  const match = Object.prototype.toString.call(obj).match(/[a-zA-Z.]+/g)?.[1];
  return match?.toString().toLowerCase() as JsBuildInObjType;
}
