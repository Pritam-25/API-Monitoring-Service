import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { successResponse, errorResponse } from '@shared/utils/apiResponse.js';
import { errorHandler } from '@shared/middlewares/errorHandler.js';
import requestIdMiddleware from '@shared/middlewares/requestId.js';
import requestLoggerMiddleware from '@shared/middlewares/requestLogger.js';

// Routers
import authRouter from '@modules/auth/routes/auth.routes.js';
import clientRouter from '@modules/client/routes/client.routes.js';
import ingestRouter from '@modules/ingest/routes/ingest.routes.js';
import { ERROR_CODES } from '@shared/utils/errorCodes.js';
import { statusCode } from '@shared/utils/statusCodes.js';

const app: Application = express();

/**
 * Middlewares
 */
app.use(helmet());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request ID middleware (must run before request logging)
app.use(requestIdMiddleware);

/**
 * Request Logger
 */
app.use(requestLoggerMiddleware);

/**
 * Health Check
 */
app.get('/health', (_req: Request, res: Response) => {
  res.status(statusCode.success).json(
    successResponse('Service is healthy', {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    })
  );
});

/**
 * Root Route
 */
app.get('/', (_req: Request, res: Response) => {
  res.status(statusCode.success).json(
    successResponse('API Monitoring Service Running', {
      version: '1.0.0',
      endpoints: {
        health: '/health',
        auth: '/api/auth',
        ingest: '/api/hit',
        analytics: '/api/analytics',
      },
    })
  );
});

/**
 * Routes
 */
app.use('/api/auth', authRouter);
app.use('/api/hit', ingestRouter);
app.use('/api', clientRouter);

/**
 * 404 Handler
 */
app.use((_req: Request, res: Response) => {
  res
    .status(statusCode.notFound)
    .json(errorResponse('Endpoint not found', ERROR_CODES.NOT_FOUND));
});

/**
 * Global Error Handler
 */
app.use(errorHandler);

export default app;
