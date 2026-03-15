import express, { Router } from 'express';
import { injectable, singleton } from 'tsyringe';
import { FileController } from '@pdf/controllers/file.controller';
import { loginRequired } from '@pdf/middlewares';

@singleton()
@injectable()
export class FileRoute {
  private router: Router;

  constructor(private readonly fileController: FileController) {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.get('/:pdfId', loginRequired, this.fileController.serve.bind(this.fileController));
    return this.router;
  }
}
