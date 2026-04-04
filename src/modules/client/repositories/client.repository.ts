import logger from '@config/logger.js';
import {
  Client,
  type IClient,
  type ClientDocument,
} from '@modules/clients/models/index.js';

import BaseClientRepository from './baseClientRepository.js';

type ClientCreateInput = {
  name: string;
  slug: string;
  email: string;
  description?: string;
  website?: string;
  createdBy: unknown;
  isActive?: boolean;
  settings?: {
    dataRetentionDays: number;
    alertsEnabled: boolean;
    timezone: string;
  };
};

class MongoClientRepository extends BaseClientRepository<
  IClient,
  ClientCreateInput
> {
  constructor() {
    super(Client);
  }

  override async create(
    clientData: ClientCreateInput
  ): Promise<ClientDocument> {
    try {
      const client = await super.create(clientData);

      logger.info(
        { mongoId: client._id.toString(), slug: client.slug },
        'Client created in MongoDB'
      );

      return client;
    } catch (error) {
      logger.error({ err: error }, 'Error creating client in db');
      throw error;
    }
  }

  override async findById(clientId: string): Promise<ClientDocument | null> {
    try {
      return await super.findById(clientId);
    } catch (error) {
      logger.error({ err: error }, 'Error finding client in db by id');
      throw error;
    }
  }

  override async findBySlug(slug: string): Promise<ClientDocument | null> {
    try {
      return this.model.findOne({ slug });
    } catch (error) {
      logger.error({ err: error }, 'Error finding client by slug');
      throw error;
    }
  }

  override async find(
    filters: Record<string, unknown> = {},
    options: {
      limit?: number;
      skip?: number;
      sort?: Record<string, 1 | -1>;
    } = {}
  ): Promise<ClientDocument[]> {
    try {
      return await super.find(filters, options);
    } catch (error) {
      logger.error({ err: error }, 'Error finding clients');
      throw error;
    }
  }

  override async count(filters: Record<string, unknown> = {}): Promise<number> {
    try {
      return await super.count(filters);
    } catch (error) {
      logger.error({ err: error }, 'Error counting clients');
      throw error;
    }
  }
}

const clientRepository = new MongoClientRepository();

export type { ClientCreateInput };
export { MongoClientRepository };
export default clientRepository;
