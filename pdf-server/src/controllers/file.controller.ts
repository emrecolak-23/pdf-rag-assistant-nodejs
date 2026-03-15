import { Request, Response } from 'express';
import { injectable, singleton } from 'tsyringe';
import StatusCodes from 'http-status-codes';
import fs from 'fs';
import path from 'path';
import { PdfRepository } from '@pdf/repositories/pdf.repository';
import { FileService } from '@pdf/services/file.service';

@singleton()
@injectable()
export class FileController {
  constructor(
    private readonly pdfRepository: PdfRepository,
    private readonly fileService: FileService
  ) {}

  async serve(req: Request, res: Response): Promise<void> {
    const pdfId = req.params.pdfId as string;
    const pdf = await this.pdfRepository.findById(pdfId);

    if (!pdf) {
      res.status(StatusCodes.NOT_FOUND).json({ message: 'Not found' });
      return;
    }

    if (pdf.userId.toString() !== req.currentUser!._id!.toString()) {
      res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
      return;
    }

    const ext = path.extname(pdf.name) || '.pdf';
    const filePath = this.fileService.getLocalPath(pdfId, ext);

    if (!fs.existsSync(filePath)) {
      res.status(StatusCodes.NOT_FOUND).json({ message: 'File not found' });
      return;
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.sendFile(path.resolve(filePath));
  }

  async serveInternal(req: Request, res: Response): Promise<void> {
    const pdfId = req.params.pdfId as string;
    const pdf = await this.pdfRepository.findById(pdfId);

    if (!pdf) {
      res.status(StatusCodes.NOT_FOUND).json({ message: 'Not found' });
      return;
    }

    const ext = path.extname(pdf.name) || '.pdf';
    const filePath = this.fileService.getLocalPath(pdfId, ext);

    if (!fs.existsSync(filePath)) {
      res.status(StatusCodes.NOT_FOUND).json({ message: 'File not found' });
      return;
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.sendFile(path.resolve(filePath));
  }
}
