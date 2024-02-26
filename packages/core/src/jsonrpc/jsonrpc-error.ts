//  -32000 to -32099	Server error	Reserved for implementation-defined server-errors.

import { toType } from '../util/to-type';

export enum JsonrpcErrorCode {
  ParseError = -32700, //	Parse error	Invalid JSON was received by the server. An error occurred on the server while parsing the JSON text.
  InvalidRequest = -32600, // Invalid Request	The JSON sent is not a valid Request object.
  MethodNotFound = -32601, // Method not found	The method does not exist / is not available.
  InvalidParams = -32602, // Invalid params	Invalid method parameter(s).
  InternalError = -32603, // Internal error	Internal JSON-RPC error.
  ServerError = -32000, // -32000 to -32099	Server error服务端错误	预留用于自定义的服务器错误。
}

export enum JsonrpcCecErrorMessage {
  ParseError = 'Parse error',
  InvalidRequest = 'Invalid request',
  MethodNotFound = 'Method not found',
  InvalidParams = 'Invalid params',
  InternalError = '	Internal error',
  ServerError = 'Server error',
}

export type JsonrpcError = {
  code: JsonrpcErrorCode;
  message: string;
  data?: any;
};

export function validJsonrpcError(jsonrpcError: any) {
  const { code, message } = jsonrpcError ?? {};
  const validResult = { isValid: true, validMessage: '' };

  if (toType(jsonrpcError) != 'object') {
    validResult.validMessage = 'The response error for the rpc call MUST be object';
    validResult.isValid = false;
  } else if (
    !(code >= -32099 && code <= -32000) && // 32000 to -32099	Server error	Reserved for implementation-defined server-errors.
    code != JsonrpcErrorCode.ParseError &&
    code != JsonrpcErrorCode.InvalidRequest &&
    code != JsonrpcErrorCode.MethodNotFound &&
    code != JsonrpcErrorCode.InvalidParams &&
    code != JsonrpcErrorCode.InternalError
  ) {
    validResult.validMessage = `The error code should be -32700, -32600, -32601, -32602, -32603, or -32000 to -32099, but the actual error code is: ${code}`;
    validResult.isValid = false;
  } else if (toType(message) != 'string') {
    validResult.validMessage = 'A String providing a short description of the error';
    validResult.isValid = false;
  }

  return validResult;
}
