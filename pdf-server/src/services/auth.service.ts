import { injectable, singleton } from 'tsyringe';
import bcrypt from 'bcryptjs';
import { UserRepository } from '@pdf/repositories/user.repository';
import { IUserDocument } from '@pdf/models/user.schema';

@injectable()
@singleton()
export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  async signup(email: string, password: string): Promise<IUserDocument> {
    const hashedPassword = await bcrypt.hash(password, 10);
    return this.userRepository.createUser(email, hashedPassword);
  }

  async signin(email: string, password: string): Promise<IUserDocument> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw Object.assign(new Error('User not found.'), { status: 400 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw Object.assign(new Error('Incorrect password.'), { status: 400 });
    }

    return user;
  }

  async findById(id: string): Promise<IUserDocument | null> {
    return this.userRepository.findById(id);
  }
}
