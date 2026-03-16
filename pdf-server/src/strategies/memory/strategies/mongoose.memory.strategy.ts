import { injectable } from 'tsyringe';
import { MongooseChatMessageHistoryService } from '@pdf/memory/mongoose-chat-message.history';
import { IMemoryStrategy } from '../memory-strategy.interface';

@injectable()
export class MongooseMemoryStrategy implements IMemoryStrategy {
  readonly name = 'mongoose';
  readonly score = 1;

  create(sessionId: string): MongooseChatMessageHistoryService {
    return new MongooseChatMessageHistoryService(sessionId);
  }
}
