import { inject, injectable, singleton } from 'tsyringe';
import { Model, Types } from 'mongoose';
import { IMessageDocument } from '@pdf/models/message.schema';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';

@injectable()
@singleton()
export class MessageRepository {
  constructor(@inject('MessageModel') private readonly messageModel: Model<IMessageDocument>) {}

  async create(data: { conversationId: string; role: string; content: string }): Promise<IMessageDocument> {
    return this.messageModel.create({
      conversationId: new Types.ObjectId(data.conversationId),
      role: data.role,
      content: data.content
    });
  }

  async findByConversationId(conversationId: string): Promise<IMessageDocument[]> {
    return this.messageModel.find({ conversationId: new Types.ObjectId(conversationId) }).sort({ createdAt: 1 });
  }

  async getLcMessagesByConversationId(conversationId: string): Promise<(AIMessage | HumanMessage | SystemMessage)[]> {
    const messages = await this.messageModel
      .find({ conversationId: new Types.ObjectId(conversationId) })
      .sort({ createdAt: -1 });
    return messages.map((m) => m.asLcMessage());
  }
}
