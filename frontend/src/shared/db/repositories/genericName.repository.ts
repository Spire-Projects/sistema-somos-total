import type { GenericNameDoc } from "@/shared/types/Medication";
import type { ItemsResponse } from "../../types/UtilTypes";
import { initDatabase } from "../database";
import { config } from "@/shared/config/config";

export interface IGenericNameDocRepository {
  create(data: Omit<GenericNameDoc, "id">): Promise<GenericNameDoc>;
  findByName(name: string): Promise<GenericNameDoc | null>;
  findById(id: string): Promise<GenericNameDoc | null>;
  findAll(): Promise<GenericNameDoc[]>;
  findAllPaginated(
    page: number,
    size: number,
    searchQuery?: string
  ): Promise<ItemsResponse<GenericNameDoc>>;
  update(
    id: string,
    updateData: Partial<GenericNameDoc>
  ): Promise<GenericNameDoc | null>;
  delete(id: string): Promise<boolean>;
  search(searchText: string): Promise<GenericNameDoc[]>;
}

export class LocalGenericNameDocRepository
  implements IGenericNameDocRepository
{
  async create(data: Omit<GenericNameDoc, "id">): Promise<GenericNameDoc> {
    const db = await initDatabase();
    const id = crypto.randomUUID();
    const item = await db.generic_names.insert({ id, ...data });
    return item.toJSON() as GenericNameDoc;
  }

  async findByName(name: string): Promise<GenericNameDoc | null> {
    const db = await initDatabase();
    const item = await db.generic_names.findOne({ selector: { name } }).exec();
    return item ? (item.toJSON() as GenericNameDoc) : null;
  }

  async findById(id: string): Promise<GenericNameDoc | null> {
    const db = await initDatabase();
    const item = await db.generic_names.findOne(id).exec();
    return item ? (item.toJSON() as GenericNameDoc) : null;
  }

  async findAll(): Promise<GenericNameDoc[]> {
    const db = await initDatabase();
    const items = await db.generic_names.find().exec();
    return items.map((i) => i.toJSON() as GenericNameDoc);
  }

  async findAllPaginated(
    page: number,
    size: number,
    searchQuery?: string
  ): Promise<ItemsResponse<GenericNameDoc>> {
    const db = await initDatabase();

    let query;
    if (searchQuery?.trim()) {
      const normalized = searchQuery.trim().toLowerCase();
      query = db.generic_names.find({
        selector: {
          $or: [
            { name: { $regex: normalized, $options: "i" } },
            { description: { $regex: normalized, $options: "i" } },
          ],
        },
      });
    } else {
      query = db.generic_names.find();
    }

    const allItems = await query.exec();
    const totalItems = allItems.length;
    const totalPages = Math.ceil(totalItems / size);
    const skip = (page - 1) * size;
    const paginated = allItems
      .slice(skip, skip + size)
      .map((i) => i.toJSON() as GenericNameDoc);

    return {
      items: paginated,
      page,
      size,
      totalItems,
      totalPages,
    };
  }

  async update(
    id: string,
    updateData: Partial<GenericNameDoc>
  ): Promise<GenericNameDoc | null> {
    const db = await initDatabase();
    const item = await db.generic_names.findOne(id).exec();
    if (!item) return null;
    await item.update({ $set: updateData });
    return item.toJSON() as GenericNameDoc;
  }

  async delete(id: string): Promise<boolean> {
    const db = await initDatabase();
    const item = await db.generic_names.findOne(id).exec();
    if (!item) return false;
    await item.remove();
    return true;
  }

  async search(searchText: string): Promise<GenericNameDoc[]> {
    if (!searchText?.trim()) return this.findAll();

    const db = await initDatabase();
    const normalized = searchText.trim().toLowerCase();
    const allItems = await db.generic_names.find().exec();
    const filtered = allItems.filter((i) => {
      const doc = i.toJSON();
      return (
        doc.name.toLowerCase().includes(normalized) ||
        (doc.description && doc.description.toLowerCase().includes(normalized))
      );
    });
    return filtered.map((i) => i.toJSON() as GenericNameDoc);
  }
}

export class FirestoreGenericNameDocRepository
  implements IGenericNameDocRepository
{
  async create(_data: Omit<GenericNameDoc, "id">): Promise<GenericNameDoc> {
    throw new Error("Firestore implementation not yet available");
  }
  async findByName(_name: string): Promise<GenericNameDoc | null> {
    throw new Error("Firestore implementation not yet available");
  }
  async findById(_id: string): Promise<GenericNameDoc | null> {
    throw new Error("Firestore implementation not yet available");
  }
  async findAll(): Promise<GenericNameDoc[]> {
    throw new Error("Firestore implementation not yet available");
  }
  async findAllPaginated(
    _page: number,
    _size: number,
    _searchQuery?: string
  ): Promise<ItemsResponse<GenericNameDoc>> {
    throw new Error("Firestore implementation not yet available");
  }
  async update(
    _id: string,
    _updateData: Partial<GenericNameDoc>
  ): Promise<GenericNameDoc | null> {
    throw new Error("Firestore implementation not yet available");
  }
  async delete(_id: string): Promise<boolean> {
    throw new Error("Firestore implementation not yet available");
  }
  async search(_searchText: string): Promise<GenericNameDoc[]> {
    throw new Error("Firestore implementation not yet available");
  }
}

export const localGenericNameDocRepository =
  new LocalGenericNameDocRepository();
export const firestoreGenericNameDocRepository =
  new FirestoreGenericNameDocRepository();

export const getGenericNameDocRepository = (): IGenericNameDocRepository => {
  return config.APP_MODE === "local"
    ? localGenericNameDocRepository
    : firestoreGenericNameDocRepository;
};
