import type { Request, Response } from 'express';

import type {
  CreateApiKeyInput,
  CreateClientInput,
  CreateClientUserInput,
} from '@client/validation/client.schema.js';
import type { ClientService } from '@client/services/index.js';
import type { AuthService } from '@modules/auth/services/auth.service.js';
import { ApiError } from '@shared/utils/apiError.js';
import { successResponse } from '@shared/utils/apiResponse.js';
import { ERROR_CODES } from '@shared/utils/errorCodes.js';
import { statusCode } from '@shared/utils/statusCodes.js';

export class ClientController {
  private readonly clientService: ClientService;

  private readonly authService: AuthService;

  constructor(clientService: ClientService, authService: AuthService) {
    if (!clientService) {
      throw new Error('clientService is required');
    }

    if (!authService) {
      throw new Error('authService is required');
    }

    this.clientService = clientService;
    this.authService = authService;
  }

  // Creates a new client organization and restricts access to super admins only.
  createClient = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(statusCode.unauthorized, ERROR_CODES.UNAUTHORIZED);
    }

    const isSuperAdmin =
      await this.authService.checkSuperAdminPermissions(userId);

    if (!isSuperAdmin) {
      throw new ApiError(statusCode.forbidden, 'ACCESS_DENIED');
    }

    const payload = req.body as CreateClientInput;
    const client = await this.clientService.createClient(payload, { userId });

    res
      .status(statusCode.created)
      .json(successResponse('Client created successfully', client));
  };

  // Creates a user account under a specific client.
  createClientUser = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new ApiError(statusCode.unauthorized, ERROR_CODES.UNAUTHORIZED);
    }

    const { clientId } = req.params as { clientId?: string };
    if (!clientId) {
      throw new ApiError(statusCode.badRequest, ERROR_CODES.INVALID_INPUT);
    }

    const payload = req.body as CreateClientUserInput;
    const user = await this.clientService.createClientUser(clientId, payload, {
      userId,
      role: req.user?.role,
      clientId: req.user?.clientId,
    });

    res
      .status(statusCode.created)
      .json(successResponse('Client user created successfully', user));
  };

  // Creates a new API key for a specific client.
  createApiKey = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new ApiError(statusCode.unauthorized, ERROR_CODES.UNAUTHORIZED);
    }

    const { clientId } = req.params as { clientId?: string };
    if (!clientId) {
      throw new ApiError(statusCode.badRequest, ERROR_CODES.INVALID_INPUT);
    }

    const payload = req.body as CreateApiKeyInput;
    const apiKey = await this.clientService.createApiKey(clientId, payload, {
      userId,
      role: req.user?.role,
      clientId: req.user?.clientId,
    });

    res
      .status(statusCode.created)
      .json(successResponse('API key created successfully', apiKey));
  };

  // Returns all active API keys for the requested client.
  getClientApiKeys = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new ApiError(statusCode.unauthorized, ERROR_CODES.UNAUTHORIZED);
    }

    const { clientId } = req.params as { clientId?: string };
    if (!clientId) {
      throw new ApiError(statusCode.badRequest, ERROR_CODES.INVALID_INPUT);
    }

    const apiKeys = await this.clientService.getClientApiKeys(clientId, {
      userId,
      role: req.user?.role,
      clientId: req.user?.clientId,
    });

    res
      .status(statusCode.success)
      .json(successResponse('API keys fetched successfully', apiKeys));
  };
}

export type { ClientService, AuthService };
