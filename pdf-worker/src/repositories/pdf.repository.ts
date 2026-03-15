import { inject, injectable, singleton } from "tsyringe";
import { Model } from "mongoose";
import { IPdfDocument } from "@worker/models/pdf.schema";

@injectable()
@singleton()
export class PdfRepository {
  constructor(
    @inject("PdfModel") private readonly pdfModel: Model<IPdfDocument>,
  ) {}

  async findById(id: string): Promise<IPdfDocument | null> {
    return this.pdfModel.findById(id);
  }

  async updateStatus(
    id: string,
    status: "processing" | "completed" | "failed",
  ): Promise<void> {
    await this.pdfModel.findByIdAndUpdate(id, { status });
  }
}
