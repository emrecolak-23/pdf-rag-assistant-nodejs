import express, { Router } from 'express';
import { injectable, singleton } from 'tsyringe';
import { AuthController } from '@pdf/controllers';

@singleton()
@injectable()
export class AuthRoute {
  private router: Router;

  constructor(private readonly authController: AuthController) {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.get('/user', this.authController.getUser.bind(this.authController));
    this.router.post('/signup', this.authController.signup.bind(this.authController));
    this.router.post('/signin', this.authController.signin.bind(this.authController));
    this.router.post('/signout', this.authController.signout.bind(this.authController));
    return this.router;
  }
}
