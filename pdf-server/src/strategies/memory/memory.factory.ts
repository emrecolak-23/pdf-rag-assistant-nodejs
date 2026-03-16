import { inject, injectable, singleton } from 'tsyringe';
import { BaseListChatMessageHistory } from '@langchain/core/chat_history';
import { pickWeightedRandom } from '@pdf/utils/weighted-random';

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

  getAvailableOptions(): string[] {
    return [...this.strategies.keys()];
  }

  pickRandom(): string {
    return pickWeightedRandom([...this.strategies.entries()].map(([name, s]) => ({ value: name, score: s.score })));
  }

  create(name: string, sessionId: string): BaseListChatMessageHistory {
    const strategy = this.strategies.get(name);
    if (!strategy) {
      throw new Error(`Unknown memory strategy: ${name}. Available: ${[...this.strategies.keys()].join(', ')}`);
    }
    return strategy.create(sessionId);
  }
}
