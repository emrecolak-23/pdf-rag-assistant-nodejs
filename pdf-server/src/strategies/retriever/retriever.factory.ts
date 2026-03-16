import { inject, injectable, singleton } from 'tsyringe';
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

  async create(name: string, chatArgs: ChatArgs): Promise<any> {
    const strategy = this.strategies.get(name);
    if (!strategy) {
      throw new Error(`Unknown retriever strategy: ${name}. Available: ${[...this.strategies.keys()].join(', ')}`);
    }
    return strategy.build(chatArgs);
  }
}
