import { Request, Response } from 'express';
import { injectable, singleton } from 'tsyringe';
import StatusCodes from 'http-status-codes';
import { ConversationService } from '@pdf/services/conversation.service';
import { PdfService } from '@pdf/services/pdf.service';
import { ChatService, ChatArgs } from '@pdf/services/chat.service';

@singleton()
@injectable()
export class ConversationController {
  constructor(
    private readonly conversationService: ConversationService,
    private readonly pdfService: PdfService,
    private readonly chatService: ChatService
  ) {}

  async list(req: Request, res: Response): Promise<void> {
    const pdfId = req.query.pdf_id as string;
    if (!pdfId) {
      res.status(StatusCodes.BAD_REQUEST).json({ message: 'pdf_id is required' });
      return;
    }

    const conversations = await this.conversationService.getByPdfId(pdfId);
    res.json(conversations);
  }

  async create(req: Request, res: Response): Promise<void> {
    const pdfId = req.query.pdf_id as string;
    if (!pdfId) {
      res.status(StatusCodes.BAD_REQUEST).json({ message: 'pdf_id is required' });
      return;
    }

    const conversation = await this.conversationService.create(req.currentUser!._id!.toString(), pdfId);
    res.status(StatusCodes.CREATED).json(conversation.toJSON());
  }

  async createMessage(req: Request, res: Response): Promise<void> {
    const { conversationId } = req.params;
    const { input } = req.body;
    const streaming = req.query.stream === 'true';

    const query = typeof input === 'string' ? input.trim() : '';
    if (!query) {
      res.status(StatusCodes.BAD_REQUEST).json({ message: 'input is required and must be a non-empty string' });
      return;
    }

    const conversation = await this.conversationService.findById(conversationId as string);
    if (!conversation) {
      res.status(StatusCodes.NOT_FOUND).json({ message: 'Conversation not found' });
      return;
    }

    if (conversation.userId.toString() !== req.currentUser!._id!.toString()) {
      res.status(StatusCodes.UNAUTHORIZED).json({ message: 'You are not authorized to view this.' });
      return;
    }

    const pdf = await this.pdfService.getById(conversation.pdfId.toString());

    const chatArgs: ChatArgs = {
      conversationId: conversation._id!.toString(),
      pdfId: pdf!._id!.toString(),
      streaming,
      metadata: {
        conversation_id: conversation._id!.toString(),
        user_id: req.currentUser!._id!.toString(),
        pdf_id: pdf!._id!.toString()
      }
    };

    const chat = await this.chatService.buildChat(chatArgs);

    if (!chat) {
      res.send('Chat not yet implemented!');
      return;
    }

    if (streaming) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders();

      for await (const chunk of chat.stream(query)) {
        res.write(`data: ${chunk}\n\n`);
        if (typeof (res as any).flush === 'function') {
          (res as any).flush();
        }
      }

      res.write('data: [DONE]\n\n');
      res.end();
    }
  }
}
