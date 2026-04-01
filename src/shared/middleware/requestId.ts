import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { asyncLocalStorage } from '@shared/utils/requestContext.js';

const requestIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const incoming = (req.headers['x-request-id'] as string) || undefined;
  const requestId = incoming || randomUUID();

  asyncLocalStorage.run({ requestId }, () => {
    (req as any).id = requestId;
    res.setHeader('X-Request-Id', requestId);
    next();
  });
};

export default requestIdMiddleware;
