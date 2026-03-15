import { injectable, singleton } from 'tsyringe';
import { QueueConnection } from '@worker/queues/connection';
import { PdfConsumer } from '@worker/consumers/pdf.consumer';
import { Channel } from 'amqplib';

@singleton()
@injectable()
export class WorkerServer {
  private channel!: Channel;

  constructor(
    private readonly queueConnection: QueueConnection,
    private readonly pdfConsumer: PdfConsumer
  ) {}

  public async start(): Promise<void> {
    await this.startQueues();
    this.handleShutdown();
    console.log(`[Worker] Pdf worker has started with process id ${process.pid}`);
  }

  private async startQueues(): Promise<void> {
    this.channel = await this.queueConnection.getChannel();
    await this.pdfConsumer.consumeProcessDocumentMessage(this.channel);
  }

  private handleShutdown(): void {
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
    signals.forEach((signal) => {
      process.once(signal, async () => {
        console.log(`[Worker] Received ${signal}, shutting down gracefully...`);
        try {
          if (this.channel) await this.channel.close();
        } catch (err) {
          console.error('[Worker] Error during shutdown:', err);
        }
        process.exit(0);
      });
    });
  }
}
