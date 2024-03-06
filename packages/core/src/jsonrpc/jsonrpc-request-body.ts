import { toType } from '../util/to-type';

export interface JsonrpcRequestBody {
  jsonrpc: '2.0';
  method: string;
  params?: object | any[];
  id?: string | number;
}

export function validJsonrpcResquestBody(resquestBody: any) {
  const { jsonrpc, id, method, params } = resquestBody ?? {};
  const validResult = { isValid: true, validMessage: '' };

  if (toType(resquestBody) != 'object') {
    validResult.validMessage = 'The request body for the rpc call MUST be object';
    validResult.isValid = false;
  } else if (jsonrpc != '2.0') {
    validResult.validMessage = 'A String specifying the version of the JSON-RPC protocol. MUST be exactly "2.0"';
    validResult.isValid = false;
  } else if (!(toType(id) === 'string' || toType(id) === 'number' || id == null)) {
    validResult.validMessage = 'The request id for the rpc call MUST contain a a String, Number, or NULL';
    validResult.isValid = false;
  } else if (toType(method) != 'string') {
    validResult.validMessage = 'The request method for the rpc call MUST be String';
    validResult.isValid = false;
  } else if (!(toType(params) === 'object' || toType(params) === 'array' || params == null)) {
    validResult.validMessage = 'The request parameters for the rpc call MUST contain a Object, Array, or NULL';
    validResult.isValid = false;
  }

  return validResult;
}

export function isJsonrpcRequestBodyParams(params: JsonrpcRequestBody['params']) {
  return toType(params) === 'array' || toType(params) === 'object' || params == null;
}
