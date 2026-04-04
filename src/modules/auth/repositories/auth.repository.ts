import logger from '@config/logger.js';
import {
  APPLICATION_ROLES,
  getDefaultPermissionsForRole,
} from '@auth/validation/auth.schema.js';
import type { RegisterInput } from '@auth/validation/auth.schema.js';
import User, {
  type IUser,
  type UserDocument,
} from '@modules/auth/models/user.model.js';

import BaseRepository from './baseRepository.js';

class MongoUserRepository extends BaseRepository<IUser, RegisterInput> {
  constructor() {
    super(User);
  }

  async createInitialSuperAdmin(
    userData: RegisterInput
  ): Promise<UserDocument | null> {
    const session = await this.model.db.startSession();

    try {
      let createdUser: UserDocument | null = null;

      await session.withTransaction(async () => {
        const totalUsers = await this.model.countDocuments({}, { session });
        if (totalUsers > 0) {
          return;
        }

        const bootstrapLockCollection = this.model.db.collection<{
          _id: string;
          claimed: boolean;
          createdAt: Date;
        }>('bootstrap_locks');

        const lockResult = await bootstrapLockCollection.findOneAndUpdate(
          { _id: 'super_admin_bootstrap', claimed: { $ne: true } },
          {
            $setOnInsert: {
              _id: 'super_admin_bootstrap',
              claimed: true,
              createdAt: new Date(),
            },
          },
          {
            upsert: true,
            returnDocument: 'before',
            session,
          }
        );

        if (lockResult) {
          return;
        }

        const data: RegisterInput = { ...userData };

        if (!data.role) {
          data.role = APPLICATION_ROLES.SUPER_ADMIN;
        }

        if (!data.permissions) {
          data.permissions = getDefaultPermissionsForRole(
            data.role ?? APPLICATION_ROLES.SUPER_ADMIN
          );
        }

        const sanitizedData = { ...data };
        if (sanitizedData.clientId === undefined) {
          delete sanitizedData.clientId;
        }

        const createdDocs = await this.model.create([sanitizedData as never], {
          session,
        });
        createdUser = createdDocs[0] as UserDocument;
      });

      return createdUser;
    } catch (error) {
      logger.error({ err: error }, 'Error creating initial super admin');
      throw error;
    } finally {
      await session.endSession();
    }
  }

  override async create(userData: RegisterInput): Promise<UserDocument> {
    const data: RegisterInput = { ...userData };

    if (!data.permissions) {
      data.permissions = getDefaultPermissionsForRole(
        data.role ?? APPLICATION_ROLES.CLIENT_VIEWER
      );
    }

    return super.create(data);
  }

  override async findById(userId: string): Promise<UserDocument | null> {
    return super.findById(userId);
  }

  override async findByUsername(
    username: string
  ): Promise<UserDocument | null> {
    return this.model.findOne({ username });
  }

  override async findByEmail(email: string): Promise<UserDocument | null> {
    return this.model.findOne({ email });
  }

  override async findAll(): Promise<UserDocument[]> {
    return this.model.find({ isActive: true }).select('-password');
  }
}

const authRepository = new MongoUserRepository();

export { MongoUserRepository };
export default authRepository;
