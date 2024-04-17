# jsonrpc-cec

A tool library for handling rpc communication based on the [JSON RPC](https://www.jsonrpc.org/specification) specification

一个基于 [JSON-RPC](https://www.jsonrpc.org/specification) 规范用于处理 RPC 通讯的工具库

## Introduction

为什么要写 jsonrpc-cec？

首先，这个工具的适用于可进行全双工通讯的场景如：

- iframe、 Web Worker 和 window 之间的通讯
- electron 中主进程和渲染进程的通讯
- 可进行 websocket 通讯

这些场景的问题各有不同，而  jsonrpc-cec 能将这些实现“归一化”。我们看个简单的示例——Web Worker 和 window 之间的通讯：

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

其实，message-sender 和 message-receiver 才是具体的场景下的差一点，所有的通讯行为，在一端，只需要实现 message-sender 和 message-receiver，就可以使用  jsonrpc-cec，如在 websecoket 的场景：

```js
```

## 优势

1、严格实行 JSON-RPC 2.0 协议

2、扩展了“主题订阅”功能

3、参数可为 function 类型

## Examples

Iframe

```ts

```

web worker
```ts

```

websocket 



electron



# more

其他语言的版本，rust 语言的版本
