import pino from 'pino';
import { env } from './env.js';
import { getRequestId } from '@shared/utils/getRequestId.js';

// Some build setups make the pino import shape ambiguous. Use a small
// compatibility accessor to obtain the callable factory in either case.
const pinoFactory = (pino as any)?.default ?? pino;

const isProd = env.NODE_ENV === 'production';

const transport = !isProd
  ? pinoFactory.transport({
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    })
  : undefined;

const logger = pinoFactory(
  {
    level: isProd ? 'info' : 'debug',
    base: { service: 'api-monitoring' },
    mixin() {
      return {
        requestId: getRequestId(),
      };
    },
    serializers: {
      err: pinoFactory.stdSerializers?.err ?? ((e: any) => e),
    },
  },
  transport
);

export default logger;
