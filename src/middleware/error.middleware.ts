import { Request, Response, NextFunction } from 'express';
import { ApiError } from '@utils/apiError.js';
import { errorResponse } from '@utils/apiResponse.js';
import { ERROR_CODES } from '@utils/errorCodes.js';
import { statusCode } from '@utils/statusCodes.js';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof ApiError) {
    return res
      .status(err.statusCode)
      .json(errorResponse(err.errorCode, err.name));
  }

  // unknown error
  console.error(err);

  return res
    .status(statusCode.internalError)
    .json(errorResponse(ERROR_CODES.INTERNAL_ERROR, err.name));
};
