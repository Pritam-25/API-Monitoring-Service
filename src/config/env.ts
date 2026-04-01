import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    PORT: z.string().transform(Number).default(4000),

    // Mongo
    MONGO_URI: z.string().default('mongodb://localhost:27017/api_monitoring'),
    MONGO_DB_NAME: z.string().default('api_monitoring'),

    // PostgreSQL
    DATABASE_URL: z.string(),

    // RabbitMQ
    RABBITMQ_URL: z.string().default('amqp://localhost:5672'),
    RABBITMQ_QUEUE: z.string().default('api_hits'),
    RABBITMQ_PUBLISHER_CONFIRMS: z
      .string()
      .transform(val => val === 'true')
      .default(false),
    RABBITMQ_RETRY_ATTEMPTS: z.string().transform(Number).default(3),
    RABBITMQ_RETRY_DELAY: z.string().transform(Number).default(1000),

    // JWT
    JWT_SECRET: z.string().min(32),
    JWT_EXPIRES_IN: z.string().default('24h'),

    // Rate Limit
    RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default(900000),
    RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default(1000),
  },

  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
