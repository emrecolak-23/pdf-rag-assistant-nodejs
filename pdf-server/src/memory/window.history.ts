// src/services/chat/memory/window.memory.ts
import { BaseMessage } from '@langchain/core/messages';
import { MongooseChatMessageHistoryService } from './mongoose-chat-message.history';

export class WindowChatMessageHistory extends MongooseChatMessageHistoryService {
  constructor(
    conversationId: string,
    private readonly windowSize: number
  ) {
    super(conversationId);
  }

  async getMessages(): Promise<BaseMessage[]> {
    const allMessages = await super.getMessages();
    return allMessages.slice(-this.windowSize);
  }
}
