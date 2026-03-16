import { inject, injectable, singleton } from 'tsyringe';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ILLMStrategy } from './llm-strategy.interface';
import { Gpt4oMiniLLMStrategy } from './strategies/gpt4omini.llm.strategy';
import { Gpt4oLLMStrategy } from './strategies/gpt4o.llm.strategy';
import { ClaudeSonnetLLMStrategy } from './strategies/claude.llm.strategy';

@injectable()
@singleton()
export class LLMFactory {
  private readonly strategies: Map<string, ILLMStrategy> = new Map();

  constructor(
    @inject(Gpt4oMiniLLMStrategy) gpt4oMiniStrategy: Gpt4oMiniLLMStrategy,
    @inject(Gpt4oLLMStrategy) gpt4oStrategy: Gpt4oLLMStrategy,
    @inject(ClaudeSonnetLLMStrategy) claudeStrategy: ClaudeSonnetLLMStrategy
  ) {
    this.strategies.set(gpt4oMiniStrategy.name, gpt4oMiniStrategy);
    this.strategies.set(gpt4oStrategy.name, gpt4oStrategy);
    this.strategies.set(claudeStrategy.name, claudeStrategy);
    this.strategies.set('claude-sonnet', claudeStrategy); // alias
  }

  create(name: string): BaseChatModel {
    const strategy = this.strategies.get(name);
    if (!strategy) {
      throw new Error(`Unknown LLM strategy: ${name}. Available: ${[...new Set(this.strategies.keys())].join(', ')}`);
    }
    return strategy.create();
  }
}
