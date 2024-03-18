import { JsonrpcBaseConfig, JsonrpcServer, MessageHandler, MessageReceiver, MessageSender } from '../../src';
import { JsonrpcClient, JsonrpcClientConfig } from '@cec/jsonrpc-client';

type JsonrpcInstanceConfig = {
  delay: number;
  client?: JsonrpcClientConfig;
  server?: JsonrpcBaseConfig;
};

export function getJsonrpcInstance(config: JsonrpcInstanceConfig) {
  const { delay } = config;

  let clientMsgHandler: MessageHandler = () => {};
  let serverMsgHandler: MessageHandler = () => {};

  const clientMsgSender: MessageSender = (msg: string) => setTimeout(() => serverMsgHandler(msg), delay);
  const clientMsgReceiver: MessageReceiver = (msgHandler) => (clientMsgHandler = msgHandler);

  const serverMsgSender: MessageSender = (msg: string) => setTimeout(() => clientMsgHandler(msg), delay);
  const serverMsgReceiver: MessageReceiver = (msgHandler) => (serverMsgHandler = msgHandler);

  const jsonrpcServer = new JsonrpcServer(serverMsgSender, serverMsgReceiver, config.server);
  const jsonrpcClient = new JsonrpcClient(clientMsgSender, clientMsgReceiver, config.client);

  return { jsonrpcClient, jsonrpcServer };
}
