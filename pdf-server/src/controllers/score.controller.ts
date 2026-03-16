import { Request, Response } from 'express';
import { injectable, singleton } from 'tsyringe';
import StatusCodes from 'http-status-codes';
import { ChatService } from '@pdf/services/chat.service';
import { ConversationService } from '@pdf/services/conversation.service';

@singleton()
@injectable()
export class ScoreController {
  constructor(
    private readonly chatService: ChatService,
    private readonly conversationService: ConversationService
  ) {}

  async updateScore(req: Request, res: Response): Promise<void> {
    const conversationId = req.query.conversation_id as string;
    const { score } = req.body;

    if (typeof score !== 'number' || score < -1 || score > 1) {
      res.status(StatusCodes.BAD_REQUEST).json({ message: 'Score must be a float between -1 and 1' });
      return;
    }

    const conversation = await this.conversationService.findById(conversationId);
    if (!conversation) {
      res.status(StatusCodes.NOT_FOUND).json({ message: 'Conversation not found' });
      return;
    }

    this.chatService.scoreConversation(
      conversation._id!.toString(),
      score,
      conversation.llm || '',
      conversation.retriever || '',
      conversation.memory || ''
    );

    res.json({ message: 'Score updated' });
  }

  async listScores(_req: Request, res: Response): Promise<void> {
    const scores = await this.chatService.getScores();
    res.json(scores);
  }
}
