import { Request, Response, NextFunction } from 'express';
import StatusCodes from 'http-status-codes';

export function loginRequired(req: Request, res: Response, next: NextFunction): void {
  if (!req.currentUser) {
    res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Unauthorized' });
    return;
  }
  next();
}
