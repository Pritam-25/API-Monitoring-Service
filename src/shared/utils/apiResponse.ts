import { env } from '@config/env.js';
import getRequestId from './getRequestId.js';
import { resolvePublicErrorCode } from './resolvePublicError.js';

export const successResponse = <T>(message: string, data?: T) => ({
  success: true as const,
  message,
  data,
  meta: {
    timestamp: new Date().toISOString(),
    requestId: getRequestId(),
  },
});

export const errorResponse = <T>(message: string, error?: T) => ({
  success: false as const,
  message,
  ...(error !== undefined && { errorCode: resolvePublicErrorCode(error) }),
  ...(env.NODE_ENV === 'development' && error !== undefined && { error }),
  meta: {
    timestamp: new Date().toISOString(),
    requestId: getRequestId(),
  },
});

export const paginatedResponse = <T>(
  data: T,
  page: number,
  limit: number,
  total: number
) => {
  if (!Number.isInteger(limit) || limit <= 0) {
    throw new RangeError('paginatedResponse: limit must be a positive integer');
  }

  return {
    success: true as const,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: getRequestId(),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  };
};
