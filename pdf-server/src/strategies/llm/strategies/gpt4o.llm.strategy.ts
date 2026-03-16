import { injectable } from 'tsyringe';
import { ChatOpenAI } from '@langchain/openai';
import { ILLMStrategy } from '../llm-strategy.interface';

@injectable()
export class Gpt4oLLMStrategy implements ILLMStrategy {
  readonly name = 'gpt-4o';

  create(): ChatOpenAI {
    return new ChatOpenAI({ model: 'gpt-4o', temperature: 0 });
  }
}
