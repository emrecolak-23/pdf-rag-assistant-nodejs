import { Request, Response } from 'express';
import { injectable, singleton } from 'tsyringe';
import StatusCodes from 'http-status-codes';
import { PdfService } from '@pdf/services/pdf.service';
import fs from 'fs';

@singleton()
@injectable()
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  async list(req: Request, res: Response): Promise<void> {
    const pdfs = await this.pdfService.getByUserId(req.currentUser!._id!.toString());
    res.json(pdfs.map((p) => p.toJSON()));
  }

  async upload(req: Request, res: Response): Promise<void> {
    if (!req.file) {
      res.status(StatusCodes.BAD_REQUEST).json({ message: 'File is required' });
      return;
    }

    try {
      const { pdf } = await this.pdfService.uploadAndCreate(
        req.file.path,
        req.file.originalname,
        req.currentUser!._id!.toString()
      );

      res.status(StatusCodes.CREATED).json(pdf.toJSON());
    } finally {
      if (req.file?.path) {
        fs.unlinkSync(req.file.path);
      }
    }
  }

  async show(req: Request, res: Response): Promise<void> {
    const pdf = await this.pdfService.getById(req.params.pdfId as string);
    if (!pdf) {
      res.status(StatusCodes.NOT_FOUND).json({ message: 'Pdf not found' });
      return;
    }

    if (pdf.userId.toString() !== req.currentUser!._id!.toString()) {
      res.status(StatusCodes.UNAUTHORIZED).json({ message: 'You are not authorized to view this.' });
      return;
    }

    res.json({
      pdf: pdf.toJSON(),
      download_url: this.pdfService.getDownloadUrl(pdf._id!.toString())
    });
  }
}
