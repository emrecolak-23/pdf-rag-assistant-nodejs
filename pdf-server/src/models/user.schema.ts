import { Schema, model, Model, Document } from 'mongoose';

export interface IUserAttributes {
  email: string;
  password: string;
}

export interface IUserDocument extends Document, IUserAttributes {
  createdAt: Date;
  updatedAt: Date;
}

const userSchema: Schema<IUserDocument> = new Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: (_doc: IUserDocument, rec: any) => {
        rec.id = rec._id;
        delete rec._id;
        return rec;
      }
    }
  }
);

export const UserModel: Model<IUserDocument> = model<IUserDocument>('User', userSchema);
