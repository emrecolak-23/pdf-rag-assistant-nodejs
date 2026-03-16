import { BaseListChatMessageHistory } from '@langchain/core/chat_history';

export interface IMemoryStrategy {
  readonly name: string;
  readonly score: number;
  create(sessionId: string): BaseListChatMessageHistory;
}
