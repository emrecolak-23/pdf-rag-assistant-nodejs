import { ChatArgs } from '@pdf/services/chat.service';

export interface IRetrieverStrategy {
  readonly name: string;
  readonly score: number;
  build(chatArgs: ChatArgs): Promise<any>;
}
