import { injectable, singleton } from "tsyringe";
import { QueueConnection } from "@worker/queues/connection";
import { EmbeddingService } from "@worker/services/embedding.service";
import { IdempotencyService } from "@worker/services/idempotency.service";
import { Channel, ConsumeMessage, Replies } from "amqplib";
import {
  PROCESS_PDF_QUEUE_CONFIG,
  RETRY_CONFIG,
  QueueConfig,
} from "@worker/queues/types/queue.type";

@injectable()
@singleton()
export class PdfConsumer {
  constructor(
    private readonly queueConnection: QueueConnection,
    private readonly embeddingService: EmbeddingService,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  private async ensureChannel(channel: Channel | null): Promise<Channel> {
    if (!channel) {
      channel = await this.queueConnection.getChannel();
    }
    return channel;
  }

  private async setupQueue(
    channel: Channel,
    config: QueueConfig,
  ): Promise<Replies.AssertQueue> {
    await channel.assertExchange(config.dlq.exchangeName, "direct", {
      durable: true,
    });
    await channel.assertQueue(config.dlq.queueName, {
      durable: true,
      autoDelete: false,
    });
    await channel.bindQueue(
      config.dlq.queueName,
      config.dlq.exchangeName,
      config.dlq.routingKey,
    );

    await channel.assertExchange(config.exchangeName, "direct", {
      durable: true,
    });
    const queue: Replies.AssertQueue = await channel.assertQueue(
      config.queueName,
      {
        durable: true,
        autoDelete: false,
        arguments: {
          "x-dead-letter-exchange": config.dlq.exchangeName,
          "x-dead-letter-routing-key": config.dlq.routingKey,
        },
      },
    );
    await channel.bindQueue(
      queue.queue,
      config.exchangeName,
      config.routingKey,
    );

    console.log(
      `[Worker] Queue setup: ${config.queueName} with DLQ: ${config.dlq.queueName}`,
    );
    return queue;
  }

  private getMessageId(msg: ConsumeMessage): string {
    return (
      msg.properties.messageId ||
      Buffer.from(msg.content).toString("base64").slice(0, 32)
    );
  }

  private getRetryCount(msg: ConsumeMessage): number {
    return msg.properties.headers?.["x-retry-count"] || 0;
  }

  private async retry(
    channel: Channel,
    msg: ConsumeMessage,
    config: QueueConfig,
  ): Promise<void> {
    const retryCount = this.getRetryCount(msg);
    const delay =
      RETRY_CONFIG.delayMs *
      Math.pow(RETRY_CONFIG.backoffMultiplier, retryCount);

    console.warn(
      `[Worker] Retry ${retryCount + 1}/${RETRY_CONFIG.maxRetries} for message ${this.getMessageId(msg)} in ${delay}ms`,
    );

    await new Promise((resolve) => setTimeout(resolve, delay));

    channel.publish(config.exchangeName, config.routingKey, msg.content, {
      ...msg.properties,
      headers: {
        ...msg.properties.headers,
        "x-retry-count": retryCount + 1,
      },
    });
  }

  async consumeProcessDocumentMessage(channel: Channel): Promise<void> {
    try {
      channel = await this.ensureChannel(channel);
      const queue = await this.setupQueue(channel, PROCESS_PDF_QUEUE_CONFIG);

      channel.prefetch(1);

      channel.consume(queue.queue, async (msg: ConsumeMessage | null) => {
        if (!msg) return;

        const messageId = this.getMessageId(msg);
        const retryCount = this.getRetryCount(msg);

        try {
          if (await this.idempotencyService.isProcessed(messageId)) {
            console.log(`[Worker] Duplicate message skipped: ${messageId}`);
            channel.ack(msg);
            return;
          }

          const { pdfId } = JSON.parse(msg.content.toString());
          console.log(
            `[Worker] Processing message ${messageId}: pdfId=${pdfId}`,
          );

          await this.embeddingService.processDocument(pdfId);

          await this.idempotencyService.markAsProcessed(messageId);
          channel.ack(msg);
          console.log(`[Worker] Message processed successfully: ${messageId}`);
        } catch (error) {
          console.error(
            `[Worker] Error processing message ${messageId}:`,
            error,
          );

          if (retryCount < RETRY_CONFIG.maxRetries) {
            await this.retry(channel, msg, PROCESS_PDF_QUEUE_CONFIG);
            channel.ack(msg);
          } else {
            channel.nack(msg, false, false);
            console.error(
              `[Worker] Message sent to DLQ after ${retryCount} retries: ${messageId}`,
            );
          }
        }
      });

      console.log("[Worker] PdfConsumer started, waiting for messages...");
    } catch (error) {
      console.error("[Worker] PdfConsumer setup error:", error);
    }
  }
}
