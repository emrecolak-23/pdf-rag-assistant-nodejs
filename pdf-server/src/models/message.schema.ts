import { Schema, model, Model, Document, Types } from 'mongoose';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';

export interface IMessageAttributes {
  role: string;
  content: string;
  conversationId: Types.ObjectId;
}

export interface IMessageDocument extends Document, IMessageAttributes {
  createdAt: Date;
  updatedAt: Date;
  asLcMessage(): HumanMessage | AIMessage | SystemMessage;
}

const messageSchema: Schema<IMessageDocument> = new Schema(
  {
    role: { type: String, required: true },
    content: { type: String, required: true },
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true }
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: (_doc: IMessageDocument, rec: any) => {
        rec.id = rec._id;
        delete rec._id;
        return rec;
      }
    }
  }
);

messageSchema.methods.asLcMessage = function (): HumanMessage | AIMessage | SystemMessage {
  switch (this.role) {
    case 'human':
      return new HumanMessage(this.content);
    case 'ai':
      return new AIMessage(this.content);
    case 'system':
      return new SystemMessage(this.content);
    default:
      throw new Error(`Unknown message role: ${this.role}`);
  }
};

export const MessageModel: Model<IMessageDocument> = model<IMessageDocument>('Message', messageSchema);
