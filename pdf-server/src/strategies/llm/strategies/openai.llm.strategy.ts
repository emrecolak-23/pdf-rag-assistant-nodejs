import { injectable } from 'tsyringe';
import { ChatOpenAI } from '@langchain/openai';
import { ILLMStrategy } from '../llm-strategy.interface';

const SUPPORTED_MODELS = ['gpt-4o-mini', 'gpt-4o', 'gpt-4o-small'];

@injectable()
export class OpenAILLMStrategy implements ILLMStrategy {
  supports(modelName: string): boolean {
    return modelName.startsWith('gpt-') || SUPPORTED_MODELS.includes(modelName);
  }

  create(modelName: string): ChatOpenAI {
    return new ChatOpenAI({ model: modelName, temperature: 0 });
  }
}
