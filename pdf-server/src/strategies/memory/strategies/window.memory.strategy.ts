import { injectable } from 'tsyringe';
import { WindowChatMessageHistory } from '@pdf/memory/window.history';
import { IMemoryStrategy } from '../memory-strategy.interface';

@injectable()
export class WindowMemoryStrategy implements IMemoryStrategy {
  readonly name = 'window';

  private readonly windowSize: number;

  constructor(windowSize: number = 10) {
    this.windowSize = windowSize;
  }

  create(sessionId: string): WindowChatMessageHistory {
    return new WindowChatMessageHistory(sessionId, this.windowSize);
  }
}
