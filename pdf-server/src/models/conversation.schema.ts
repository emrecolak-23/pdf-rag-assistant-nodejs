import { Schema, model, Model, Document, Types } from 'mongoose';

export interface IConversationAttributes {
  pdfId: Types.ObjectId;
  userId: Types.ObjectId;
  retriever?: string;
  memory?: string;
  llm?: string;
}

export interface IConversationDocument extends Document, IConversationAttributes {
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema: Schema<IConversationDocument> = new Schema(
  {
    pdfId: { type: Schema.Types.ObjectId, ref: 'Pdf', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    retriever: { type: String, default: null },
    memory: { type: String, default: null },
    llm: { type: String, default: null }
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: (_doc: IConversationDocument, rec: any) => {
        rec.id = rec._id;
        delete rec._id;
        return rec;
      }
    }
  }
);

export const ConversationModel: Model<IConversationDocument> = model<IConversationDocument>(
  'Conversation',
  conversationSchema
);
