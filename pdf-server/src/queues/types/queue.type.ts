export interface QueueConfig {
  exchangeName: string;
  routingKey: string;
  queueName: string;
  dlq: {
    exchangeName: string;
    routingKey: string;
    queueName: string;
  };
}

export const PROCESS_PDF_QUEUE_CONFIG: QueueConfig = {
  exchangeName: 'pdf-process',
  routingKey: 'process-document',
  queueName: 'pdf-process-queue',
  dlq: {
    exchangeName: 'pdf-dlx',
    routingKey: 'process-document-dead',
    queueName: 'pdf-process-dlq'
  }
};

export const RETRY_CONFIG = {
  maxRetries: 3,
  delayMs: 1000,
  backoffMultiplier: 2
} as const;
