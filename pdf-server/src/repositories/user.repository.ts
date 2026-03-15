import { inject, injectable, singleton } from 'tsyringe';
import { Model } from 'mongoose';
import { IUserDocument } from '@pdf/models/user.schema';

@injectable()
@singleton()
export class UserRepository {
  constructor(@inject('UserModel') private readonly userModel: Model<IUserDocument>) {}

  async createUser(email: string, password: string): Promise<IUserDocument> {
    return this.userModel.create({ email, password });
  }

  async findById(id: string): Promise<IUserDocument | null> {
    return this.userModel.findById(id);
  }

  async findByEmail(email: string): Promise<IUserDocument | null> {
    return this.userModel.findOne({ email });
  }
}
