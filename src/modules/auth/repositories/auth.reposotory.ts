import logger from '@config/logger.js';
import {
  APPLICATION_ROLES,
  getDefaultPermissionsForRole,
} from '@auth/validation/auth.schema.js';
import type { RegisterInput } from '@auth/validation/auth.schema.js';
import User, { type IUser, type UserDocument } from '@auth/models/index.js';

import BaseRepository from './baseRepository.js';

class MongoUserRepository extends BaseRepository<IUser, RegisterInput> {
  constructor() {
    super(User);
  }

  override async create(userData: RegisterInput): Promise<UserDocument> {
    try {
      const data: RegisterInput = { ...userData };

      if (!data.permissions) {
        data.permissions = getDefaultPermissionsForRole(
          data.role ?? APPLICATION_ROLES.CLIENT_VIEWER
        );
      }

      const user = await super.create(data);

      logger.info({ username: user.username }, 'User created');
      return user;
    } catch (error) {
      logger.error({ err: error }, 'Error creating user');
      throw error;
    }
  }

  override async findById(userId: string): Promise<UserDocument | null> {
    try {
      return await super.findById(userId);
    } catch (error) {
      logger.error({ err: error }, 'Error finding user by id');
      throw error;
    }
  }

  override async findByUsername(
    username: string
  ): Promise<UserDocument | null> {
    try {
      return await this.model.findOne({ username });
    } catch (error) {
      logger.error({ err: error }, 'Error finding user by username');
      throw error;
    }
  }

  override async findByEmail(email: string): Promise<UserDocument | null> {
    try {
      return await this.model.findOne({ email });
    } catch (error) {
      logger.error({ err: error }, 'Error finding user by email');
      throw error;
    }
  }

  override async findAll(): Promise<UserDocument[]> {
    try {
      return await this.model.find({ isActive: true }).select('-password');
    } catch (error) {
      logger.error({ err: error }, 'Error finding active users');
      throw error;
    }
  }
}

const authRepository = new MongoUserRepository();

export { MongoUserRepository };
export default authRepository;
