import { injectable, singleton } from "tsyringe";

@injectable()
@singleton()
export class ChatService {
  async createEmbeddingsForPdf(
    _pdfId: string,
    _pdfPath: string,
  ): Promise<void> {
    console.log(
      `[Worker] Creating embeddings for pdf: ${_pdfId} from ${_pdfPath}`,
    );
  }
}
