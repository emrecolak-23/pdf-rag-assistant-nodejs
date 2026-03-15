import { Application } from 'express';
import { container } from 'tsyringe';
import { HealthRoute } from '@pdf/routes/health.route';
import { AuthRoute } from '@pdf/routes/auth.route';
import { PdfRoute } from '@pdf/routes/pdf.route';
import { FileRoute } from '@pdf/routes/file.route';
import { InternalFileRoute } from '@pdf/routes/internal-file.route';
import { ConversationRoute } from '@pdf/routes/conversation.route';
import { ScoreRoute } from '@pdf/routes/score.route';

const BASE_PATH = '/api';

export const appRoutes = (app: Application): void => {
  const healthRoute = container.resolve(HealthRoute);
  const authRoute = container.resolve(AuthRoute);
  const pdfRoute = container.resolve(PdfRoute);
  const fileRoute = container.resolve(FileRoute);
  const internalFileRoute = container.resolve(InternalFileRoute);
  const conversationRoute = container.resolve(ConversationRoute);
  const scoreRoute = container.resolve(ScoreRoute);

  app.use('', healthRoute.routes());
  app.use('/internal/files', internalFileRoute.routes());
  app.use(`${BASE_PATH}/auth`, authRoute.routes());
  app.use(`${BASE_PATH}/pdfs`, pdfRoute.routes());
  app.use(`${BASE_PATH}/files`, fileRoute.routes());
  app.use(`${BASE_PATH}/conversations`, conversationRoute.routes());
  app.use(`${BASE_PATH}/scores`, scoreRoute.routes());
};
