import { injectable, singleton } from 'tsyringe';
import { Types } from 'mongoose';
import { PdfRepository } from '@pdf/repositories/pdf.repository';
import { FileService } from '@pdf/services/file.service';
import { PdfProducer } from '@pdf/queues/pdf.producer';
import { PROCESS_PDF_QUEUE_CONFIG } from '@pdf/queues/types/queue.type';
import { IPdfDocument } from '@pdf/models/pdf.schema';

@injectable()
@singleton()
export class PdfService {
  constructor(
    private readonly pdfRepository: PdfRepository,
    private readonly fileService: FileService,
    private readonly pdfProducer: PdfProducer
  ) {}

  async getByUserId(userId: string): Promise<IPdfDocument[]> {
    return this.pdfRepository.findByUserId(userId);
  }

  async getById(pdfId: string): Promise<IPdfDocument | null> {
    return this.pdfRepository.findById(pdfId);
  }

  async uploadAndCreate(
    filePath: string,
    fileName: string,
    userId: string
  ): Promise<{ pdf: IPdfDocument; uploadResult: any }> {
    const pdf = await this.pdfRepository.create({
      name: fileName,
      userId: new Types.ObjectId(userId),
      status: 'processing'
    });

    const ext = fileName.includes('.') ? fileName.slice(fileName.lastIndexOf('.')) : '.pdf';
    await this.fileService.saveToLocal(filePath, pdf._id!.toString(), ext);

    await this.pdfProducer.publishDirectMessage({
      exchangeName: PROCESS_PDF_QUEUE_CONFIG.exchangeName,
      routingKey: PROCESS_PDF_QUEUE_CONFIG.routingKey,
      message: JSON.stringify({ pdfId: pdf._id!.toString() }),
      logMessage: `Document processing queued for pdf: ${pdf._id!.toString()}`
    });

    return { pdf, uploadResult: { fileId: pdf._id.toString() } };
  }

  getDownloadUrl(pdfId: string): string {
    return this.fileService.createDownloadUrl(pdfId);
  }
}
