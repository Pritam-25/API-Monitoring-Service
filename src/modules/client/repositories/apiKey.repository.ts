import logger from '@config/logger.js';
import {
  ApiKey,
  type IApiKey,
  type ApiKeyDocument,
} from '@modules/clients/models/index.js';

import BaseApiKeyRepository from './baseApiKeyRepository.js';

type ApiKeyCreateInput = {
  keyId: string;
  keyValue: string;
  clientId: unknown;
  name: string;
  description?: string;
  environment?: IApiKey['environment'];
  isActive?: boolean;
  permissions: IApiKey['permissions'];
  security: IApiKey['security'];
  expiresAt: Date;
  metadata: IApiKey['metadata'];
  createdBy: unknown;
};

class MongoApiKeyRepository extends BaseApiKeyRepository<
  IApiKey,
  ApiKeyCreateInput
> {
  constructor() {
    super(ApiKey as never);
  }

  async create(apiKeyData: ApiKeyCreateInput): Promise<ApiKeyDocument> {
    try {
      const apiKey = (await super.create(apiKeyData)) as ApiKeyDocument;
      logger.info({ keyId: apiKey.keyId }, 'API key created in database');
      return apiKey;
    } catch (error) {
      logger.error({ err: error }, 'Error creating API key in database');
      throw error;
    }
  }

  async findByKeyValue(
    keyValue: string,
    includeInactive = false
  ): Promise<ApiKeyDocument | null> {
    try {
      const filter: Record<string, unknown> = { keyValue };

      if (!includeInactive) {
        filter.isActive = true;
      }

      return this.model
        .findOne(filter)
        .populate('clientId') as unknown as ApiKeyDocument | null;
    } catch (error) {
      logger.error({ err: error }, 'Error finding API key by value');
      throw error;
    }
  }

  async findByClientId(
    clientId: string,
    filters: Record<string, unknown> = {}
  ): Promise<ApiKeyDocument[]> {
    try {
      const query: Record<string, unknown> = { clientId, ...filters };

      return (await this.model
        .find(query)
        .populate('createdBy', 'username email')
        .sort({ createdAt: -1 })) as unknown as ApiKeyDocument[];
    } catch (error) {
      logger.error({ err: error }, 'Error finding API keys by client ID');
      throw error;
    }
  }

  async countByClientId(
    clientId: string,
    filters: Record<string, unknown> = {}
  ): Promise<number> {
    try {
      const query: Record<string, unknown> = { clientId, ...filters };
      return this.model.countDocuments(query);
    } catch (error) {
      logger.error({ err: error }, 'Error counting API keys');
      throw error;
    }
  }
}

const apiKeyRepository = new MongoApiKeyRepository();

export type { ApiKeyCreateInput };
export { MongoApiKeyRepository };
export default apiKeyRepository;
