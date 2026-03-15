import dotenv from 'dotenv';
import path from 'path';
import { singleton, injectable } from 'tsyringe';

dotenv.config({});

@singleton()
@injectable()
export class EnvConfig {
  public NODE_ENV: string;
  public PORT: number;
  public SECRET_KEY: string;
  public MONGODB_URI: string;
  public PUBLIC_PATH: string;
  public REDIS_HOST: string;
  public RABBITMQ_ENDPOINT: string;

  public PDF_SERVER_URL: string;
  public INTERNAL_API_KEY: string;

  public OPENAI_API_KEY: string;
  public PINECONE_API_KEY: string;
  public PINECONE_ENV_NAME: string;
  public PINECONE_INDEX_NAME: string;

  public LANGFUSE_PUBLIC_KEY: string;
  public LANGFUSE_SECRET_KEY: string;

  constructor() {
    this.NODE_ENV = process.env.NODE_ENV || 'development';
    this.PORT = parseInt(process.env.PORT || '8000', 10);
    this.SECRET_KEY = process.env.SECRET_KEY || 'changeme';
    this.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pdf_ai';
    this.PUBLIC_PATH = process.env.PUBLIC_PATH || path.join(process.cwd(), '..', 'pdf-server', 'public');
    this.REDIS_HOST = process.env.REDIS_HOST || '';
    this.RABBITMQ_ENDPOINT = process.env.RABBITMQ_ENDPOINT || 'amqp://localhost:5672';
    this.PDF_SERVER_URL = process.env.PDF_SERVER_URL || 'http://localhost:8000';
    this.INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || '';

    this.OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
    this.PINECONE_API_KEY = process.env.PINECONE_API_KEY || '';
    this.PINECONE_ENV_NAME = process.env.PINECONE_ENV_NAME || '';
    this.PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME || '';

    this.LANGFUSE_PUBLIC_KEY = process.env.LANGFUSE_PUBLIC_KEY || '';
    this.LANGFUSE_SECRET_KEY = process.env.LANGFUSE_SECRET_KEY || '';
  }
}
