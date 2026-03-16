import { injectable } from 'tsyringe';
import { ChatAnthropic } from '@langchain/anthropic';
import { ILLMStrategy } from '../llm-strategy.interface';

const SUPPORTED_MODELS = ['claude-sonnet-4-20250514', 'claude-sonnet'];

@injectable()
export class ClaudeLLMStrategy implements ILLMStrategy {
  supports(modelName: string): boolean {
    return modelName.startsWith('claude-') || SUPPORTED_MODELS.includes(modelName);
  }

  create(modelName: string): ChatAnthropic {
    const resolved = modelName === 'claude-sonnet' ? 'claude-sonnet-4-20250514' : modelName;
    return new ChatAnthropic({ model: resolved });
  }
}
