import 'reflect-metadata';
import { container } from 'tsyringe';
import { Database, Redis } from '@worker/loaders';
import { WorkerServer } from '@worker/server';
import { PdfModel } from '@worker/models/pdf.schema';

const database = container.resolve(Database);
const redis = container.resolve(Redis);

container.register('PdfModel', { useValue: PdfModel });

class WorkerApplication {
  constructor(private readonly workerServer: WorkerServer) {}

  public async initialize(): Promise<void> {
    await database.databaseConnection();
    await redis.connect();
    await this.workerServer.start();
  }
}

const workerServer = container.resolve(WorkerServer);
const application = new WorkerApplication(workerServer);
application.initialize();
