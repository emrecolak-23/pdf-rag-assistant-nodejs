import { Schema, model, Model, Document, Types } from 'mongoose';

export type PdfStatus = 'processing' | 'completed';

export interface IPdfAttributes {
  name: string;
  userId: Types.ObjectId;
  status: PdfStatus;
}

export interface IPdfDocument extends Document, IPdfAttributes {
  createdAt: Date;
  updatedAt: Date;
}

const pdfSchema: Schema<IPdfDocument> = new Schema(
  {
    name: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['processing', 'completed'], default: 'processing' }
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: (_doc: IPdfDocument, rec: any) => {
        rec.id = rec._id;
        delete rec._id;
        return rec;
      }
    }
  }
);

export const PdfModel: Model<IPdfDocument> = model<IPdfDocument>('Pdf', pdfSchema);
