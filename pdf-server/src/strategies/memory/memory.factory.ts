import { inject, injectable, singleton } from 'tsyringe';
import { BaseListChatMessageHistory } from '@langchain/core/chat_history';
import { IMemoryStrategy } from './memory-strategy.interface';
import { MongooseMemoryStrategy } from './strategies/mongoose.memory.strategy';
import { WindowMemoryStrategy } from './strategies/window.memory.strategy';

@injectable()
@singleton()
export class MemoryFactory {
  private readonly strategies: Map<string, IMemoryStrategy> = new Map();

  constructor(
    @inject(MongooseMemoryStrategy) mongooseStrategy: MongooseMemoryStrategy,
    @inject(WindowMemoryStrategy) windowStrategy: WindowMemoryStrategy
  ) {
    this.strategies.set(mongooseStrategy.name, mongooseStrategy);
    this.strategies.set(windowStrategy.name, windowStrategy);
  }

  create(name: string, sessionId: string): BaseListChatMessageHistory {
    const strategy = this.strategies.get(name);
    if (!strategy) {
      throw new Error(`Unknown memory strategy: ${name}. Available: ${[...this.strategies.keys()].join(', ')}`);
    }
    return strategy.create(sessionId);
  }
}
