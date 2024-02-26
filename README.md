一个简单的跨端调用库，用于端与端之间的能力调用。可将端与端之间`消息的发送和接收`，转换为`方法调用`和`主题订阅`

# Install

```
npm i cec-client-server
```

# Example

Server 端
```ts
import { CecServer } from "cec-client-server"

const messageSender = (message) => {...} 
const messageReceiver = (messageHandler) => {...}
const cecServer = new CecServer(messageSender, messageReceiver)

// 声明一个可调用的“方法”
cecServer.onCall('XxxMethod', (...args: any[]) => {...})

// 声明一个可订阅的“主题”
const publisher = (next: (value) => void) => {...}
cecServer.onSubscribe('XxxSubject', publisher)
```

Client 端
```ts
import { CecClient } from "cec-client-server"                                              
                                              
const messageSender = (message) => {...}
const messageReceiver = (messageHandler) => {...}
const cecClient = new CecClient(messageSender, messageReceiver)

// 调用 Server 端已经声明好的 “方法”
const res = await cecServer.call('XxxMethod', param01, param02)

// 订阅 Server 端已经定义好的 “主题”
const observer = (value) => {...}
cecServer.onSubscribe('XxxSubject', observer)
```

上述的示例中，我们将 Server 端和 Client 端`消息的发送、接收`，转换为`方法调用`和`主题订阅`。在某些复杂场景下，这样的方式可使得代码逻辑简化

# Example in vscode webview

extension 端示例

```ts
import { CecServer } from "cec-client-server";

// 实例化一个 CecServer
const cecServer = new CecServer(
  webview.postMessage.bind(webview),
  webview.onDidReceiveMessage.bind(webview)
);

// 定义一个方法（showInformationMessage），给 webview 调用
cecServer.onCall('showInformationMessage', (message: string) => {
    vscode.window.showInformationMessage(message)
})
```

webview 端示例

```ts
import { CecClient } from "cec-client-server";

// acquireVsCodeApi 是 vscode 在 iframe 中注入的一个方法
const vscodeApi = (window as any).acquireVsCodeApi();
// 实例化一个 CecClient
const cecClient = new CecClient(
  vscodeApi.postMessage.bind(vscodeApi),
  msgHandler => window.addEventListener("message", evt => msgHandler(evt.data))
);

// 调用 extension 定义的方法
cecClient.call('showInformationMessage', '你好，Vscode')

```

**运行完整的示例：**

```shell
git clone git@github.com:liutaigang/cross-end-call.git
pnpm i
pnpm build
```

**最后**按 F5 开启 Vscode 调试，点击 activityBar 上的图标：<img src=https://raw.githubusercontent.com/liutaigang/cross-end-call/a15564f65713d58cdb8257d4e304312307eca08e/examples/simple-extension/assets/icon01.svg width=3% />

**注意：** 需要先安装 pnpm ：`npm i pnpm -g`

源码地址：

extension 端：[https://github.com/liutaigang/cross-end-call/blob/main/examples/simple-extension/src/panel-view-provider.ts](https://github.com/liutaigang/cross-end-call/blob/main/examples/simple-extension/src/panel-view-provider.ts)

webview 端：[https://github.com/liutaigang/cross-end-call/blob/main/examples/simple-view-vue/src/hooks/use-cec-client.ts](https://github.com/liutaigang/cross-end-call/blob/main/examples/simple-view-vue/src/hooks/use-cec-client.ts)

# More examples

vscode webview 的生产级示例：**[vscode-webview-extension-example](https://github.com/liutaigang/vscode-webview-extension-example)**

