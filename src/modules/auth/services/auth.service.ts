import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import config from '@config/index.js';
import logger from '@config/logger.js';
import type {
  LoginInput,
  RegisterInput,
} from '@auth/validation/auth.schema.js';
import {
  APPLICATION_ROLES,
  getDefaultPermissionsForRole,
} from '@auth/validation/auth.schema.js';
import { ApiError } from '@shared/utils/apiError.js';
import { statusCode } from '@shared/utils/statusCodes.js';

type ApplicationRole =
  (typeof APPLICATION_ROLES)[keyof typeof APPLICATION_ROLES];

type UserRecord = {
  _id: { toString(): string };
  username: string;
  email: string;
  password: string;
  role: ApplicationRole;
  isActive: boolean;
  clientId?: { toString(): string } | string;
  toObject?: () => Record<string, unknown>;
};

type AuthenticatedUser = Omit<UserRecord, 'password'>;

interface UserRepository {
  findAll(): Promise<UserRecord[]>;
  findByUsername(username: string): Promise<UserRecord | null>;
  findByEmail(email: string): Promise<UserRecord | null>;
  findById(userId: string): Promise<UserRecord | null>;
  create(payload: RegisterInput): Promise<UserRecord>;
  createInitialSuperAdmin(payload: RegisterInput): Promise<UserRecord | null>;
}

type AuthResult = {
  user: AuthenticatedUser;
  token: string;
};

export class AuthService {
  private readonly userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    if (!userRepository) {
      throw new Error('userRepository is required');
    }

    this.userRepository = userRepository;
  }

  generateToken(user: UserRecord): string {
    const { _id, email, username, role, clientId } = user;

    const payload = {
      userId: _id.toString(),
      username,
      email,
      role,
      clientId: clientId ? clientId.toString() : undefined,
    };

    const signOptions: jwt.SignOptions = {
      expiresIn: config.jwt.expiresIn as NonNullable<
        jwt.SignOptions['expiresIn']
      >,
    };

    return jwt.sign(payload, config.jwt.secret, signOptions);
  }

  formatUserForResponse(user: UserRecord): AuthenticatedUser {
    const userObj = user.toObject ? user.toObject() : { ...user };
    delete (userObj as Partial<UserRecord>).password;
    return userObj as AuthenticatedUser;
  }

  async comparePassword(
    userEnteredPassword: string,
    hashedPassword: string
  ): Promise<boolean> {
    return bcrypt.compare(userEnteredPassword, hashedPassword);
  }

  async onboardSuperAdmin(superAdminData: RegisterInput): Promise<AuthResult> {
    const user = await this.userRepository.createInitialSuperAdmin({
      ...superAdminData,
      role: APPLICATION_ROLES.SUPER_ADMIN,
      clientId: undefined,
    });

    if (!user) {
      throw new ApiError(
        statusCode.forbidden,
        'SUPER_ADMIN_ONBOARDING_DISABLED'
      );
    }

    const token = this.generateToken(user);

    logger.info({ username: user.username }, 'Admin onboarded successfully');

    return {
      user: this.formatUserForResponse(user),
      token,
    };
  }

  async register(userData: RegisterInput): Promise<AuthResult> {
    const existingUser = await this.userRepository.findByUsername(
      userData.username
    );

    if (existingUser) {
      throw new ApiError(statusCode.conflict, 'USERNAME_ALREADY_EXISTS');
    }

    const existingEmail = await this.userRepository.findByEmail(userData.email);

    if (existingEmail) {
      throw new ApiError(statusCode.conflict, 'EMAIL_ALREADY_EXISTS');
    }

    const sanitizedUserData: RegisterInput = {
      username: userData.username,
      email: userData.email,
      password: userData.password,
      role: APPLICATION_ROLES.CLIENT_VIEWER,
      isActive: true,
      permissions: getDefaultPermissionsForRole(
        APPLICATION_ROLES.CLIENT_VIEWER
      ),
    };

    const user = await this.userRepository.create(sanitizedUserData);
    const token = this.generateToken(user);

    logger.info({ username: user.username }, 'User registered successfully');

    return {
      user: this.formatUserForResponse(user),
      token,
    };
  }

  async login(payload: LoginInput): Promise<AuthResult> {
    const user = await this.userRepository.findByEmail(payload.email);

    if (!user) {
      throw new ApiError(statusCode.unauthorized, 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      throw new ApiError(statusCode.forbidden, 'ACCOUNT_DEACTIVATED');
    }

    const isPasswordValid = await this.comparePassword(
      payload.password,
      user.password
    );

    if (!isPasswordValid) {
      throw new ApiError(statusCode.unauthorized, 'INVALID_CREDENTIALS');
    }

    const token = this.generateToken(user);

    logger.info({ username: user.username }, 'User logged in successfully');

    return {
      user: this.formatUserForResponse(user),
      token,
    };
  }

  async getProfile(userId: string): Promise<AuthenticatedUser> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new ApiError(statusCode.notFound, 'USER_NOT_FOUND');
    }

    return this.formatUserForResponse(user);
  }

  async checkSuperAdminPermissions(userId: string): Promise<boolean> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new ApiError(statusCode.notFound, 'USER_NOT_FOUND');
    }

    return user.role === APPLICATION_ROLES.SUPER_ADMIN;
  }
}

export type { UserRepository, AuthenticatedUser, UserRecord, AuthResult };
