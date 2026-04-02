import bcrypt from 'bcryptjs';
import mongoose, {
  type HydratedDocument,
  type Model,
  type Types,
} from 'mongoose';

export type UserRole = 'super_admin' | 'client_admin' | 'client_viewer';

export interface IUserPermissions {
  canCreateApiKeys: boolean;
  canManageUsers: boolean;
  canViewAnalytics: boolean;
  canExportData: boolean;
}

export interface IUser {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  clientId?: Types.ObjectId;
  isActive: boolean;
  permissions: IUserPermissions;
  createdAt: Date;
  updatedAt: Date;
}

type UserModel = Model<IUser>;

const userSchema = new mongoose.Schema<IUser, UserModel>(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['super_admin', 'client_admin', 'client_viewer'],
      default: 'client_viewer',
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
    },
    isActive: { type: Boolean, default: true },
    permissions: {
      canCreateApiKeys: { type: Boolean, default: false },
      canManageUsers: { type: Boolean, default: false },
      canViewAnalytics: { type: Boolean, default: true },
      canExportData: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User: UserModel =
  (mongoose.models.User as UserModel | undefined) ??
  mongoose.model<IUser, UserModel>('User', userSchema);

export type UserDocument = HydratedDocument<IUser>;

export default User;
