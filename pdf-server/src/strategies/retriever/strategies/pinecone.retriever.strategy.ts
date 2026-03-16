import { injectable } from 'tsyringe';
import { PineconeService } from '@pdf/services/pinecone.service';
import { ChatArgs } from '@pdf/services/chat.service';
import { IRetrieverStrategy } from '../retriever-strategy.interface';

@injectable()
export class PineconeRetrieverStrategy implements IRetrieverStrategy {
  readonly name = 'pinecone';
  readonly score = 1;

  constructor(private readonly pineconeService: PineconeService) {}

  async build(chatArgs: ChatArgs): Promise<any> {
    return this.pineconeService.buildRetriever(chatArgs);
  }
}
