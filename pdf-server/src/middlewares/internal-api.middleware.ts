import { Request, Response, NextFunction } from 'express';
import StatusCodes from 'http-status-codes';
import { EnvConfig } from '@pdf/config';
import { container } from 'tsyringe';

export const internalApiRequired = (req: Request, res: Response, next: NextFunction): void => {
  const config = container.resolve(EnvConfig);
  const apiKey = req.headers['x-internal-api-key'] as string;

  if (!config.INTERNAL_API_KEY || config.INTERNAL_API_KEY !== apiKey) {
    res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Invalid or missing internal API key' });
    return;
  }
  next();
};
