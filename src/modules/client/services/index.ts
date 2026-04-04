import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

import logger from '@config/logger.js';
import { APPLICATION_ROLES } from '@auth/validation/auth.schema.js';
import { type MongoUserRepository } from '@modules/auth/repositories/auth.repository.js';
import {
  type IUser,
  type UserDocument,
} from '@modules/auth/models/user.model.js';
import { type IApiKey, type IClient } from '@modules/clients/models/index.js';
import { ApiError } from '@shared/utils/apiError.js';
import { statusCode } from '@shared/utils/statusCodes.js';
import { type MongoApiKeyRepository } from '@client/repositories/apiKey.repository.js';
import { type MongoClientRepository } from '@client/repositories/client.repository.js';

import type {
  CreateApiKeyInput,
  CreateClientInput,
  CreateClientUserInput,
} from '@client/validation/client.schema.js';

type ClientUserRole =
  | typeof APPLICATION_ROLES.CLIENT_ADMIN
  | typeof APPLICATION_ROLES.CLIENT_VIEWER;

type ClientPermissions = {
  canCreateApiKeys: boolean;
  canManageUsers: boolean;
  canViewAnalytics: boolean;
  canExportData: boolean;
};

type AuthUserContext = {
  userId: string;
  role?: string | undefined;
  clientId?: string | undefined;
};

type ClientServiceDependencies = {
  clientRepository: MongoClientRepository;
  apiKeyRepository: MongoApiKeyRepository;
  userRepository: MongoUserRepository;
};

export class ClientService {
  private readonly clientRepository: MongoClientRepository;

  private readonly apiKeyRepository: MongoApiKeyRepository;

  private readonly userRepository: MongoUserRepository;

  constructor(dependencies: ClientServiceDependencies) {
    if (!dependencies) {
      throw new Error('dependencies are required');
    }

    if (!dependencies.clientRepository) {
      throw new Error('clientRepository is required');
    }

    if (!dependencies.apiKeyRepository) {
      throw new Error('apiKeyRepository is required');
    }

    if (!dependencies.userRepository) {
      throw new Error('userRepository is required');
    }

    this.clientRepository = dependencies.clientRepository;
    this.apiKeyRepository = dependencies.apiKeyRepository;
    this.userRepository = dependencies.userRepository;
  }

