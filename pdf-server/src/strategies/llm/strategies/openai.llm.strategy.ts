import { injectable } from 'tsyringe';
import { ChatOpenAI } from '@langchain/openai';
import { ILLMStrategy, LLMModelOption } from '../llm-strategy.interface';

const SUPPORTED_MODELS: LLMModelOption[] = [
  { name: 'gpt-4o-mini', score: 1 },
  { name: 'gpt-4o', score: 0.6 },
  { name: 'gpt-4.1', score: 0.5 },
  { name: 'gpt-4.1-mini', score: 0.9 },
  { name: 'gpt-4.1-nano', score: 0.8 }
];

@injectable()
export class OpenAILLMStrategy implements ILLMStrategy {
  getSupportedModels(): LLMModelOption[] {
    return [...SUPPORTED_MODELS];
  }

  supports(modelName: string): boolean {
    return modelName.startsWith('gpt-') || SUPPORTED_MODELS.some((m) => m.name === modelName);
  }

  create(modelName: string): ChatOpenAI {
    return new ChatOpenAI({ model: modelName, temperature: 0 });
  }
}
