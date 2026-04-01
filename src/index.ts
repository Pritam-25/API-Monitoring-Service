import 'dotenv/config';
import app from './app.js';
import config from '@config/index.js';
import logger from '@config/logger.js';

import mongodb from '@config/database/mongodb.js';
import postgres from '@config/database/postgres.js';
// import rabbitmq from '@config/messaging/rabbitmq.js';

import { Server } from 'http';

let shuttingDown = false;
let forcedExitTimer: ReturnType<typeof setTimeout> | null = null;

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
    logger.error({ err: error }, 'Failed to initialize connections:');
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
      if (shuttingDown) {
        return;
      }

      shuttingDown = true;
      logger.info(`${signal} received, shutting down...`);

      forcedExitTimer = setTimeout(() => {
        logger.error('Forced shutdown');
        process.exit(1);
      }, 10000);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          await mongodb.disconnect();
          await postgres.close();
          // await rabbitmq.close();

          if (forcedExitTimer) {
            clearTimeout(forcedExitTimer);
            forcedExitTimer = null;
          }

          logger.info('All connections closed');
          process.exit(0);
        } catch (error) {
          logger.error({ err: error }, 'Shutdown error:');
          process.exit(1);
        }
      });
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
    logger.error({ err: error }, 'Failed to start server:');
    process.exit(1);
  }
}

startServer();
