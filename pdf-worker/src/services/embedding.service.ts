import { injectable, singleton } from 'tsyringe';
import { PdfRepository } from '@worker/repositories/pdf.repository';
import { FileService } from '@worker/services/file.service';
import { ChatService } from '@worker/services/chat.service';

@injectable()
@singleton()
export class EmbeddingService {
  constructor(
    private readonly pdfRepository: PdfRepository,
    private readonly fileService: FileService,
    private readonly chatService: ChatService
  ) {}

  async processDocument(pdfId: string): Promise<void> {
    console.log(`[Worker] Processing document: ${pdfId}`);

    const pdf = await this.pdfRepository.findById(pdfId);
    if (!pdf) throw new Error(`Pdf not found: ${pdfId}`);

    const ext = pdf.name?.includes('.') ? pdf.name.slice(pdf.name.lastIndexOf('.')) : '.pdf';
    await this.fileService.withDownload(pdf._id!.toString(), async (pdfPath) => {
      await this.chatService.createEmbeddingsForPdf(pdf._id!.toString(), pdfPath);
    }, ext);

    await this.pdfRepository.updateStatus(pdfId, 'completed');
    console.log(`[Worker] Document processed successfully: ${pdfId}`);
  }
}
