import mongoose, {
  type HydratedDocument,
  type Model,
  type Types,
} from 'mongoose';

export interface IClientSettings {
  dataRetentionDays: number;
  alertsEnabled: boolean;
  timezone: string;
}

export interface IClient {
  name: string;
  slug: string;
  email: string;
  description: string;
  website: string;
  createdBy: Types.ObjectId;
  isActive: boolean;
  settings: IClientSettings;
  createdAt: Date;
  updatedAt: Date;
}

type ClientModel = Model<IClient>;

const clientSchema = new mongoose.Schema<IClient, ClientModel>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: /^[a-z0-9-]+$/,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      maxlength: 500,
      default: '',
    },
    website: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    settings: {
      dataRetentionDays: {
        type: Number,
        default: 30,
        min: 7,
        max: 365,
      },
      alertsEnabled: {
        type: Boolean,
        default: true,
      },
      timezone: {
        type: String,
        default: 'UTC',
      },
    },
  },
  {
    timestamps: true,
    collection: 'clients',
  }
);

clientSchema.index({ isActive: 1 });

const Client: ClientModel =
  (mongoose.models.Client as ClientModel | undefined) ??
  mongoose.model<IClient, ClientModel>('Client', clientSchema);

export type ClientDocument = HydratedDocument<IClient>;

export default Client;
