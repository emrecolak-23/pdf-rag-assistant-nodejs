import express, { Application, NextFunction, Request, Response } from 'express';
import http from 'http';
import hpp from 'hpp';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import session from 'express-session';
import StatusCodes from 'http-status-codes';
import MongoStore from 'connect-mongo';
import path from 'path';
import fs from 'fs';
import { injectable, singleton } from 'tsyringe';
import { EnvConfig } from '@pdf/config';
import { AuthService } from '@pdf/services/auth.service';
import { appRoutes } from '@pdf/routes';
import { IUserDocument } from '@pdf/models/user.schema';

declare global {
  namespace Express {
    interface Request {
      currentUser?: IUserDocument | null;
    }
  }
}

@singleton()
@injectable()
export class PdfServer {
  private readonly SERVER_PORT: number;

  constructor(
    private readonly config: EnvConfig,
    private readonly authService: AuthService
  ) {
    this.SERVER_PORT = this.config.PORT;
  }

  public start(app: Application): void {
    this.securityMiddleware(app);
    this.standardMiddleware(app);
    this.routesMiddleware(app);
    this.clientMiddleware(app);
    this.errorHandler(app);
    this.startServer(app);
  }

  private securityMiddleware(app: Application): void {
    app.set('trust proxy', 1);
    app.use(hpp());
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://cdnjs.cloudflare.com', 'blob:'],
            workerSrc: ["'self'", 'blob:', 'https://cdnjs.cloudflare.com'],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com'],
            imgSrc: ["'self'", 'data:', 'blob:'],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", 'https://cdnjs.cloudflare.com'],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"]
          }
        }
      })
    );
    app.use(
      cors({
        origin: ['http://localhost:5173', 'http://localhost:8000', 'http://127.0.0.1:5173', 'http://127.0.0.1:8000'],
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
        credentials: true
      })
    );
    app.use(
      session({
        secret: this.config.SECRET_KEY,
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 },
        store: MongoStore.create({
          mongoUrl: this.config.MONGODB_URI,
          touchAfter: 24 * 3600
        })
      })
    );
    app.use(async (req: Request, _res: Response, next: NextFunction) => {
      const userId = (req.session as any)?.userId;
      if (userId) {
        try {
          req.currentUser = await this.authService.findById(userId);
        } catch {
          req.currentUser = null;
        }
      } else {
        req.currentUser = null;
      }
      next();
    });
  }

  private standardMiddleware(app: Application): void {
    app.use(compression());
    app.use(express.json({ limit: '200mb' }));
    app.use(express.urlencoded({ extended: true, limit: '200mb' }));
    app.use((_req: Request, res: Response, next: NextFunction) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      next();
    });
  }

  private routesMiddleware(app: Application): void {
    appRoutes(app);
  }

  private clientMiddleware(app: Application): void {
    const fromRoot = path.resolve(process.cwd(), 'client/build');
    const fromServer = path.resolve(process.cwd(), '../client/build');
    const clientBuildPath = fs.existsSync(fromRoot) ? fromRoot : fromServer;

    if (fs.existsSync(clientBuildPath)) {
      app.use(express.static(clientBuildPath));
      app.get('/{*path}', (_req: Request, res: Response) => {
        res.sendFile(path.join(clientBuildPath, 'index.html'));
      });
    } else {
      app.get('/', (_req: Request, res: Response) => {
        res.send('<p>Client not built. Run <code>cd client && pnpm build</code> then restart server.</p>');
      });
    }
  }

  private errorHandler(app: Application): void {
    app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
      console.error('PdfService errorHandler:', err);

      if (err.code === 11000) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'In use' });
      }

      if (err.name === 'CastError' || err.name === 'DocumentNotFoundError') {
        return res.status(StatusCodes.NOT_FOUND).json({ message: 'Not found' });
      }

      if (err.status) {
        return res.status(err.status).json({ message: err.message });
      }

      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: 'An unexpected error occurred',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        status: 'error',
        comingFrom: 'PdfService errorHandler'
      });
      next();
    });
  }

  private async startServer(app: Application): Promise<void> {
    try {
      const httpServer: http.Server = new http.Server(app);
      httpServer.listen(this.SERVER_PORT, () => {
        console.log(`Pdf server has started with process id of ${process.pid}`);
        console.log(`Pdf server running on port ${this.SERVER_PORT}`);
      });
    } catch (err) {
      console.error('PdfService startServer() error:', err);
    }
  }
}
