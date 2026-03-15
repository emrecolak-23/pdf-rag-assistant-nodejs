import express, { Router } from 'express';
import { injectable, singleton } from 'tsyringe';
import { ConversationController } from '@pdf/controllers';
import { loginRequired } from '@pdf/middlewares';

@singleton()
@injectable()
export class ConversationRoute {
  private router: Router;

  constructor(private readonly conversationController: ConversationController) {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.get('/', loginRequired, this.conversationController.list.bind(this.conversationController));
    this.router.post('/', loginRequired, this.conversationController.create.bind(this.conversationController));
    this.router.post(
      '/:conversationId/messages',
      loginRequired,
      this.conversationController.createMessage.bind(this.conversationController)
    );
    return this.router;
  }
}
