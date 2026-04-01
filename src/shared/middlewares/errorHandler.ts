import { Request, Response, NextFunction } from 'express';
import { ApiError } from 'src/shared/utils/apiError.js';
import { errorResponse } from 'src/shared/utils/apiResponse.js';
import { ERROR_CODES } from 'src/shared/utils/errorCodes.js';
import { statusCode } from 'src/shared/utils/statusCodes.js';
import logger from '@config/logger.js';

export const errorHandler = (
  err: Error & { statusCode?: number },
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const status =
    (err instanceof ApiError && err.statusCode) ||
    err.statusCode ||
    statusCode.internalError;

  logger.error(
    {
      err,
      requestId: req.requestId,
      statusCode: status,
      path: req.path,
      method: req.method,
    },
    'Error occurred'
  );

  if (err instanceof ApiError) {
    return res
      .status(err.statusCode)
      .json(errorResponse(err.errorCode, err.name));
  }

  return res
    .status(status)
    .json(errorResponse(ERROR_CODES.INTERNAL_ERROR, err.name));
};
