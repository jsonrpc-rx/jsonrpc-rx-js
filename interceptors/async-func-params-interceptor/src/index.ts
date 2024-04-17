import {
  Deferred,
  Interceptor,
  JsonrpcEnd,
  JsonrpcRequestBody,
  JsonrpcResponseBody,
  MessageBody,
  MessageType,
  invokeAsPromise,
  toType,
} from '@jsonrpc-rx/core';
import { FuncFlatted } from './func-flatted';

type SafeContext = {
  sendMessage: (messageBody: MessageBody) => void;
  funcFlatted: FuncFlatted;
  funcInvokedResultMap: Map<string | number, Deferred<any>>;
};

const IS_ASYNC_FUNC_PARAMS_INTERCEPTOR_FOR_PARAMS = 'isAsyncFuncParamsInterceptorForParams';
const ASYNC_FUNC_PARAMS_INTERCEPTOR_FOR_RETURN = 'asyncFuncParamsInterceptorForReturn';

export const asyncFuncParamsInterceptor: Interceptor<SafeContext> = (envInfo, safeContext) => {
  const { end, type, sendMessage } = envInfo;

  // 在上下文中预设值
  if (sendMessage && !safeContext.sendMessage) safeContext.sendMessage = sendMessage;
  if (!safeContext.funcFlatted) safeContext.funcFlatted = new FuncFlatted();
  if (!safeContext.funcInvokedResultMap) safeContext.funcInvokedResultMap = new Map();

  switch (end + type) {
    case JsonrpcEnd.Client + MessageType.Request:
      return (messageBody) => clientRequestHandler(messageBody as JsonrpcRequestBody, safeContext);
    case JsonrpcEnd.Client + MessageType.Response:
      return (messageBody) => clientResponseHandler(messageBody as JsonrpcResponseBody, safeContext);
    case JsonrpcEnd.Server + MessageType.Request:
      return (messageBody) => serverRequestHandler(messageBody as JsonrpcRequestBody, safeContext);
  }
};

function clientRequestHandler(resquestBody: JsonrpcRequestBody, safeContext: SafeContext) {
  // 识别请求参数中是否“方法参数”
  const funcParams = Object.entries(resquestBody.params ?? []).filter(([_, para]) => toType(para) === 'function');
  if (funcParams.length > 0) {
    const { funcFlatted } = safeContext;
    for (const [key, func] of funcParams) {
      (resquestBody.params as any)[key] = funcFlatted.stringify(func);
    }
  }
  return resquestBody;
}

function clientResponseHandler(responseBody: JsonrpcResponseBody, safeContext: SafeContext) {
  const { result } = responseBody;

  // 识别是否为 “执行方法” 的请求
  if (result && result[IS_ASYNC_FUNC_PARAMS_INTERCEPTOR_FOR_PARAMS]) {
    const { funcFlatted, sendMessage } = safeContext;
    const func = funcFlatted.parse(responseBody.id! as string);
    const requestBody: JsonrpcRequestBody = {
      jsonrpc: '2.0',
      id: responseBody.id,
      method: ASYNC_FUNC_PARAMS_INTERCEPTOR_FOR_RETURN,
    };
    if (func) {
      invokeAsPromise(func, ...result.funcInvokedParams)
        .then((res) => (requestBody.params = [{ returnValue: res }]))
        .catch((err) => (requestBody.params = [{ returnError: err.toString() }]))
        .finally(() => sendMessage(requestBody));
    } else {
      requestBody.params = [{ returnError: new Error('the method not exsiting in client').toString() }];
      sendMessage(requestBody);
    }
    return undefined;
  }
  return responseBody;
}

function serverRequestHandler(resquestBody: JsonrpcRequestBody, safeContext: SafeContext) {
  // 识别请求参数中是否有“方法参数（此时方法参数被序列化了）”
  const funcParams = Object.entries(resquestBody.params ?? []).filter(
    ([_, para]) => toType(para) === 'string' && FuncFlatted.isFlatted(para),
  );
  for (let [key, funcStr] of funcParams) {
    const funcuuid = FuncFlatted.matchFuncuuid(funcStr)!;
    const fakeFunc = (...args: any[]) => {
      const responseBody: JsonrpcResponseBody = {
        jsonrpc: '2.0',
        id: funcuuid,
        result: {
          [IS_ASYNC_FUNC_PARAMS_INTERCEPTOR_FOR_PARAMS]: true,
          funcInvokedParams: args ?? [],
        },
      };
      safeContext.sendMessage(responseBody);
      const deferred = new Deferred<any>();
      safeContext.funcInvokedResultMap.set(funcuuid, deferred);
      return deferred.promise;
    };
    (resquestBody.params as any)[key] = fakeFunc;
  }

  // 识别请求是否为 “方法(在 client 端执行)” 执行结果的请求
  if (resquestBody.method === ASYNC_FUNC_PARAMS_INTERCEPTOR_FOR_RETURN) {
    const deferred = safeContext.funcInvokedResultMap.get(resquestBody.id!);
    if (deferred) {
      const { returnValue, returnError } = (resquestBody?.params as any)?.[0] ?? {};
      if (returnError) {
        deferred.reject(returnError);
      } else {
        deferred.resolve(returnValue);
      }
      safeContext.funcInvokedResultMap.delete(resquestBody.id!);
      return undefined;
    }
  }

  return resquestBody;
}
