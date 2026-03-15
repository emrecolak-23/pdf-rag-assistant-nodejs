import { injectable, singleton } from 'tsyringe';

export interface ChatArgs {
  conversationId: string;
  pdfId: string;
  streaming: boolean;
  metadata: {
    conversation_id: string;
    user_id: string;
    pdf_id: string;
  };
}

interface IChat {
  run(input: string): Promise<string>;
  stream(input: string): AsyncIterable<string>;
}

@injectable()
@singleton()
export class ChatService {
  buildChat(_chatArgs: ChatArgs): IChat | null {
    return null;
  }

  scoreConversation(
    _conversationId: string,
    _score: number,
    _llm: string,
    _retriever: string,
    _memory: string
  ): void {}

  getScores(): Record<string, Record<string, number[]>> {
    return {};
  }
}
