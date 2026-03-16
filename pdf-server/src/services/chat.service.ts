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

    const chain = RunnableSequence.from([
      RunnableLambda.from(async (input: any) => {
        console.log('2. chain lambda started');
        const chatHistory = input.chat_history || [];
        let query: string;
        if (chatHistory.length === 0) {
          query = input.input;
        } else {
          query = await contextualizeChain.invoke(input);
        }

        console.log('3. calling retriever with:', query);
        const docs = await retriever.invoke(query);
        console.log('4. retriever returned docs:', docs.length);
        const context = docs.map((doc: any) => doc.pageContent).join('\n\n');

        return {
          context,
          chat_history: chatHistory,
          input: input.input
        };
      }),
      RunnableLambda.from(async (input: any) => {
        console.log('5. formatting prompt with keys:', Object.keys(input));
        const formatted = await answerPrompt.invoke(input);
        console.log('6. prompt formatted, calling LLM...');
        const response = await llm.invoke(formatted);
        console.log('7. LLM responded');
        return response.content;
      })
    ]);

    const chainWithHistory = new RunnableWithMessageHistory({
      runnable: chain,
      getMessageHistory: (sessionId) => new MongooseChatMessageHistoryService(sessionId),
      inputMessagesKey: 'input',
      historyMessagesKey: 'chat_history'
    });

    const config = {
      configurable: { sessionId: chatArgs.conversationId }
    };

    return {
      run: async (input: string) => {
        console.log('1. run started:', input);
        const response = await chainWithHistory.invoke({ input }, config);
        console.log('8. run finished');
        return typeof response === 'string' ? response : String(response);
      },
      stream: async function* (input: string) {
        const response = await chainWithHistory.invoke({ input }, config);
        const text = typeof response === 'string' ? response : String(response);
        yield text;
      }
    };
  }

  scoreConversation(_conversationId: string, _score: number, _llm: string, _retriever: string, _memory: string): void {}

  getScores(): Record<string, Record<string, number[]>> {
    return {};
  }
}
