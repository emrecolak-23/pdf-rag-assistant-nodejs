import { BaseListChatMessageHistory } from '@langchain/core/chat_history';
import { BaseMessage } from '@langchain/core/messages';
import { MessageModel } from '@pdf/models/message.schema';
import { getMessageRole } from '@pdf/utils/langchain.util';
import { Types } from 'mongoose';

export class MongooseChatMessageHistoryService extends BaseListChatMessageHistory {
  lc_namespace = ['langchain', 'stores', 'message', 'mongoose'];
  private readonly objectId: Types.ObjectId;

  constructor(private readonly conversationId: string) {
    super();
    this.objectId = new Types.ObjectId(this.conversationId);
  }

  async getMessages(): Promise<BaseMessage[]> {
    console.log('getMessages called for:', this.conversationId.toString());
    const messages = await MessageModel.find({
      conversationId: this.conversationId
    }).sort({ createdAt: 1 });
    console.log('getMessages found:', messages.length);
    return messages.map((m) => m.asLcMessage());
  }

  async addMessage(message: BaseMessage): Promise<void> {
    console.log('addMessage called:', getMessageRole(message));
    await MessageModel.create({
      conversationId: this.conversationId,
      role: getMessageRole(message),
      content: message.content as string
    });
    console.log('addMessage done');
  }

  async addMessages(messages: BaseMessage[]): Promise<void> {
    const docs = messages.map((msg) => ({
      conversationId: this.objectId,
      role: getMessageRole(msg),
      content: msg.content as string
    }));
    await MessageModel.insertMany(docs);
  }

  async clear(): Promise<void> {
    await MessageModel.deleteMany({ conversationId: this.objectId });
  }
}