  private formatUserForResponse(user: UserDocument): Record<string, unknown> {
    const userObj = user.toObject ? user.toObject() : { ...user };
    delete (userObj as Partial<IUser>).password;
    return userObj as unknown as Record<string, unknown>;
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  private canUserAccessClient(
    user: AuthUserContext,
    clientId: string
  ): boolean {
    if (user.role === APPLICATION_ROLES.SUPER_ADMIN) {
      return true;
    }

    return Boolean(user.clientId) && user.clientId === clientId;
  }

  private isValidClientRole(role: string): role is ClientUserRole {
    return (
      role === APPLICATION_ROLES.CLIENT_ADMIN ||
      role === APPLICATION_ROLES.CLIENT_VIEWER
    );
  }

  private generateApiKey(): string {
    return `apim_${crypto.randomBytes(20).toString('hex')}`;
  }

  async createClient(
    clientData: CreateClientInput,
    adminUser: { userId: string }
  ): Promise<Record<string, unknown>> {
    try {
      const slug = this.generateSlug(clientData.name);

      const existingClient = await this.clientRepository.findBySlug(slug);

      if (existingClient) {
        throw new ApiError(statusCode.conflict, 'CLIENT_SLUG_ALREADY_EXISTS');
      }

      const clientPayload = {
        name: clientData.name,
        slug,
        email: clientData.email,
        description: clientData.description,
        website: clientData.website,
        createdBy: adminUser.userId as unknown as IClient['createdBy'],
        isActive: clientData.isActive,
        ...(clientData.settings !== undefined && {
          settings: clientData.settings,
        }),
      };

      const client = await this.clientRepository.create(clientPayload);

      return client.toObject() as unknown as Record<string, unknown>;
    } catch (error) {
      logger.error({ err: error }, 'Error creating client');
      throw error;
    }
  }

  async createClientUser(
    clientId: string,
    userData: CreateClientUserInput,
    adminUser: AuthUserContext
  ): Promise<Record<string, unknown>> {
    try {
      if (!this.canUserAccessClient(adminUser, clientId)) {
        throw new ApiError(statusCode.forbidden, 'ACCESS_DENIED');
      }

      const role = userData.role ?? APPLICATION_ROLES.CLIENT_VIEWER;

      if (!this.isValidClientRole(role)) {
        throw new ApiError(statusCode.badRequest, 'INVALID_CLIENT_ROLE');
      }

      const client = await this.clientRepository.findById(clientId);
      if (!client) {
        throw new ApiError(statusCode.notFound, 'CLIENT_NOT_FOUND');
      }

      const permissions: ClientPermissions =
        role === APPLICATION_ROLES.CLIENT_ADMIN
          ? {
              canCreateApiKeys: true,
              canManageUsers: true,
              canViewAnalytics: true,
              canExportData: true,
            }
          : {
              canCreateApiKeys: false,
              canManageUsers: false,
              canViewAnalytics: true,
              canExportData: false,
            };

      const createdUser = await this.userRepository.create({
        username: userData.username,
        email: userData.email,
        password: userData.password,
        role,
        clientId: client._id.toString(),
        isActive: userData.isActive,
        permissions,
      });

      logger.info(
        { clientId, userId: createdUser._id.toString(), role },
        'Client user created'
      );

      return this.formatUserForResponse(createdUser);
    } catch (error) {
      logger.error({ err: error }, 'Error creating client user');
      throw error;
    }
  }

  async createApiKey(
    clientId: string,
    keyData: CreateApiKeyInput,
    user: AuthUserContext
  ): Promise<Record<string, unknown>> {
    try {
      const client = await this.clientRepository.findById(clientId);

      if (!client) {
        throw new ApiError(statusCode.notFound, 'CLIENT_NOT_FOUND');
      }

      if (!this.canUserAccessClient(user, clientId)) {
        throw new ApiError(statusCode.forbidden, 'ACCESS_DENIED');
      }

      if (
        !(
          user.role === APPLICATION_ROLES.SUPER_ADMIN ||
          user.role === APPLICATION_ROLES.CLIENT_ADMIN
        )
      ) {
        throw new ApiError(statusCode.forbidden, 'INSUFFICIENT_ROLE');
      }

      const metadata: IApiKey['metadata'] = {
        createdBy: user.userId as unknown as IApiKey['createdBy'],
        tags: keyData.metadata?.tags ?? [],
        ...(keyData.metadata?.purpose !== undefined && {
          purpose: keyData.metadata.purpose,
        }),
      };

      const apiKey = await this.apiKeyRepository.create({
        keyId: uuidv4(),
        keyValue: this.generateApiKey(),
        clientId: client._id,
        name: keyData.name,
        description: keyData.description,
        environment: keyData.environment,
        isActive: keyData.isActive,
        permissions: {
          canIngest: keyData.permissions?.canIngest ?? true,
          canReadAnalytics: keyData.permissions?.canReadAnalytics ?? false,
          allowedServices: keyData.permissions?.allowedServices ?? [],
        },
        security: {
          allowedIPs: keyData.security?.allowedIPs ?? [],
          allowedOrigins: keyData.security?.allowedOrigins ?? [],
          lastRotated: new Date(),
          rotationWarningDays: keyData.security?.rotationWarningDays ?? 30,
        },
        expiresAt: keyData.expiresAt ? new Date(keyData.expiresAt) : new Date(),
        metadata,
        createdBy: user.userId as unknown as IApiKey['createdBy'],
      });

      return apiKey.toObject() as unknown as Record<string, unknown>;
    } catch (error) {
      logger.error({ err: error }, 'Error creating API key');
      throw error;
    }
  }

  async getClientApiKeys(
    clientId: string,
    user: AuthUserContext
  ): Promise<Record<string, unknown>[]> {
    try {
      if (!this.canUserAccessClient(user, clientId)) {
        throw new ApiError(statusCode.forbidden, 'ACCESS_DENIED');
      }

      const apiKeys = await this.apiKeyRepository.findByClientId(clientId);

      return apiKeys.map(key => {
        const keyObj = key.toObject ? key.toObject() : { ...key };
        delete (keyObj as Partial<IApiKey>).keyValue;
        return keyObj as unknown as Record<string, unknown>;
      });
    } catch (error) {
      logger.error({ err: error }, 'Error getting client API keys');
      throw error;
    }
  }

  async getClientByApiKey(
    apiKey: string
  ): Promise<{ client: unknown; apiKey: Record<string, unknown> } | null> {
    try {
      const key = await this.apiKeyRepository.findByKeyValue(apiKey);

      if (!key || key.isExpired()) {
        return null;
      }

      const keyObj = key.toObject ? key.toObject() : { ...key };

      return {
        client: keyObj.clientId,
        apiKey: keyObj as unknown as Record<string, unknown>,
      };
    } catch (error) {
      logger.error({ err: error }, 'Error finding client by API key');
      throw error;
    }
  }
}

export type { AuthUserContext, ClientServiceDependencies };
