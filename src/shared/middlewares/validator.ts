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
          errorResponse('No body provided', ERROR_CODES.REQUIRE_REQUEST_BODY)
        );
      return;
    }

    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors: Record<string, string> = {};
      const sanitizedPath = req.baseUrl + req.path;

      result.error.issues.forEach(issue => {
        const field = issue.path.join('.');
        if (!errors[field]) {
          errors[field] = issue.message;
        }
      });

      logger.error(
        {
          message: 'Validation Failed',
          statusCode: statusCode.badRequest,
          requestId: req.requestId,
          path: sanitizedPath,
          method: req.method,
          errors,
        },
        'Validation Failed'
      );

      return res
        .status(statusCode.badRequest)
        .json(
          errorResponse('Validation Failed', ERROR_CODES.INVALID_INPUT, errors)
        );
    }

    // overwrite with validated data
    req.body = result.data;

    return next();
  };
