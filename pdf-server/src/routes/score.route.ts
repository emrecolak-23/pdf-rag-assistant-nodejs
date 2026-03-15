import express, { Router } from 'express';
import { injectable, singleton } from 'tsyringe';
import { ScoreController } from '@pdf/controllers';
import { loginRequired } from '@pdf/middlewares';

@singleton()
@injectable()
export class ScoreRoute {
  private router: Router;

  constructor(private readonly scoreController: ScoreController) {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.post('/', loginRequired, this.scoreController.updateScore.bind(this.scoreController));
    this.router.get('/', loginRequired, this.scoreController.listScores.bind(this.scoreController));
    return this.router;
  }
}
