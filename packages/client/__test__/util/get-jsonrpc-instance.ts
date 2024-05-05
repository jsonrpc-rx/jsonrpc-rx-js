import { JsonrpcBaseConfig, MessageHandler, MessageReceiver, MessageSender } from '@jsonrpc-rx/core';
import { JsonrpcServer } from '@jsonrpc-rx/server';
import { JsonrpcClient } from '../../src/jsonrpc-client';

type JsonrpcInstanceConfig = {
  delay: number;
  client?: JsonrpcBaseConfig & { [key: string]: any };
  server?: JsonrpcBaseConfig & { [key: string]: any };
};

export function getJsonrpcInstance(
  config: JsonrpcInstanceConfig,
) {
  const { delay } = config;

  let clientMsgHandler: MessageHandler = () => {};
  let serverMsgHandler: MessageHandler = () => {};

  const clientMsgSender: MessageSender = (msg: string) => setTimeout(() => serverMsgHandler(msg), delay);
  const clientMsgReceiver: MessageReceiver = (msgHandler: MessageHandler) => (clientMsgHandler = msgHandler);

  const serverMsgSender: MessageSender = (msg: string) => setTimeout(() => clientMsgHandler(msg), delay);
  const serverMsgReceiver: MessageReceiver = (msgHandler: MessageHandler) => (serverMsgHandler = msgHandler);

  const jsonrpcServer = new JsonrpcServer(serverMsgSender, serverMsgReceiver, config.server);
  const jsonrpcClient = new JsonrpcClient(clientMsgSender, clientMsgReceiver, config.client);

  return { jsonrpcClient, jsonrpcServer };
}
