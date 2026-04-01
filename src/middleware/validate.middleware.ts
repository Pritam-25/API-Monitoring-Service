import { ZodType } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '@utils/apiResponse.js';
import { statusCode } from '@utils/statusCodes.js';
import { ERROR_CODES } from '@utils/errorCodes.js';

export const validateSchema =
  (schema: ZodType) => (req: Request, res: Response, next: NextFunction) => {
    if (!req.body) {
      res
        .status(statusCode.badRequest)
        .json(errorResponse('Request body is required', 'No body provided'));
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

      console.log('Errors before response:', errors);
      return res
        .status(statusCode.badRequest)
        .json(errorResponse(ERROR_CODES.VALIDATION_ERROR, errors));
    }

    // overwrite with validated data
    req.body = result.data;

    return next();
  };
