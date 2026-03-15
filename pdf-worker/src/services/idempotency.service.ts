import { injectable, singleton } from 'tsyringe';
import { Redis } from '@worker/loaders/redis';

@injectable()
@singleton()
export class IdempotencyService {
  private readonly TTL_SECONDS = 60 * 60 * 24;
  private readonly KEY_PREFIX = 'idempotency';

  constructor(private readonly redis: Redis) {}

  private getKey(messageId: string): string {
    return `${this.KEY_PREFIX}:${messageId}`;
  }

  async isProcessed(messageId: string): Promise<boolean> {
    const key = this.getKey(messageId);
    const exists = await this.redis.executeCommand(() => this.redis.redisClient.exists(key));

    if (exists === null) {
      console.warn(`Idempotency check failed for ${messageId}, treating as new message`);
      return false;
    }

    return exists === 1;
  }

  async markAsProcessed(messageId: string, result?: unknown): Promise<void> {
    const key = this.getKey(messageId);
    const value = JSON.stringify({
      processedAt: new Date().toISOString(),
      result
    });

    const response = await this.redis.executeCommand(() =>
      this.redis.redisClient.setEx(key, this.TTL_SECONDS, value)
    );

    if (response === null) {
      console.warn(`Failed to mark message as processed: ${messageId}`);
    }
  }
}
