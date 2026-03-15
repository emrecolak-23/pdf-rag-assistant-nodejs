import { injectable, singleton } from "tsyringe";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

@injectable()
@singleton()
export class ChatService {
  async createEmbeddingsForPdf(_pdfId: string, pdfPath: string): Promise<void> {
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 100,
    });

    const loader = new PDFLoader(pdfPath);
    const docs = await loader.load();

    const chunks = await textSplitter.splitDocuments(docs);

    console.log(chunks, "chunks");
  }
}
