export type MessageHandler = (message: string) => void;

export interface MessageReceiver {
  (messageHandler: MessageHandler): void;
}
