import dotenv from 'dotenv';

dotenv.config();

import { NodeSDK } from '@opentelemetry/sdk-node';
import { LangfuseSpanProcessor } from '@langfuse/otel';

console.log('>>> Instrumentation starting...');
console.log('>>> LANGFUSE_PUBLIC_KEY:', process.env.LANGFUSE_PUBLIC_KEY ? 'SET' : 'MISSING');
console.log('>>> LANGFUSE_BASE_URL:', process.env.LANGFUSE_BASE_URL || 'NOT SET');

const sdk = new NodeSDK({
  spanProcessors: [new LangfuseSpanProcessor()]
});

sdk.start();
console.log('>>> OpenTelemetry SDK started');

export { sdk };
