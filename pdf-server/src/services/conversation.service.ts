import { inject, injectable, singleton } from 'tsyringe';
import { Types } from 'mongoose';
import { ConversationRepository } from '@pdf/repositories/conversation.repository';
import { MessageRepository } from '@pdf/repositories/message.repository';
import { IConversationDocument } from '@pdf/models/conversation.schema';
import { MemoryFactory } from '@pdf/strategies/memory/memory.factory';
import { RetrieverFactory } from '@pdf/strategies/retriever/retriever.factory';
import { LLMFactory } from '@pdf/strategies/llm/llm.factory';
import { ScoreService } from './score.service';

@injectable()
@singleton()
export class ConversationService {
  constructor(
    private readonly conversationRepository: ConversationRepository,
    private readonly messageRepository: MessageRepository,
    @inject(MemoryFactory) private readonly memoryFactory: MemoryFactory,
    @inject(RetrieverFactory) private readonly retrieverFactory: RetrieverFactory,
    @inject(LLMFactory) private readonly llmFactory: LLMFactory,
    private readonly scoreService: ScoreService
  ) {}

  async getByPdfId(pdfId: string): Promise<any[]> {
    const conversations = await this.conversationRepository.findByPdfId(pdfId);
    return Promise.all(
      conversations.map(async (c) => {
        const messages = await this.messageRepository.findByConversationId(c._id!.toString());
        return {
          id: c._id!.toString(),
          pdf_id: c.pdfId.toString(),
          messages: messages.map((m) => m.toJSON())
        };
      })
    );
  }

  async create(userId: string, pdfId: string): Promise<IConversationDocument> {
    const scores = await this.scoreService.getScores();

    return this.conversationRepository.create({
      userId: new Types.ObjectId(userId),
      pdfId: new Types.ObjectId(pdfId),
      llm: this.llmFactory.pickRandom(scores.llm),
      memory: this.memoryFactory.pickRandom(scores.memory),
      retriever: this.retrieverFactory.pickRandom(scores.retriever)
    });
  }

  async findById(id: string): Promise<IConversationDocument | null> {
    return this.conversationRepository.findById(id);
  }

  async getComponents(conversationId: string) {
    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation) throw new Error('Conversation not found');
    return {
      llm: conversation.llm,
      retriever: conversation.retriever,
      memory: conversation.memory
    };
  }

  async setComponents(conversationId: string, llm: string, retriever: string, memory: string) {
    return this.conversationRepository.updateComponents(conversationId, llm, retriever, memory);
  }
}
