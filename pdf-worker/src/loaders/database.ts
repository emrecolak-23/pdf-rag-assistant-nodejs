import { injectable, singleton } from 'tsyringe';
import { EnvConfig } from '@worker/config';
import mongoose from 'mongoose';

@singleton()
@injectable()
export class Database {
  constructor(private readonly config: EnvConfig) {}

  public async databaseConnection(): Promise<void> {
    const maxRetries = 10;
    const retryDelayMs = 5000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await mongoose.connect(this.config.MONGODB_URI, {
          maxPoolSize: 10,
          minPoolSize: 2,
          serverSelectionTimeoutMS: 30000,
          connectTimeoutMS: 30000,
          socketTimeoutMS: 45000
        });
        console.log('PdfService connected to database successfully');
        return;
      } catch (error) {
        console.error(`PdfService databaseConnection() attempt ${attempt}/${maxRetries} failed:`, error);
        if (attempt === maxRetries) {
          throw error;
        }
        console.log(`Retrying in ${retryDelayMs / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
    }
  }
}
