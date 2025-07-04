import type { DailyCashClosure } from "@/shared/types/DailyCashClosure";
import type { ItemsResponse } from "@/shared/types/UtilTypes";
import { initDatabase } from "../database";

export interface IDailyCashClosureRepository {
  create(data: Omit<DailyCashClosure, "id">): Promise<DailyCashClosure>;
  findById(id: string): Promise<DailyCashClosure | null>;
  findByDate(date: string): Promise<DailyCashClosure[]>;
  findAll(): Promise<DailyCashClosure[]>;
  findAllPaginated(
    page: number,
    size: number,
    searchQuery?: string
  ): Promise<ItemsResponse<DailyCashClosure>>;
  update(
    id: string,
    updateData: Partial<DailyCashClosure>
  ): Promise<DailyCashClosure | null>;
  delete(id: string): Promise<boolean>;
  softDelete(id: string, deletedBy: string): Promise<boolean>;
  restore(id: string): Promise<boolean>;
}

export class LocalDailyCashClosureRepository
  implements IDailyCashClosureRepository
{
  async create(data: Omit<DailyCashClosure, "id">): Promise<DailyCashClosure> {
    const db = await initDatabase();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const inserted = await db.daily_cash_closures.insert({
      id,
      ...data,
      createdAt: now,
      updatedAt: now,
      sincronized: false,
      isDeleted: false,
    });

    return JSON.parse(JSON.stringify(inserted.toJSON())) as DailyCashClosure;
  }

  async findById(id: string): Promise<DailyCashClosure | null> {
    const db = await initDatabase();
    const item = await db.daily_cash_closures.findOne(id).exec();
    return item
      ? (JSON.parse(JSON.stringify(item.toJSON())) as DailyCashClosure)
      : null;
  }

  async findByDate(date: string): Promise<DailyCashClosure[]> {
    const db = await initDatabase();
    const items = await db.daily_cash_closures
      .find()
      .where("date")
      .eq(date)
      .exec();
    return items.map((i) => i.toJSON());
  }

  async findAll(): Promise<DailyCashClosure[]> {
    const db = await initDatabase();
    const all = await db.daily_cash_closures.find().exec();
    return all.map((i) => i.toJSON());
  }

  async findAllPaginated(
    page: number,
    size: number,
    searchQuery?: string
  ): Promise<ItemsResponse<DailyCashClosure>> {
    const db = await initDatabase();

    let query = db.daily_cash_closures
      .find()
      .where("isDeleted")
      .eq(false)
      .sort({ date: "desc" });

    if (searchQuery) {
      // Opcional: filtrar por notas, userId, etc
      // query = query.where("notes").regex(new RegExp(searchQuery, "i"));
    }

    const skip = (page - 1) * size;

    const totalItems = await db.daily_cash_closures
      .find()
      .where("isDeleted")
      .eq(false)
      .exec();

    const items = await query.skip(skip).limit(size).exec();

    const total = totalItems.length;
    const totalPages = Math.ceil(total / size);

    return {
      items: items.map((i) => i.toJSON()),
      page,
      size,
      totalItems: total,
      totalPages,
    };
  }

  async update(
    id: string,
    updateData: Partial<DailyCashClosure>
  ): Promise<DailyCashClosure | null> {
    const db = await initDatabase();
    const doc = await db.daily_cash_closures.findOne(id).exec();
    if (!doc) return null;

    await doc.update({
      $set: { ...updateData, updatedAt: new Date().toISOString() },
    });
    return JSON.parse(JSON.stringify(doc.toJSON())) as DailyCashClosure;
  }

  async delete(id: string): Promise<boolean> {
    const db = await initDatabase();
    const doc = await db.daily_cash_closures.findOne(id).exec();
    if (!doc) return false;
    await doc.remove();
    return true;
  }

  async softDelete(id: string, deletedBy: string): Promise<boolean> {
    const db = await initDatabase();
    const doc = await db.daily_cash_closures.findOne(id).exec();
    if (!doc) return false;

    await doc.update({
      $set: { isDeleted: true, deletedBy, updatedAt: new Date().toISOString() },
    });
    return true;
  }

  async restore(id: string): Promise<boolean> {
    const db = await initDatabase();
    const doc = await db.daily_cash_closures.findOne(id).exec();
    if (!doc) return false;

    await doc.update({
      $set: { isDeleted: false, updatedAt: new Date().toISOString() },
    });
    return true;
  }
}

export const localRepository = new LocalDailyCashClosureRepository();

export const getDailyCashClosureRepository = () => localRepository;
