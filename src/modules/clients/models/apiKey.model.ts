import mongoose, {
  type HydratedDocument,
  type Model,
  type Types,
} from 'mongoose';

export type ApiKeyEnvironment =
  | 'production'
  | 'staging'
  | 'development'
  | 'testing';

export interface IApiKeyPermissions {
  canIngest: boolean;
  canReadAnalytics: boolean;
  allowedServices: string[];
}

export interface IApiKeySecurity {
  allowedIPs: string[];
  allowedOrigins: string[];
  lastRotated: Date;
  rotationWarningDays: number;
}

export interface IApiKeyMetadata {
  createdBy?: Types.ObjectId;
  purpose?: string;
  tags: string[];
}

export interface IApiKey {
  keyId: string;
  keyValue: string;
  clientId: Types.ObjectId;
  name: string;
  description: string;
  environment: ApiKeyEnvironment;
  isActive: boolean;
  permissions: IApiKeyPermissions;
  security: IApiKeySecurity;
  expiresAt: Date;
  metadata: IApiKeyMetadata;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiKeyMethods {
  isExpired(): boolean;
}

type ApiKeyModel = Model<IApiKey, object, ApiKeyMethods>;

const apiKeySchema = new mongoose.Schema<IApiKey, ApiKeyModel, ApiKeyMethods>(
  {
    keyId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    keyValue: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      maxlength: 500,
      default: '',
    },
    environment: {
      type: String,
      enum: ['production', 'staging', 'development', 'testing'],
      default: 'production',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    permissions: {
      canIngest: {
        type: Boolean,
        default: true,
      },
      canReadAnalytics: {
        type: Boolean,
        default: false,
      },
      allowedServices: [
        {
          type: String,
          trim: true,
        },
      ],
    },
    security: {
      allowedIPs: [
        {
          type: String,
          validate: {
            validator: (value: string) =>
              /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/.test(value) ||
              value === '0.0.0.0/0',
            message: 'Invalid IP address format',
          },
        },
      ],
      allowedOrigins: [
        {
          type: String,
          validate: {
            validator: (value: string) =>
              /^https?:\/\/[^\s]+$/.test(value) || value === '*',
            message: 'Invalid origin format',
          },
        },
      ],
      lastRotated: {
        type: Date,
        default: Date.now,
      },
      rotationWarningDays: {
        type: Number,
        default: 30,
      },
    },
    expiresAt: {
      type: Date,
      default: () => {
        const expiryDaysRaw = Number.parseInt(
          process.env.API_KEY_EXPIRY_DAYS ?? '365',
          10
        );
        const expiryDays = Number.isNaN(expiryDaysRaw) ? 365 : expiryDaysRaw;
        return new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);
      },
    },
    metadata: {
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      purpose: {
        type: String,
        trim: true,
        maxlength: 200,
      },
      tags: [
        {
          type: String,
          trim: true,
          maxlength: 50,
        },
      ],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'api_keys',
  }
);

apiKeySchema.index({ clientId: 1, isActive: 1 });
apiKeySchema.index({ keyValue: 1, isActive: 1 });
apiKeySchema.index({ environment: 1, clientId: 1 });
apiKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

apiKeySchema.methods.isExpired = function isExpired() {
  if (!this.expiresAt) {
    return false;
  }

  return this.expiresAt.getTime() < Date.now();
};

const ApiKey: ApiKeyModel =
  (mongoose.models.ApiKey as ApiKeyModel | undefined) ??
  mongoose.model<IApiKey, ApiKeyModel>('ApiKey', apiKeySchema);

export type ApiKeyDocument = HydratedDocument<IApiKey, ApiKeyMethods>;

export default ApiKey;
