import { injectable, singleton } from "tsyringe";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { Document } from "@langchain/core/documents";
import { PdfRepository } from "@worker/repositories/pdf.repository";
import { FileService } from "@worker/services/file.service";
import { EnvConfig } from "@worker/config";

@injectable()
@singleton()
export class EmbeddingService {
  private readonly pinecone: Pinecone;
  private readonly embeddings: OpenAIEmbeddings;

  private static readonly CHUNK_SIZE = 500;
  private static readonly CHUNK_OVERLAP = 100;
  private static readonly BATCH_SIZE = 50;
  private static readonly BATCH_DELAY_MS = 500;
  private static readonly EXPECTED_DIMENSION = 1024;

  constructor(
    private readonly config: EnvConfig,
    private readonly pdfRepository: PdfRepository,
    private readonly fileService: FileService,
  ) {
    this.pinecone = new Pinecone({ apiKey: this.config.PINECONE_API_KEY });
    this.embeddings = new OpenAIEmbeddings({
      apiKey: this.config.OPENAI_API_KEY,
      modelName: "text-embedding-3-small",
      dimensions: EmbeddingService.EXPECTED_DIMENSION,
    });
  }

  async processDocument(pdfId: string): Promise<void> {
    console.log(`[Worker] Processing document: ${pdfId}`);

    const pdf = await this.pdfRepository.findById(pdfId);
    if (!pdf) throw new Error(`Pdf not found: ${pdfId}`);

    try {
      await this.pdfRepository.updateStatus(pdfId, "processing");

      const ext = pdf.name?.includes(".")
        ? pdf.name.slice(pdf.name.lastIndexOf("."))
        : ".pdf";

      await this.fileService.withDownload(
        pdf._id!.toString(),
        async (pdfPath) => {
          await this.createEmbeddingsForPdf(pdfId, pdfPath, pdf.name);
        },
        ext,
      );

      await this.pdfRepository.updateStatus(pdfId, "completed");
      console.log(`[Worker] Document processed successfully: ${pdfId}`);
    } catch (error) {
      console.error(`[Worker] Failed to process document: ${pdfId}`, error);
      await this.pdfRepository.updateStatus(pdfId, "failed");
      throw error;
    }
  }

  private async createEmbeddingsForPdf(
    pdfId: string,
    pdfPath: string,
    fileName?: string,
  ): Promise<void> {
    await this.validateIndex();

    const loader = new PDFLoader(pdfPath);
    const docs = await loader.load();

    if (!docs.length) {
      console.warn(`[Worker] PDF is empty or unreadable: ${pdfId}`);
      return;
    }

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: EmbeddingService.CHUNK_SIZE,
      chunkOverlap: EmbeddingService.CHUNK_OVERLAP,
    });

    const chunks = await textSplitter.splitDocuments(docs);

    const enrichedChunks = chunks
      .filter(
        (chunk) => chunk.pageContent && chunk.pageContent.trim().length > 0,
      )
      .map(
        (chunk, index) =>
          new Document({
            pageContent: chunk.pageContent,
            metadata: this.flattenMetadata({
              pdfId,
              fileName: fileName ?? "unknown",
              chunkIndex: index,
              totalChunks: chunks.length,
              createdAt: new Date().toISOString(),
              ...chunk.metadata,
            }),
          }),
      );

    if (enrichedChunks.length === 0) {
      console.warn(`[Worker] No valid chunks for pdf: ${pdfId}`);
      return;
    }

    console.log(
      `[Worker] Created ${enrichedChunks.length} chunks for pdf: ${pdfId}`,
    );

    await this.upsertInBatches(enrichedChunks, pdfId);
  }

  private async upsertInBatches(
    chunks: Document[],
    namespace: string,
  ): Promise<void> {
    const pineconeIndex = this.pinecone.index(this.config.PINECONE_INDEX_NAME);

    const vectorStore = await PineconeStore.fromExistingIndex(this.embeddings, {
      pineconeIndex,
      namespace,
    });

    for (let i = 0; i < chunks.length; i += EmbeddingService.BATCH_SIZE) {
      const batch = chunks.slice(i, i + EmbeddingService.BATCH_SIZE);
      const batchNumber = Math.floor(i / EmbeddingService.BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(
        chunks.length / EmbeddingService.BATCH_SIZE,
      );

      console.log(
        `[Worker] Upserting batch ${batchNumber}/${totalBatches} (${batch.length} chunks)`,
      );

      await vectorStore.addDocuments(batch);

      if (i + EmbeddingService.BATCH_SIZE < chunks.length) {
        await this.delay(EmbeddingService.BATCH_DELAY_MS);
      }
    }

    console.log(
      `[Worker] All ${chunks.length} chunks upserted to namespace: ${namespace}`,
    );
  }

  private flattenMetadata(
    metadata: Record<string, any>,
    prefix = "",
  ): Record<string, string | number | boolean | string[]> {
    const result: Record<string, string | number | boolean | string[]> = {};

    for (const [key, value] of Object.entries(metadata)) {
      const fullKey = prefix ? `${prefix}_${key}` : key;

      if (value === null || value === undefined) {
        continue;
      } else if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      ) {
        result[fullKey] = value;
      } else if (
        Array.isArray(value) &&
        value.every((v) => typeof v === "string")
      ) {
        result[fullKey] = value;
      } else if (typeof value === "object") {
        Object.assign(result, this.flattenMetadata(value, fullKey));
      } else {
        result[fullKey] = String(value);
      }
    }

    return result;
  }

  private async validateIndex(): Promise<void> {
    const indexInfo = await this.pinecone.describeIndex(
      this.config.PINECONE_INDEX_NAME,
    );

    if (indexInfo.dimension !== EmbeddingService.EXPECTED_DIMENSION) {
      throw new Error(
        `Pinecone index dimension mismatch: expected ${EmbeddingService.EXPECTED_DIMENSION}, got ${indexInfo.dimension}`,
      );
    }
  }

  async deleteDocumentEmbeddings(pdfId: string): Promise<void> {
    try {
      const pineconeIndex = this.pinecone.index(
        this.config.PINECONE_INDEX_NAME,
      );
      await pineconeIndex.namespace(pdfId).deleteAll();
      console.log(`[Worker] Deleted all embeddings for pdf: ${pdfId}`);
    } catch (error) {
      console.error(
        `[Worker] Failed to delete embeddings for pdf: ${pdfId}`,
        error,
      );
      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
