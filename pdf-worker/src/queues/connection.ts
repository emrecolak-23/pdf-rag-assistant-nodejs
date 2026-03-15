import { EnvConfig } from '@worker/config';
import client, { Channel, ConfirmChannel, ChannelModel } from 'amqplib';
import { injectable, singleton } from 'tsyringe';

@singleton()
@injectable()
export class QueueConnection {
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private confirmChannel: ConfirmChannel | null = null;
  private isConnecting: boolean = false;

  private readonly RETRY_DELAY = 5000;
  private readonly MAX_RETRIES = 10;

  constructor(private readonly config: EnvConfig) {}

  async getChannel(): Promise<Channel> {
    await this.ensureConnection();

    if (!this.channel) {
      this.channel = await this.connection!.createChannel();
      this.setupChannelEvents(this.channel, 'Channel');
      console.log('RabbitMQ Channel created');
    }

    return this.channel;
  }

  async getConfirmChannel(): Promise<ConfirmChannel> {
    await this.ensureConnection();

    if (!this.confirmChannel) {
      this.confirmChannel = await this.connection!.createConfirmChannel();
      this.setupChannelEvents(this.confirmChannel, 'ConfirmChannel');
      console.log('RabbitMQ ConfirmChannel created');
    }

    return this.confirmChannel;
  }

  private async ensureConnection(): Promise<void> {
    if (this.connection) return;

    if (this.isConnecting) {
      await this.waitForConnection();
      return;
    }

    this.isConnecting = true;

    try {
      this.connection = await this.createConnection();
      this.setupConnectionEvents();
      this.handleCloseOnSigint();
      console.log('RabbitMQ connection established');
    } catch (error) {
      console.error('RabbitMQ connection failed:', error);
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  private async createConnection(retryCount: number = 0): Promise<ChannelModel> {
    try {
      return await client.connect(this.config.RABBITMQ_ENDPOINT);
    } catch (error) {
      if (retryCount < this.MAX_RETRIES) {
        console.warn(`RabbitMQ connection failed, retrying in ${this.RETRY_DELAY}ms... (${retryCount + 1}/${this.MAX_RETRIES})`);
        await this.delay(this.RETRY_DELAY);
        return this.createConnection(retryCount + 1);
      }
      throw error;
    }
  }

  private setupConnectionEvents(): void {
    if (!this.connection) return;

    this.connection.on('close', async (err) => {
      console.warn('RabbitMQ connection closed', err);
      this.resetAll();
      await this.reconnect();
    });

    this.connection.on('error', (err) => {
      console.error('RabbitMQ connection error:', err);
    });
  }

  private setupChannelEvents(channel: Channel | ConfirmChannel, name: string): void {
    const emitter = channel as NodeJS.EventEmitter;

    emitter.on('error', (err) => {
      console.error(`${name} error:`, err);
      if (name === 'Channel') this.channel = null;
      else this.confirmChannel = null;
    });

    emitter.on('close', () => {
      console.warn(`${name} closed`);
      if (name === 'Channel') this.channel = null;
      else this.confirmChannel = null;
    });
  }

  private resetAll(): void {
    this.channel = null;
    this.confirmChannel = null;
    this.connection = null;
  }

  private async reconnect(): Promise<void> {
    console.log('Attempting to reconnect to RabbitMQ...');
    try {
      await this.ensureConnection();
    } catch (error) {
      console.error('Failed to reconnect to RabbitMQ:', error);
    }
  }

  private async waitForConnection(): Promise<void> {
    while (this.isConnecting) {
      await this.delay(100);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private handleCloseOnSigint(): void {
    process.once('SIGINT', async () => {
      console.log('Closing RabbitMQ connection...');
      try {
        if (this.channel) await this.channel.close();
        if (this.confirmChannel) await this.confirmChannel.close();
        if (this.connection) await this.connection.close();
        console.log('RabbitMQ connection closed gracefully');
      } catch (error) {
        console.error('Error closing RabbitMQ:', error);
      }
    });
  }

  isConnected(): boolean {
    return this.connection !== null;
  }
}
