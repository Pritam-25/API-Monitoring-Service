import type { NextFunction, Request, Response } from 'express';
import { APPLICATION_ROLES } from '@auth/validation/auth.schema.js';

import config from '@config/index.js';
import { successResponse } from '@shared/utils/apiResponse.js';
import { statusCode } from '@shared/utils/statusCodes.js';
import type {
  LoginInput,
  RegisterInput,
} from '@auth/validation/auth.schema.js';

type AuthUser = Record<string, unknown>;

interface AuthService {
  onboardSuperAdmin(
    payload: RegisterInput
  ): Promise<{ token: string; user: AuthUser }>;
  register(payload: RegisterInput): Promise<{ token: string; user: AuthUser }>;
  login(payload: LoginInput): Promise<{ token: string; user: AuthUser }>;
  getProfile(userId: string): Promise<AuthUser>;
}

type AuthenticatedRequest = Request & {
  user?: {
    userId?: string;
  };
};

/**
 * Handles auth operations and delegates business logic to AuthService.
 */
export class AuthController {
  private readonly authService: AuthService;

  constructor(authService: AuthService) {
    if (!authService) {
      throw new Error('authService is required');
    }

    this.authService = authService;
  }

  private attachAuthCookie(res: Response, token: string): void {
    res.cookie('authToken', token, {
      httpOnly: config.cookie.httpOnly,
      secure: config.cookie.secure,
      maxAge: config.cookie.expiresIn,
    });
  }

  onboardSuperAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { username, email, password } = req.body as RegisterInput;

      const superAdminData: RegisterInput = {
        username,
        email,
        password,
        role: APPLICATION_ROLES.SUPER_ADMIN,
        isActive: true,
        permissions: {
          canCreateApiKeys: false,
          canManageUsers: false,
          canViewAnalytics: true,
          canExportData: false,
        },
      };

      const { token, user } =
        await this.authService.onboardSuperAdmin(superAdminData);

      this.attachAuthCookie(res, token);

      res
        .status(statusCode.created)
        .json(successResponse('Super admin created successfully', user));
    } catch (error) {
      next(error);
    }
  };

  register = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const payload = req.body as RegisterInput;

      const userData: RegisterInput = {
        ...payload,
        role: payload.role ?? APPLICATION_ROLES.CLIENT_VIEWER,
      };

      const { token, user } = await this.authService.register(userData);

      this.attachAuthCookie(res, token);

      res
        .status(statusCode.created)
        .json(successResponse('User created successfully', user));
    } catch (error) {
      next(error);
    }
  };

  login = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const payload = req.body as LoginInput;
      const { user, token } = await this.authService.login(payload);

      this.attachAuthCookie(res, token);

      res
        .status(statusCode.success)
        .json(successResponse('User logged in successfully', user));
    } catch (error) {
      next(error);
    }
  };

  getProfile = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      const result = await this.authService.getProfile(userId);

      res
        .status(statusCode.success)
        .json(successResponse('Profile fetched successfully', result));
    } catch (error) {
      next(error);
    }
  };

  logout = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      res.clearCookie('authToken');
      res
        .status(statusCode.success)
        .json(successResponse('Logout successful', {}));
    } catch (error) {
      next(error);
    }
  };
}

export type { AuthService };
