import { BaseChatModel } from '@langchain/core/language_models/chat_models';

export interface ILLMStrategy {
  supports(modelName: string): boolean;
  create(modelName: string): BaseChatModel;
}
