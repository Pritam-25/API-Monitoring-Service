import type { HydratedDocument, Model } from 'mongoose';

export default abstract class BaseRepository<
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

  async findAll(): Promise<HydratedDocument<TDoc>[]> {
    return this.model.find();
  }

  abstract findByUsername(
    username: string
  ): Promise<HydratedDocument<TDoc> | null>;

  abstract findByEmail(email: string): Promise<HydratedDocument<TDoc> | null>;
}
