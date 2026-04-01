import 'dotenv/config';
import app from './app.js';
import config from '@config/index.js';
import logger from '@config/logger.js';

import mongodb from '@config/database/mongodb.js';
import postgres from '@config/database/postgres.js';
// import rabbitmq from '@config/messaging/rabbitmq.js';

import { Server } from 'http';

/**
 * Initialize all connections
 */
async function initializeConnection(): Promise<void> {
  try {
    logger.info('Initializing database connections...');

    await mongodb.connect();
    await postgres.testConnection();
    // await rabbitmq.connect();

    logger.info('All connections established successfully');
  } catch (error) {
    logger.error('Failed to initialize connections:', error);
    throw error;
  }
}

/**
 * Start server
 */
async function startServer(): Promise<void> {
  try {
    await initializeConnection();

    const server: Server = app.listen(config.port, () => {
      logger.info(`Server started on port ${config.port}`);
      logger.info(`Environment: ${config.node_env}`);
      logger.info(`API: http://localhost:${config.port}`);
    });

    /**
     * Graceful Shutdown
     */
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          await mongodb.disconnect();
          await postgres.close();
          // await rabbitmq.close();

          logger.info('All connections closed');
          process.exit(0);
        } catch (error) {
          logger.error('Shutdown error:', error);
          process.exit(1);
        }
      });

      setTimeout(() => {
        logger.error('Forced shutdown');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

    process.on('uncaughtException', (error: Error) => {
      logger.error(
        { err: error },
        'uncaughtException received, shutting down...'
      );
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason: unknown) => {
      const err = reason instanceof Error ? reason : new Error(String(reason));
      logger.error({ err }, 'unhandledRejection received, shutting down...');
      gracefulShutdown('unhandledRejection');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
