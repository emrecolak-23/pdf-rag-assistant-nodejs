import { BaseListChatMessageHistory } from '@langchain/core/chat_history';

export interface IMemoryStrategy {
  readonly name: string;
  create(sessionId: string): BaseListChatMessageHistory;
}
