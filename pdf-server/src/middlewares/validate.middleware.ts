import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ObjectSchema } from 'joi';
import { injectable, singleton } from 'tsyringe';

@singleton()
@injectable()
export class ValidateMiddleware {
  validate(schema: ObjectSchema): RequestHandler {
    return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
      const { error } = schema.validate(req.body);
      if (error) {
        const errorMessage = error.details.map((detail) => detail.message).join(', ');
        throw Object.assign(new Error(errorMessage), { status: 400 });
      }
      next();
    };
  }

  validateParams(schema: ObjectSchema): RequestHandler {
    return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
      const { error } = schema.validate(req.params);
      if (error) {
        const errorMessage = error.details.map((detail) => detail.message).join(', ');
        throw Object.assign(new Error(errorMessage), { status: 400 });
      }
      next();
    };
  }
}
