import { Request, Response } from 'express';
import { injectable, singleton } from 'tsyringe';
import StatusCodes from 'http-status-codes';
import { AuthService } from '@pdf/services/auth.service';

@singleton()
@injectable()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async getUser(req: Request, res: Response): Promise<void> {
    if (req.currentUser) {
      res.json({ id: req.currentUser._id!.toString(), email: req.currentUser.email });
    } else {
      res.json(null);
    }
  }

  async signup(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;
    const user = await this.authService.signup(email, password);

    (req.session as any).userId = user._id!.toString();
    res.status(StatusCodes.CREATED).json({ id: user._id!.toString(), email: user.email });
  }

  async signin(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;
    const user = await this.authService.signin(email, password);

    (req.session as any).userId = user._id!.toString();
    res.json({ id: user._id!.toString(), email: user.email });
  }

  async signout(req: Request, res: Response): Promise<void> {
    req.session.destroy(() => {
      res.json({ message: 'Successfully logged out.' });
    });
  }
}
