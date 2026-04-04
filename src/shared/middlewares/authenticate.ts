import type { NextFunction, Request, Response } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';

import config from '@config/index.js';
import { ApiError } from '@shared/utils/apiError.js';
import { statusCode } from '@shared/utils/statusCodes.js';
import { ERROR_CODES } from '@shared/utils/errorCodes.js';

type AuthJwtPayload = JwtPayload & {
  userId?: string;
  username?: string;
  email?: string;
  role?: string;
  clientId?: string;
};

const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }

  const cookieToken = req.cookies?.authToken;
  if (typeof cookieToken === 'string' && cookieToken.trim().length > 0) {
    return cookieToken;
  }

  return null;
};

const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const token = extractToken(req);

    if (!token) {
      throw new ApiError(statusCode.unauthorized, ERROR_CODES.UNAUTHORIZED);
    }

    const decoded = jwt.verify(token, config.jwt.secret, {
      algorithms: ['HS256'],
    }) as AuthJwtPayload;

    if (!decoded.userId) {
      throw new ApiError(statusCode.unauthorized, ERROR_CODES.UNAUTHORIZED);
    }

    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role,
      clientId: decoded.clientId,
    };

    next();
  } catch {
    next(new ApiError(statusCode.unauthorized, ERROR_CODES.UNAUTHORIZED));
  }
};

export default authenticate;
export { authenticate };
