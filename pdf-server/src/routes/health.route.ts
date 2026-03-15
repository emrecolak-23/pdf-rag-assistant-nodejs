import express, { Router } from 'express';
import { injectable, singleton } from 'tsyringe';
import { HealthController } from '@pdf/controllers';

@singleton()
@injectable()
export class HealthRoute {
  private router: Router;

  constructor(private readonly healthController: HealthController) {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.get('/pdf-health', this.healthController.health.bind(this.healthController));
    return this.router;
  }
}
