import { Request, Response, NextFunction } from 'express';
import logger from '@config/logger.js';

const requestLoggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const sanitizedPath = req.baseUrl + req.path;
    const logMeta = {
      method: req.method,
      path: sanitizedPath,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.requestId,
      statusCode: res.statusCode,
      durationMs: duration,
    };
    const message = `${req.method} ${sanitizedPath}`;

    if (res.statusCode >= 500) {
      logger.error(logMeta, message);
      return;
    }

    if (res.statusCode >= 400) {
      logger.warn(logMeta, message);
      return;
    }

    logger.info(logMeta, message);
  });

  next();
};

export default requestLoggerMiddleware;
