import express, { Router } from 'express';
import { injectable, singleton } from 'tsyringe';
import { FileController } from '@pdf/controllers/file.controller';
import { internalApiRequired } from '@pdf/middlewares/internal-api.middleware';

@singleton()
@injectable()
export class InternalFileRoute {
  private router: Router;

  constructor(private readonly fileController: FileController) {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.get('/:pdfId', internalApiRequired, this.fileController.serveInternal.bind(this.fileController));
    return this.router;
  }
}
