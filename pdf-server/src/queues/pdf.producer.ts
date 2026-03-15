import { EnvConfig } from '@pdf/config';
import { ConfirmChannel } from 'amqplib';
import { QueueConnection } from './connection';
import { injectable, singleton } from 'tsyringe';
import crypto from 'crypto';

interface PublishOptions {
  exchangeName: string;
  routingKey: string;
  message: string;
  logMessage: string;
}

@injectable()
@singleton()
export class PdfProducer {
  private readonly initializedExchanges: Set<string> = new Set();
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000;
  private readonly CONFIRM_TIMEOUT = 5000;

  constructor(
    private readonly _config: EnvConfig,
    private readonly queueConnection: QueueConnection
  ) {
    console.log('PdfProducer constructor', this._config.RABBITMQ_ENDPOINT);
  }

  private async getChannel(): Promise<ConfirmChannel> {
    return this.queueConnection.getConfirmChannel();
  }

  private async ensureExchange(channel: ConfirmChannel, exchangeName: string): Promise<void> {
    if (this.initializedExchanges.has(exchangeName)) return;
    await channel.assertExchange(exchangeName, 'direct', { durable: true });
    this.initializedExchanges.add(exchangeName);
  }

  async publishDirectMessage(options: PublishOptions): Promise<boolean> {
    const { exchangeName, routingKey, message, logMessage } = options;
    const messageId = crypto.randomUUID();

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const channel = await this.getChannel();
        await this.ensureExchange(channel, exchangeName);

        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(
            () => reject(new Error(`Confirm timeout after ${this.CONFIRM_TIMEOUT}ms`)),
            this.CONFIRM_TIMEOUT
          );

          channel.publish(
            exchangeName,
            routingKey,
            Buffer.from(message),
            {
              persistent: true,
              messageId,
              timestamp: Date.now(),
              headers: { 'x-retry-count': attempt - 1 }
            },
            (err) => {
              clearTimeout(timer);
              if (err) reject(err);
              else resolve();
            }
          );
        });

        console.log(logMessage);
        return true;
      } catch (error) {
        console.warn(`Publish attempt ${attempt}/${this.MAX_RETRIES} failed:`, error);
        this.initializedExchanges.clear();

        if (attempt < this.MAX_RETRIES) {
          const delay = this.RETRY_DELAY * Math.pow(2, attempt - 1);
          await new Promise((r) => setTimeout(r, delay));
        } else {
          console.error(`All publish attempts failed for messageId: ${messageId}`);
          return false;
        }
      }
    }

    return false;
  }
}
