import { env } from './env.js';

type NodeEnv = 'development' | 'production' | 'test';

interface Config {
  node_env: NodeEnv;
  port: number;

  mongo: {
    uri: string;
    dbName: string;
  };

  postgres: {
    url: string;
  };

  rabbitmq: {
    url: string;
    queue: string;
    publisherConfirms: boolean;
    retryAttempts: number;
    retryDelay: number;
  };

  jwt: {
    secret: string;
    expiresIn: string;
  };

  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };

  cookie: {
    httpOnly: boolean;
    secure: boolean;
    expiresIn: number;
  };
}

const config: Config = {
  node_env: env.NODE_ENV,
  port: env.PORT,

  mongo: {
    uri: env.MONGO_URI,
    dbName: env.MONGO_DB_NAME,
  },

  postgres: {
    url: env.DATABASE_URL,
  },

  rabbitmq: {
    url: env.RABBITMQ_URL,
    queue: env.RABBITMQ_QUEUE,
    publisherConfirms: env.RABBITMQ_PUBLISHER_CONFIRMS,
    retryAttempts: env.RABBITMQ_RETRY_ATTEMPTS,
    retryDelay: env.RABBITMQ_RETRY_DELAY,
  },

  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  },

  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  },

  cookie: {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    expiresIn: 24 * 60 * 60 * 1000,
  },
};

export default config;
