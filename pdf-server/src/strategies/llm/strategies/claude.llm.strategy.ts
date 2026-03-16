import { injectable } from 'tsyringe';
import { ChatAnthropic } from '@langchain/anthropic';
import { ILLMStrategy } from '../llm-strategy.interface';

@injectable()
export class ClaudeSonnetLLMStrategy implements ILLMStrategy {
  readonly name = 'claude-sonnet-4-20250514';

  create(): ChatAnthropic {
    return new ChatAnthropic({ model: 'claude-sonnet-4-20250514' });
  }
}
