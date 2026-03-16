import { inject, injectable, singleton } from 'tsyringe';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { pickWeightedRandom } from '@pdf/utils/weighted-random';
import { ILLMStrategy } from './llm-strategy.interface';
import { OpenAILLMStrategy } from './strategies/openai.llm.strategy';
import { ClaudeLLMStrategy } from './strategies/claude.llm.strategy';

@injectable()
@singleton()
export class LLMFactory {
  private readonly strategies: ILLMStrategy[];

  constructor(
    @inject(OpenAILLMStrategy) openaiStrategy: OpenAILLMStrategy,
    @inject(ClaudeLLMStrategy) claudeStrategy: ClaudeLLMStrategy
  ) {
    this.strategies = [openaiStrategy, claudeStrategy];
  }

  getAvailableOptions(): string[] {
    return this.strategies.flatMap((s) => s.getSupportedModels().map((m) => m.name));
  }

  pickRandom(): string {
    const options = this.strategies.flatMap((s) => s.getSupportedModels());
    return pickWeightedRandom(options.map((m) => ({ value: m.name, score: m.score })));
  }

  create(modelName: string): BaseChatModel {
    const strategy = this.strategies.find((s) => s.supports(modelName));
    if (!strategy) {
      throw new Error(
        `Unsupported LLM: ${modelName}. Supported: gpt-4o-mini, gpt-4o, claude-sonnet-4-20250514`
      );
    }
    return strategy.create(modelName);
  }
}
