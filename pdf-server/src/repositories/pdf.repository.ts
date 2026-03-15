import { inject, injectable, singleton } from 'tsyringe';
import { Model, Types } from 'mongoose';
import { IPdfDocument } from '@pdf/models/pdf.schema';

@injectable()
@singleton()
export class PdfRepository {
  constructor(@inject('PdfModel') private readonly pdfModel: Model<IPdfDocument>) {}

  async create(data: {
    name: string;
    userId: Types.ObjectId;
    status?: 'processing' | 'completed';
  }): Promise<IPdfDocument> {
    return this.pdfModel.create(data);
  }

  async findById(id: string): Promise<IPdfDocument | null> {
    return this.pdfModel.findById(id);
  }

  async findByUserId(userId: string): Promise<IPdfDocument[]> {
    return this.pdfModel.find({ userId: new Types.ObjectId(userId) });
  }
}
