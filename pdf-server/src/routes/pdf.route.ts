import express, { Router } from 'express';
import { injectable, singleton } from 'tsyringe';
import { PdfController } from '@pdf/controllers';
import { loginRequired } from '@pdf/middlewares';
import multer from 'multer';
import os from 'os';

const upload = multer({ dest: os.tmpdir() });

@singleton()
@injectable()
export class PdfRoute {
  private router: Router;

  constructor(private readonly pdfController: PdfController) {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.get('/', loginRequired, this.pdfController.list.bind(this.pdfController));
    this.router.post('/', loginRequired, upload.single('file'), this.pdfController.upload.bind(this.pdfController));
    this.router.get('/:pdfId', loginRequired, this.pdfController.show.bind(this.pdfController));
    return this.router;
  }
}
