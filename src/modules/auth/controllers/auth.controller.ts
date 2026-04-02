import type { Request, Response } from 'express';
import {
  APPLICATION_ROLES,
  getDefaultPermissionsForRole,
} from '@auth/validation/auth.schema.js';

import config from '@config/index.js';
import { successResponse } from '@shared/utils/apiResponse.js';
import { statusCode } from '@shared/utils/statusCodes.js';
import type {
  LoginInput,
  OnboardSuperAdminInput,
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

  onboardSuperAdmin = async (req: Request, res: Response): Promise<void> => {
    const { username, email, password } = req.body as OnboardSuperAdminInput;

    const superAdminData: RegisterInput = {
      username,
      email,
      password,
      role: APPLICATION_ROLES.SUPER_ADMIN,
      isActive: true,
      permissions: getDefaultPermissionsForRole(APPLICATION_ROLES.SUPER_ADMIN),
    };

    const { token, user } =
      await this.authService.onboardSuperAdmin(superAdminData);

    this.attachAuthCookie(res, token);

    res
      .status(statusCode.created)
      .json(successResponse('Super admin created successfully', user));
  };

  register = async (req: Request, res: Response): Promise<void> => {
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
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const payload = req.body as LoginInput;
    const { user, token } = await this.authService.login(payload);

    this.attachAuthCookie(res, token);

    res
      .status(statusCode.success)
      .json(successResponse('User logged in successfully', user));
  };

  getProfile = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    const result = await this.authService.getProfile(userId);

    res
      .status(statusCode.success)
      .json(successResponse('Profile fetched successfully', result));
  };

  logout = async (_req: Request, res: Response): Promise<void> => {
    res.clearCookie('authToken', {
      httpOnly: config.cookie.httpOnly,
      secure: config.cookie.secure,
    });
    res
      .status(statusCode.success)
      .json(successResponse('Logout successful', {}));
  };
}

export type { AuthService };
