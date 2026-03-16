import { injectable, singleton } from 'tsyringe';
import { Pinecone } from '@pinecone-database/pinecone';
import { EnvConfig } from '@pdf/config';
import { ChatArgs } from './chat.service';
import { PineconeStore } from '@langchain/pinecone';
import { OpenAIEmbeddings } from '@langchain/openai';

@injectable()
@singleton()
export class PineconeService {
  private readonly pinecone: Pinecone;
  private readonly embeddings: OpenAIEmbeddings;

  constructor(private readonly config: EnvConfig) {
    this.pinecone = new Pinecone({ apiKey: this.config.PINECONE_API_KEY });

    this.embeddings = new OpenAIEmbeddings({
      model: 'text-embedding-3-small',
      dimensions: 1024
    });
  }

  async buildRetriever(chatArgs: ChatArgs) {
    const pineconeIndex = this.pinecone.index(this.config.PINECONE_INDEX_NAME);

    const vectorStore = await PineconeStore.fromExistingIndex(this.embeddings, {
      pineconeIndex,
      namespace: chatArgs.pdfId
    });

    return vectorStore.asRetriever({ k: 4 }) as any;
  }
}
