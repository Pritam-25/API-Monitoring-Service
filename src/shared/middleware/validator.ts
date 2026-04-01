import { ZodType } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { errorResponse } from 'src/shared/utils/apiResponse.js';
import { statusCode } from 'src/shared/utils/statusCodes.js';
import { ERROR_CODES } from 'src/shared/utils/errorCodes.js';
import logger from '@config/logger.js';

export const validateSchema =
  (schema: ZodType) => (req: Request, res: Response, next: NextFunction) => {
    if (!req.body) {
      res
        .status(statusCode.badRequest)
        .json(
          errorResponse(ERROR_CODES.REQUIRE_REQUEST_BODY, 'No body provided')
        );
      return;
    }

    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors: Record<string, string> = {};

      result.error.issues.forEach(issue => {
        const field = issue.path.join('.');
        if (!errors[field]) {
          errors[field] = issue.message;
        }
      });

      logger.error('Error occurred:', {
        message: 'Validation failed',
        statusCode: statusCode.badRequest,
        stack: undefined,
        path: req.path,
        method: req.method,
        errors,
      });

      return res
        .status(statusCode.badRequest)
        .json(errorResponse(ERROR_CODES.INVALID_INPUT, errors));
    }

    // overwrite with validated data
    req.body = result.data;

    return next();
  };
