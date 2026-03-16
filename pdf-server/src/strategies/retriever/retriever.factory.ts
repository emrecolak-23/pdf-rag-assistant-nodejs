import { inject, injectable, singleton } from 'tsyringe';
import { pickWeightedRandom } from '@pdf/utils/weighted-random';
import { IRetrieverStrategy } from './retriever-strategy.interface';
import { PineconeRetrieverStrategy } from './strategies/pinecone.retriever.strategy';
import { ChatArgs } from '@pdf/services/chat.service';

@injectable()
@singleton()
export class RetrieverFactory {
  private readonly strategies: Map<string, IRetrieverStrategy>;

  constructor(
    @inject(PineconeRetrieverStrategy) pineconeStrategy: PineconeRetrieverStrategy
  ) {
    this.strategies = new Map<string, IRetrieverStrategy>([[pineconeStrategy.name, pineconeStrategy]]);
  }

  getAvailableOptions(): string[] {
    return [...this.strategies.keys()];
  }

  pickRandom(): string {
    return pickWeightedRandom(
      [...this.strategies.entries()].map(([name, s]) => ({ value: name, score: s.score }))
    );
  }

  async create(name: string, chatArgs: ChatArgs): Promise<any> {
    const strategy = this.strategies.get(name);
    if (!strategy) {
      throw new Error(`Unknown retriever strategy: ${name}. Available: ${[...this.strategies.keys()].join(', ')}`);
    }
    return strategy.build(chatArgs);
  }
}
