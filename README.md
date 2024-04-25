# jsonrpc-rx

A tool library for RPC communication based on [JSON-RPC 2.0](https://www.jsonrpc.org/specification) and Reactive Programming

一个基于 [JSON-RPC 2.0](https://www.jsonrpc.org/specification)  和 响应式编程 用于 RPC 通讯的工具库。

在所有的通信场景中，两端的信息交换的过程，无非就是一端发送，另一端接收，反之亦然。jsonrpc-rx 不关注两端具体的发送和接收的具体实现，而是将其抽象为**发送者**和**接受者**，在此基础上实现了 JSON-RPC 2.0 的**方法调用**和响应式编程的**主题订阅**。

![](https://raw.githubusercontent.com/jsonrpc-rx/jsonrpc-rx-js/main/documents/images/jsonrpc-rx.png)

这样的方式，使得 jsonrpc-rx 具有**通用性**。试想一下，在不同的场景，无论是基于 postMessage 或是 Websocket，只需要提供具体的 MessageSender 和 MessageReceiver，都可以无缝地使用 jsonrpc-rx 。

jsonrpc-rx 将库分为三个部分：

**server**

```bash
npm install --save @jsonrpc-rx/server
```

**client**

```bash
npm install --save @jsonrpc-rx/client
```

**core**

```bash
npm install --save @jsonrpc-rx/core
```

这里的 server 不是狭义上的 web server，我们更倾向于将其理解为能力的提供方，同样的， client 可理解为能力的消费方。core 库的可以用于 jsonrpc-rx 自定义拦截器的编写。



## 例子

[全部示例](https://github.com/jsonrpc-rx/jsonrpc-rx-samples)

### web worker

- [webworker-ts-webpack](https://github.com/jsonrpc-rx/jsonrpc-rx-samples/tree/main/packages/webworker-ts-webpack): webworker + ts + webpack 的实现

### vscode extension

loading...

### iframe

loading...

### websocket 

loading...



## 特性

**注意：** 下面特性的的代码都是伪代码，不能直接运行，但是[例子](https://github.com/jsonrpc-rx/jsonrpc-rx-samples)中都是可以运行的实例，且涉及特性中的所有内容。所以建议在阅读特性时可以找一个自己熟悉的示例对照着看



### 基于 JSON-RPC 2.0 协议

[JSON-RPC 2.0](https://www.jsonrpc.org/specification)  两种主要的通讯模式**调用**、**通知**，对应 jsonrpc-rx 的两组 API：

```ts
/**
 * 调用
 * @param method 方法名称
 * @param params 方法参数
 * @returns 调用结果 (Promise)
 */
call: <ReplyValue>(method: string, params: JsonrpcParams) => Promise<ReplyValue>;

/**
 * 通知
 * @param notifyName 通知名称
 * @param params 通知参数
 */
notify: (notifyName: string, params: JsonrpcParams) => void;
```

源码地址：https://github.com/jsonrpc-rx/jsonrpc-rx-js/blob/main/packages/core/src/jsonrpc/jsonrpc-client.ts

```ts
/**
 * 处理调用
 * @param method 方法名称
 * @param callHandler 处理调用的逻辑
 */
onCall: (method: string, callHandler: (params?: JsonrpcParams) => any) => IDisposable;

/**
 * 响应通知
 * @param notifyName 通知名称
 * @param notifyHandler 通知的逻辑处理
 */
onNotify: (notifyName: string, notifyHandler: (params?: JsonrpcParams) => void) => IDisposable;
```

源码地址：https://github.com/jsonrpc-rx/jsonrpc-rx-js/blob/main/packages/core/src/jsonrpc/jsonrpc-server.ts

除此之外，jsonrpc-rx 还严格的实现 json-rpc 2.0 的错误处理，这给实际过程中的**错误处理**带来了**规范级的指导**！在[源码](https://github.com/jsonrpc-rx/jsonrpc-rx-js/blob/main/packages/core/src/jsonrpc/jsonrpc-error.ts)中可见。

>”通知“和”调用“的区别在于： 
>
>通知 ——  没有返回值， 所以 client 端通知之后，不能获知是否通知成功
>
>调用 —— 以 Promise 的方式返回值，返回值可为空，即使不成功，也会获知错误信息



### 支持响应式

在实际的通信过程中，[响应式编程](https://www.reactive-streams.org/)范式非常的实用。jsonrpc-rx 中对应的 API：

```ts
/**
 * 注册主题
 * @param subjectName 主题名称
 * @param subscribeHandler 订阅的逻辑处理（主题的逻辑）
 */
onSubscribe(subjectName: string, subscribeHandler: SubscribeHandle): IDisposable;
```

源码地址：https://github.com/jsonrpc-rx/jsonrpc-rx-js/blob/main/packages/core/src/jsonrpc-rx/params-subject.ts

```ts
/**
 * 订阅
 * @param method 订阅名称
 * @param params 订阅参数
 */
subscribe(subjectName: string, observer: Observer, params: JsonrpcParams): Promise<IDisposable>;
```

源码地址：https://github.com/jsonrpc-rx/jsonrpc-rx-js/blob/main/packages/core/src/jsonrpc-rx/params-subscribable.ts

**订阅的示例**：

```ts
// parent.js
import { JsonrpcServer } from '@jsonrpc-rx/server';

const worker = new Worker('worker.js');
const messageSender = (msg) => worker.postMessage(msg); // 信息发送者
const messageReceiver = (handler) => worker.addEventListener('message', (evt) => handler(evt.data)); // 信息接受者

const server = new JsonrpcServer(messageSender, messageReceiver);
server.onSubscribe('some_subject', ({ next, error, complete }) => { // onSubscribe: 声明主题 some_subject
    ...
    next('some_data'); // 发布新的消息
    ...
    error('error'); // 发生出错时
    ...
    complete(); // 发布结束
});

// worker.js
import { JsonrpcClient } from '@jsonrpc-rx/client'

const messageSender = (msg) => self.postMessage(msg); // 信息发送者
const messageReceiver = (handler) => self.addEventListener('message', (evt) => handler(evt.data)); // 信息接受者

const client = new JsonrpcClient(messageSender, messageReceiver);
client.subscribe('some_subject', { // subscribe: 订阅主题 some_subject
    next: (message) => { ... }; // 处理消息
    error: (error) => { ... }; // 处理错误
    complete: () => { ... }; // 订阅完成时
});
```



### 类型提示友好

类似于 [Comlink](https://github.com/GoogleChromeLabs/comlink) ，jsonrpc-rx 也提供了 proxy 的方式来支持更友好的声明和调用，如：

**handlers.ts**

```ts
export const handlers = {
  call: {
    sum: (a: number, b: number) => a + b,
    upperCase: (a: string) =>a.toUpperCase(),
  },
  notify: {
    hello: () => { console.log('hello jsonrpc-rx') },
  },
  subscribe: {
    tick: (publisher: Publisher<string>) => {
       const interval = setInterval(() => publisher.next('1'), 100);
       return () => {
           clearTimeout(interval);
           publisher.complete();
       };
    },
  },
};

export type HandlersType = typeof handlers;
```

**server-end**

```ts
import { expose, JsonrpcServer } from '@jsonrpc-rx/server';
import { handlers } from './handlers';

const jsonrpcServer = new JsonrpcServer(...);
expose(jsonrpcServer, handlers);
```

**client-end**

``` ts
import { wrap, JsonrpcClient } from '@jsonrpc-rx/client';
import { HandlersType } from './handlers';

const jsonrpcClient = new JsonrpcClient(...);
const remote = wrap<HandlersType>(jsonrpcClient);

await remote.call.sum(1, 1); // 2
remote.notify.hello(); // 'hello jsonrpc-rx'
remote.subscribe.tick({
  	next: (message) => { ... },
    complete: () => { ... },
}); // '1' ---- '1' ---- '1' ---- '1'---...
```

使用时与直接使用 handlers 几乎无异，只是有的原本同步方法变成了异步调用，可以直接享受到 `handlers` 类型提示。

![image-20240423113258395](https://raw.githubusercontent.com/jsonrpc-rx/jsonrpc-rx-js/main/documents/images/handlers_tips_01.png)

![image-20240423113513993](https://raw.githubusercontent.com/jsonrpc-rx/jsonrpc-rx-js/main/documents/images/handlers_tips_02.png)



### 支持拦截器

类型于 axios ，jsonrpc-rx 支持自定义拦截器来处理“发送”和”接收“的消息。

```ts
export const someInterceptor: Interceptor = (envInfo, safeContext) => {
  const { end, type } = envInfo; // end -- 拦截器运行在哪一端: 'server' | 'client', type -- 拦截器类型：'request' | 'response'

  switch (end + type) {
    case JsonrpcEnd.Client + MessageType.Request:
      return (messageBody) => {
          // 在发送请求之前做些什么
          return messageBody;
      }
    case JsonrpcEnd.Client + MessageType.Response:
      return (messageBody) => {
          // 抛出错误
          return new Error('some error');
      }
    case JsonrpcEnd.Server + MessageType.Request:
      return (messageBody) => {
          // 返回 undefined, 中断信息的传递
          return undefined;
      };
    case JsonrpcEnd.Server + MessageType.Response:
      return (messageBody) => { ... };  
  }
};

const jsonrpcServer = new JsonrpcServer(messageSender, messageReceiver, { interceptors: [someInterceptor] });
const jsonrpcClient = new JsonrpcClient(messageSender, messageReceiver, { interceptors: [someInterceptor] });
```

和 axios 不同，jsonrpc-rx 没有区分请求拦截器和响应拦截器，这个是有意为之。

上述代码中的 **safeContext**，为同一个端（server 或 client）请求和响应拦截器提供了一个**公共的上下文**，这让拦截器的功能变得更加的强大。jsonrpc-rx 提供了一个实现参数可为 Function 类型的插件，便是用到了这个功能，[源码](https://github.com/jsonrpc-rx/jsonrpc-rx-js/blob/main/interceptors/async-func-params-interceptor/src/index.ts)可见。



### 支持 Function 类型参数

参数可为 Function 类型是由拦截器——`@jsonrpc-rx/async-func-params-interceptor` 实现的，如果使用该插件，就可以实现 call、notify、subscribe 的 Function 类型参数传递，如：

```ts
import { JsonrpcServer, exposeCall } from '@jsonrpc-rx/server';
import { JsonrpcClient, wrapCall } from '@jsonrpc-rx/client';
import { asyncFuncParamsInterceptor} from '@jsonrpc-rx/async-func-params-interceptor';

// asyncFuncParamsInterceptor 两端都要使用
const jsonrpcServer = new JsonrpcServer(messageSender, messageReceiver, { interceptors: [asyncFuncParamsInterceptor] });
const jsonrpcClient = new JsonrpcClient(messageSender, messageReceiver, { interceptors: [asyncFuncParamsInterceptor] });

// server end
const handlers = {
    math: (calculator: (...nums: number[]) => Promise<number>) = > {
        return await calculator(1, 2);
    }
}
exposeCall(jsonrpcServer, handlers);

// client end
const remote = wrapCall(typeof handlers)(jsonrpcClient);
cons add = (...nums: number[]) => nums.reduce((sum, n) => sum + n);
const sum = await remote.math(add); // 3
```

代码中的 calculator 是一个**异步方法**，实际上，add 方法并没有传递到 server 端，只是在 calculator 执行时，通知 client 端，并触发 add 的执行，得到返回值后再通知 server 端，所以，calculator 必须是异步方法。



## API

loading...
