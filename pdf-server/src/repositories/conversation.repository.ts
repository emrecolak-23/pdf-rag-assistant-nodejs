import { inject, injectable, singleton } from 'tsyringe';
import { Model, Types } from 'mongoose';
import { IConversationDocument } from '@pdf/models/conversation.schema';

@injectable()
@singleton()
export class ConversationRepository {
  constructor(@inject('ConversationModel') private readonly conversationModel: Model<IConversationDocument>) {}

  async create(data: { pdfId: Types.ObjectId; userId: Types.ObjectId }): Promise<IConversationDocument> {
    return this.conversationModel.create(data);
  }

  async findById(id: string): Promise<IConversationDocument | null> {
    return this.conversationModel.findById(id);
  }

  async findByPdfId(pdfId: string): Promise<IConversationDocument[]> {
    return this.conversationModel.find({ pdfId: new Types.ObjectId(pdfId) }).sort({ createdAt: -1 });
  }

  async updateComponents(id: string, llm: string, retriever: string, memory: string): Promise<IConversationDocument | null> {
    return this.conversationModel.findByIdAndUpdate(id, { $set: { llm, retriever, memory } }, { new: true });
  }
}
