import { injectable, singleton } from 'tsyringe';
import { CallbackHandler } from '@langfuse/langchain';

@injectable()
@singleton()
export class TracingService {
  createHandler(options: { sessionId: string; userId: string; tags?: string[] }): CallbackHandler {
    return new CallbackHandler({
      sessionId: options.sessionId,
      userId: options.userId,
      tags: options.tags || []
    });
  }
}
