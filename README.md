# jsonrpc-rx

一个基于 [JSON-RPC 2.0](https://www.jsonrpc.org/specification)  和 响应式编程 用于 RPC 通讯的工具库。

RPC 通讯让使用者像调用“本地方法”一样地调用“远端方法”。jsonrpc-rx 就是为了实现这样的构想，基于 [JSON-RPC 2.0](https://www.jsonrpc.org/specification) 的规范，实现了其中的**调用**和**通知**。不仅如此，jsonrpc-rx 还实现了响应式编程的**主题订阅**，让 jsonrpc-rx 更具有**实用性**。

对于双向通讯场景的信息交换过程，总结起来，就是一端发送消息，另一端接收消息，反之亦然。jsonrpc-rx 不关注发送和接收的具体实现，而是将其抽象为“消息发送者”和“消息接受者“，它们负责数据的传递，而 jsonrpc-rx 基于它们实现调用和主题订阅。这样的方式，使得 jsonrpc-rx 具有**通用性**。

下面通过一个 webworker 的示例来认识 jsonrpc-rx：

![](https://raw.githubusercontent.com/jsonrpc-rx/jsonrpc-rx-js/main/documents/images/jsonrpc-rx-code-sample.png)

上面示例展示了  jsonrpc-rx 在 webworker 通讯中的应用，除此之外，jsonrpc-rx 更多的领域有着更广泛的应用，我们也提供了丰富的示例。



## Install & Browsers support

jsonrpc-rx 将库分为三个部分：

**server**

```bash
npm install --save @jsonrpc-rx/server
```

用于服务的提供端，为 client 提供可调用的“方法”，或者可以订阅的“主题”。

**client**

```bash
npm install --save @jsonrpc-rx/client
```

用于服务的消费端，调用 server 端的“方法”，或者订阅 server 端的“主题”。因为使用了 [ES6 Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) 的特性，所以需要以下浏览器版本的支持：

[![Chrome 56+](https://camo.githubusercontent.com/79486b66995b2e339f1f2fbd2f95cd4c14e4f3730c1db33ade6550be4bd494b6/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f4368726f6d652d35362b2d677265656e2e7376673f7374796c653d666c61742d737175617265)](https://camo.githubusercontent.com/79486b66995b2e339f1f2fbd2f95cd4c14e4f3730c1db33ade6550be4bd494b6/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f4368726f6d652d35362b2d677265656e2e7376673f7374796c653d666c61742d737175617265) [![Edge 15+](https://camo.githubusercontent.com/5fa1f3ba588365af746115f27b94e5952413ee8e6b6cc22a5dfa7430fe6ea5e7/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f456467652d31352b2d677265656e2e7376673f7374796c653d666c61742d737175617265)](https://camo.githubusercontent.com/5fa1f3ba588365af746115f27b94e5952413ee8e6b6cc22a5dfa7430fe6ea5e7/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f456467652d31352b2d677265656e2e7376673f7374796c653d666c61742d737175617265) [![Firefox 52+](https://camo.githubusercontent.com/c735cdc83621bbd638b0f1a9e6c783783429a4c069ae3c3b6037b7d1af109e8a/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f46697265666f782d35322b2d677265656e2e7376673f7374796c653d666c61742d737175617265)](https://camo.githubusercontent.com/c735cdc83621bbd638b0f1a9e6c783783429a4c069ae3c3b6037b7d1af109e8a/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f46697265666f782d35322b2d677265656e2e7376673f7374796c653d666c61742d737175617265) [![Opera 43+](https://camo.githubusercontent.com/2b050d6bd5aeb40e909063689d3c3894650a963f8bb8df80885bbf4ed1ca6d18/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f4f706572612d34332b2d677265656e2e7376673f7374796c653d666c61742d737175617265)](https://camo.githubusercontent.com/2b050d6bd5aeb40e909063689d3c3894650a963f8bb8df80885bbf4ed1ca6d18/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f4f706572612d34332b2d677265656e2e7376673f7374796c653d666c61742d737175617265) [![Safari 10.1+](https://camo.githubusercontent.com/7814bdbfec6f5aa3b37336a33bed19e3d76f2864def37fed269eaeae07726f5e/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f5361666172692d31302e312b2d677265656e2e7376673f7374796c653d666c61742d737175617265)](https://camo.githubusercontent.com/7814bdbfec6f5aa3b37336a33bed19e3d76f2864def37fed269eaeae07726f5e/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f5361666172692d31302e312b2d677265656e2e7376673f7374796c653d666c61742d737175617265) [![Samsung Internet 6.0+](https://camo.githubusercontent.com/903778ad443686c004e3bd5989a4ac7dfdb2686cba508b738ab60c1d0bd8a010/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f53616d73756e675f496e7465726e65742d362e302b2d677265656e2e7376673f7374796c653d666c61742d737175617265)](https://camo.githubusercontent.com/903778ad443686c004e3bd5989a4ac7dfdb2686cba508b738ab60c1d0bd8a010/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f53616d73756e675f496e7465726e65742d362e302b2d677265656e2e7376673f7374796c653d666c61742d737175617265)

没有 [ES6 Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) 支持的浏览器可以使用 [proxy-polyfill](https://github.com/GoogleChrome/proxy-polyfill)。

**core**

```bash
npm install --save @jsonrpc-rx/core
```

core 是为 server 和 client 提供公共能力的库。如果需要自定义拦截器的话，会用到了它。



## Examples

[全部例子](https://github.com/jsonrpc-rx/jsonrpc-rx-samples)

- [webworker](https://github.com/jsonrpc-rx/jsonrpc-rx-samples/tree/main/packages/webworker): 基于 webworker，最基础的一个示例；
- [webworker-plus](https://github.com/jsonrpc-rx/jsonrpc-rx-samples/tree/main/packages/webworker-plus): 基于 webworker, 增加了更多的特性：asNotify、asBehaviorSubject、与 [rxjs](https://rxjs.dev/) 适配；
- [socketio](https://github.com/jsonrpc-rx/jsonrpc-rx-samples/tree/main/packages/socketio): 基于 [socketio](https://socketio.bootcss.com/docs/) 一个即时通信示例，示例包括：前端、后端、自定义日志拦截器；
- [jsonrpc-rx-sample-vscode-webview](https://github.com/jsonrpc-rx/): vscode webview 的示例，前端采用 vue 和 react；
- 更多示例：loading...



## Features

### 基于 JSON-RPC 2.0 协议

[JSON-RPC 2.0](https://www.jsonrpc.org/specification)  两种主要的通讯模式调用、通知。除此之外，jsonrpc-rx 还严格的实现 json-rpc 2.0 的错误处理，这给实际过程中的错误处理带来了规范级的指导！

>”通知“和”调用“的区别在于： 
>
>通知 ——  没有返回值， 所以 client 端通知之后，不能获知是否通知成功
>
>调用 —— 以 Promise 的方式返回值，返回值可为空，即使不成功，也会获知错误信息



### 支持响应式

在实际的通信过程中，响应式编程范式非常的实用。在 client 端，jsonrpc-rx 的响应式还可以和 rxjs 结合，使用 rxjs 的能力，可见于[示例](https://github.com/jsonrpc-rx/jsonrpc-rx-samples/tree/main/packages/webworker-plus)。



### 类型提示友好

jsonrpc-rx 提供了友好的类型提示。如图：

![](https://raw.githubusercontent.com/jsonrpc-rx/jsonrpc-rx-js/main/documents/images/jsonrpc-rx-type-tip.png)



### 支持自定义拦截器

类似于 Axios ，jsonrpc-rx 支持自定义拦截器来处理“发送”和”接收“的消息。和 Axios 不同，jsonrpc-rx 没有区分请求拦截器和响应拦截器。jsonrpc-rx 的拦截器功能强大，可以用于[记录日志](https://github.com/jsonrpc-rx/jsonrpc-rx-samples/blob/main/packages/socketio/server/src/jsonrpc-rx/log-interceptor.ts)，也可用于[实现 Function 类型参数](https://github.com/jsonrpc-rx/jsonrpc-rx-js/blob/main/packages/core/src/async-func-params-interceptor/index.ts)；



### 支持 Function 类型参数

参数可为 Function 类型是由拦截器实现的，通过一个[示例](https://github.com/jsonrpc-rx/jsonrpc-rx-samples/tree/main/packages/webworker-plus)了解下如何使用 Function 类型参数：

![](https://raw.githubusercontent.com/jsonrpc-rx/jsonrpc-rx-js/main/documents/images/jsonrpc-rx-code-sample.png)

## API

loading...

