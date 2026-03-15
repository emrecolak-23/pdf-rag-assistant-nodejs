import 'reflect-metadata';
import express, { Express } from 'express';
import { container } from 'tsyringe';
import { Database, Redis } from '@pdf/loaders';
import { PdfServer } from '@pdf/server';
import { UserModel } from '@pdf/models/user.schema';
import { PdfModel } from '@pdf/models/pdf.schema';
import { ConversationModel } from '@pdf/models/conversation.schema';
import { MessageModel } from '@pdf/models/message.schema';

const database = container.resolve(Database);
const redis = container.resolve(Redis);

container.register('UserModel', { useValue: UserModel });
container.register('PdfModel', { useValue: PdfModel });
container.register('ConversationModel', { useValue: ConversationModel });
container.register('MessageModel', { useValue: MessageModel });

class Application {
  constructor(private readonly pdfServer: PdfServer) {}

  public async initialize(): Promise<void> {
    await database.databaseConnection();
    await redis.connect();
    const app: Express = express();
    this.pdfServer.start(app);
  }
}

const pdfServer = container.resolve(PdfServer);
const application: Application = new Application(pdfServer);
application.initialize();
