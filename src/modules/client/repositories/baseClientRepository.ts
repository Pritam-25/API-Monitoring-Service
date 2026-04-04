import type { HydratedDocument, Model } from 'mongoose';

export default abstract class BaseClientRepository<
  TDoc,
  TCreate extends Record<string, unknown>,
> {
  protected readonly model: Model<TDoc>;

  constructor(model: Model<TDoc>) {
    this.model = model;
  }

  async create(data: TCreate): Promise<HydratedDocument<TDoc>> {
    const doc = new this.model(data);
    await doc.save();
    return doc;
  }

  async findById(id: string): Promise<HydratedDocument<TDoc> | null> {
    return this.model.findById(id);
  }

  async find(
    filters: Record<string, unknown> = {},
    options: {
      limit?: number;
      skip?: number;
      sort?: Record<string, 1 | -1>;
    } = {}
  ): Promise<HydratedDocument<TDoc>[]> {
    const { limit = 50, skip = 0, sort = { createdAt: -1 } } = options;

    return this.model
      .find(filters as never)
      .sort(sort)
      .skip(skip)
      .limit(limit);
  }

  async count(filters: Record<string, unknown> = {}): Promise<number> {
    return this.model.countDocuments(filters as never);
  }

  abstract findBySlug(slug: string): Promise<HydratedDocument<TDoc> | null>;
}
