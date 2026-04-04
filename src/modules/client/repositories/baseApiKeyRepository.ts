import type { Model } from 'mongoose';

export default abstract class BaseApiKeyRepository<
  TDoc,
  TCreate extends Record<string, unknown>,
> {
  protected readonly model: Model<TDoc>;

  constructor(model: Model<TDoc>) {
    this.model = model;
  }

  async create(data: TCreate): Promise<unknown> {
    const doc = new this.model(data);
    await doc.save();
    return doc;
  }

  async findById(id: string): Promise<unknown | null> {
    return this.model.findById(id);
  }

  async count(filters: Record<string, unknown> = {}): Promise<number> {
    return this.model.countDocuments(filters as never);
  }

  abstract findByKeyValue(
    keyValue: string,
    includeInactive?: boolean
  ): Promise<unknown | null>;

  abstract findByClientId(
    clientId: string,
    filters?: Record<string, unknown>
  ): Promise<unknown[]>;

  abstract countByClientId(
    clientId: string,
    filters?: Record<string, unknown>
  ): Promise<number>;
}
