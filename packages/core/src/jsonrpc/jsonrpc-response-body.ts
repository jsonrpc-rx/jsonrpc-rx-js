import { toType } from '../util/to-type';
import { JsonrpcError, validJsonrpcError } from './jsonrpc-error';

export interface JsonrpcResponseBody {
  jsonrpc: '2.0';
  id: string | number;
  error?: JsonrpcError;
  result?: any;
}

export function validJsonrpcResponseBody(responseBody: any) {
  const { jsonrpc, id, error, result } = responseBody ?? {};
  const validResult = { isValid: true, validMessage: '' };

  if (toType(responseBody) != 'object') {
    validResult.validMessage = 'The response body for the rpc call MUST be object';
    validResult.isValid = false;
  } else if (jsonrpc != '2.0') {
    validResult.validMessage = 'A String specifying the version of the JSON-RPC protocol. MUST be exactly "2.0"';
    validResult.isValid = false;
  } else if (toType(id) != 'string' && toType(id) != 'number') {
    validResult.validMessage = 'The response id for the rpc call MUST contain a a String, or Number';
    validResult.isValid = false;
  } else if (error != null && result == null) {
    const { isValid, validMessage } = validJsonrpcError(error);
    if (!isValid) {
      validResult.isValid = false;
      validResult.validMessage = validMessage;
    }
  }

  return validResult;
}
