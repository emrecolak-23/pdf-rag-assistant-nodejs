import { injectable, singleton } from 'tsyringe';
import { PineconeService } from './pinecone.service';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';

import { RunnableLambda, RunnableSequence, RunnableWithMessageHistory } from '@langchain/core/runnables';
import { MongooseChatMessageHistoryService } from './mongoose-chat-message-history.service';
import { StringOutputParser } from '@langchain/core/output_parsers';
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
  constructor(private readonly pineconeService: PineconeService) {}

  async buildChat(chatArgs: ChatArgs): Promise<IChat | null> {
    const retriever = await this.pineconeService.buildRetriever(chatArgs);

    const llm = new ChatOpenAI({
      model: 'gpt-4o-mini',
      temperature: 0
    });

    const contextualizePrompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        'Given the chat history and latest question, reformulate it as a standalone question. Do NOT answer it.'
      ],
      new MessagesPlaceholder('chat_history'),
      ['human', '{input}']
    ]);

    const contextualizeChain = contextualizePrompt.pipe(llm).pipe(new StringOutputParser());

    const answerPrompt = ChatPromptTemplate.fromMessages([
      ['system', `Answer based only on the context. If you don't know, say so.\n\nContext: {context}`],
      new MessagesPlaceholder('chat_history'),
      ['human', '{input}']
    ]);

    const chainWithHistory = new RunnableWithMessageHistory({
      runnable: RunnableSequence.from([
        RunnableLambda.from(async (input: any) => {
          const chatHistory = input.chat_history || [];
          let query: string;
          if (chatHistory.length === 0) {
            query = input.input;
          } else {
            query = await contextualizeChain.invoke(input);
          }

          const docs = await retriever.invoke(query);
          const context = docs.map((doc: any) => doc.pageContent).join('\n\n');

          return { context, chat_history: chatHistory, input: input.input };
        }),
        answerPrompt,
        llm,
        new StringOutputParser()
      ]),
      getMessageHistory: (sessionId) => new MongooseChatMessageHistoryService(sessionId),
      inputMessagesKey: 'input',
      historyMessagesKey: 'chat_history'
    });

    const config = {
      configurable: { sessionId: chatArgs.conversationId }
    };

    return {
      run: async (input: string) => {
        const response = await chainWithHistory.invoke({ input }, config);
        return typeof response === 'string' ? response : String(response);
      },
      stream: async function* (input: string) {
        const stream = await chainWithHistory.stream({ input }, config);
        for await (const chunk of stream) {
          if (chunk) {
            yield typeof chunk === 'string' ? chunk : String(chunk);
          }
        }
      }
    };
  }

  scoreConversation(_conversationId: string, _score: number, _llm: string, _retriever: string, _memory: string): void {}

  getScores(): Record<string, Record<string, number[]>> {
    return {};
  }
}
