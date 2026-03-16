import { BaseChatModel } from '@langchain/core/language_models/chat_models';

export interface LLMModelOption {
  name: string;
  score: number;
}

export interface ILLMStrategy {
  getSupportedModels(): LLMModelOption[];
  supports(modelName: string): boolean;
  create(modelName: string): BaseChatModel;
}
