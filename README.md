# jsonrpc-rx

A tool library for RPC communication based on [JSON-RPC 2.0](https://www.jsonrpc.org/specification) and [Reactive Programming](https://www.reactive-streams.org/)

一个基于 [JSON-RPC 2.0](https://www.jsonrpc.org/specification)  和 [响应式编程](https://www.reactive-streams.org/) 用于 RPC 通讯的工具库



## 介绍

为什么要写 jsonrpc-rx ?

首先，这个工具的适用于可进行全双工通讯的场景如：

- 基于 postMessage 的通讯：iframe、 Web Worker 、 Vscode extension 等；
- 基于 websocket 的通讯；

这些场景的问题各有不同，而  jsonrpc-rx 能将这些实现 “**归一化**”。我们看个简单的示例——Web Worker 和 window 之间的通讯。

**传统的方式：**

```js
// parent.js
const worker = new Worker('worker.js');
worker.addEventListener('message', function (event) {
    const data = event.data;
    if (data.event === 'do_something') {
        // ... handle worker data
        worker.postMessage({
            event: 're:do_something',
            data: 'some data',
        });
    }
});

// worker.js
self.postMessage({
    event: 'do_something',
    data: 'worker data',
});
self.addEventListener('message', function (event) {
    const data = event.data;
    if (data.event === 're:do_something') {
        // ... handle parent data
    }
});
```

**基于 jsonrpc-rx 的方式：** 

```js
// parent.js
import { JsonrpcServer } from '@jsonrpc-rx/server';

const worker = new Worker('worker.js');
const messageSender = (msg) => worker.postMessage(msg); // 信息发送者
const messageReceiver = (handler) => worker.addEventListener('message', (evt) => handler(evt.data)); // 信息接受者

const server = new JsonrpcServer(messageSender, messageReceiver);
server.onCall('do_something', (someData) => { // onCall: 声明被调用的方法 do_something
     // ... handle worker data and return result
    return ...;
});

// worker.js
import { JsonrpcClient } from '@jsonrpc-rx/client'

const messageSender = (msg) => self.postMessage(msg); // 信息发送者
const messageReceiver = (handler) => self.addEventListener('message', (evt) => handler(evt.data)); // 信息接受者

const client = new JsonrpcClient(messageSender, messageReceiver);
const result = await client.call('do_something', 'some data'); // call: 调用方法 do_something
// ... handle parent data
```



其实，**messageSender** 和 **messageReceiver** 才是具体的场景下的差异点，所有的通讯行为，在两端，只需要实现 messageSender 和 messageReceiver，就可以使用  jsonrpc-rx 的能力。所以 ，**jsonrpc-rx 范式**可以归纳为：

```js
// server end
const messageSender = (msg) => ...;
const messageReceiver = (handler) => ...;
const server = new JsonrpcServer(messageSender, messageReceiver);
server.onCall('do_something', (params) => { ... });

// client end
const messageSender = (msg) => ...;
const messageReceiver = (handler) => ...;
const client = new JsonrpcClient(messageSender, messageReceiver);
const result = await client.call('do_something', params);
```

在上面的代码中，jsonrpc-rx 展示了两端的代码，即 server-client ，实际上，jsonrpc-rx 将两端的代码分开的，可以分别使用。除了上述的 **call （调用模式）**，jsonrpc-rx 还有 **notify（通知模式**），**subscribe（订阅模式）**。下面将逐一介绍：



## 特性

**注意：** 下面特性的的代码都是伪代码，不能直接运行，但是[例子](#1.3)中都是可以运行的实例，且涉及特性中的所有内容。所以建议在阅读特性时可以找一个自己熟悉的示例对照着看



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
}); // '1' ---- '1' ---- '1' ---- 'complete'
```

使用时与直接使用 handlers 几乎无异，只是原本同步方法都变成了异步调用，可以直接享受到 `handlers` 类型提示。

![image-20240423113258395](C:\Users\zy\AppData\Roaming\Typora\typora-user-images\image-20240423113258395.png)

![image-20240423113513993](C:\Users\zy\AppData\Roaming\Typora\typora-user-images\image-20240423113513993.png)

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



## 示例

### vscode extension

loading...

### iframe

loading...

### web worker

loading...

### websocket 

loading...
