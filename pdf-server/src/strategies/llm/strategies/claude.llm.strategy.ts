import { injectable } from 'tsyringe';
import { ChatAnthropic } from '@langchain/anthropic';
import { ILLMStrategy, LLMModelOption } from '../llm-strategy.interface';

const SUPPORTED_MODELS: LLMModelOption[] = [{ name: 'claude-sonnet-4-20250514', score: 0.7 }];

@injectable()
export class ClaudeLLMStrategy implements ILLMStrategy {
  getSupportedModels(): LLMModelOption[] {
    return [...SUPPORTED_MODELS];
  }

  supports(modelName: string): boolean {
    return modelName.startsWith('claude-') || SUPPORTED_MODELS.some((m) => m.name === modelName);
  }

  create(modelName: string): ChatAnthropic {
    const resolved = modelName === 'claude-sonnet' ? 'claude-sonnet-4-20250514' : modelName;
    return new ChatAnthropic({ model: resolved });
  }
}
