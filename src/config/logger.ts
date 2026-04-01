import pino from 'pino';
import path from 'path';
import { env } from './env.js';

const pinoFactory = (pino as any)?.default ?? pino;

const isProd = env.NODE_ENV === 'production';

const logsDir = path.resolve(process.cwd(), 'logs');

const transport = pinoFactory.transport({
  targets: [
    {
      target: 'pino/file',
      options: {
        destination: path.join(logsDir, 'combined.log'),
        mkdir: true,
      },
      level: 'debug',
    },
    {
      target: 'pino/file',
      options: {
        destination: path.join(logsDir, 'error.log'),
        mkdir: true,
      },
      level: 'error',
    },
    ...(!isProd
      ? [
          {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
            },
            level: 'debug',
          },
        ]
      : []),
  ],
});

const logger = pinoFactory(
  {
    level: isProd ? 'info' : 'debug',
    base: { service: 'api-monitoring' },
    timestamp: pinoFactory.stdTimeFunctions.isoTime,
    serializers: {
      err: pinoFactory.stdSerializers?.err ?? ((e: any) => e),
    },
  },
  transport
);

export default logger;
