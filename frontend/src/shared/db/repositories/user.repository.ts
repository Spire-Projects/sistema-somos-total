import type { UserDocument } from '../models/user.model';
import { initDatabase } from '../database';
import { config } from '@/shared/config/config';
import { BaseRepository } from './BaseRepository';
import type { RxCollection } from 'rxdb';

export interface IUserRepository {
  create(userData: Omit<UserDocument, 'id'>): Promise<UserDocument>;
  findByEmail(email: string): Promise<UserDocument | null>;
  findById(id: string): Promise<UserDocument | null>;
  findAll(): Promise<UserDocument[]>;
  update(id: string, updateData: Partial<UserDocument>): Promise<UserDocument | null>;
  delete(id: string): Promise<boolean>;
  findByRole(role: string): Promise<UserDocument[]>;
  findByText(searchText: string): Promise<UserDocument[]>;
  getStats(): Promise<{
    total: number;
    active: number;
    byRole: Record<string, number>;
  }>;
}

export class LocalUserRepository extends BaseRepository<UserDocument> implements IUserRepository {
  
  protected async getCollection(): Promise<RxCollection<UserDocument>> {
    const db = await initDatabase();
    return db.users;
  }

  async create(userData: Omit<UserDocument, 'id'>): Promise<UserDocument> {
    const id = crypto.randomUUID();
    const fullData = { id, ...userData } as UserDocument;
    console.log(`🔄 UserRepository: Creando usuario con prioridad`, { id });
    return await this.createWithPriority(fullData);
  }

  async update(id: string, updateData: Partial<UserDocument>): Promise<UserDocument | null> {
    console.log(`🔄 UserRepository: Actualizando usuario ${id} con prioridad`, updateData);
    try {
      return await this.updateWithPriority(id, updateData);
    } catch (error) {
      console.error(`❌ Error al actualizar usuario ${id}:`, error);
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    console.log(`🗑️ UserRepository: Eliminando usuario ${id} con prioridad`);
    return await this.deleteWithPriority(id);
  }

  async findById(id: string): Promise<UserDocument | null> {
    return await super.findById(id);
  }

  async findAll(): Promise<UserDocument[]> {
    return await super.findAll();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    const db = await initDatabase();
    const user = await db.users.findOne({ selector: { email } }).exec();
    return user ? user.toJSON() : null;
  }

  // Métodos originales comentados para evitar conflictos con BaseRepository
  /*
  async findByEmail(email: string): Promise<UserDocument | null> {
    const db = await initDatabase();
    const user = await db.users.findOne({ selector: { email } }).exec();
    return user ? user.toJSON() : null;
  }

  async findAll(): Promise<UserDocument[]> {
    const db = await initDatabase();
    const users = await db.users.find().exec();
    return users.map((user) => user.toJSON());
  }

  async update(id: string, updateData: Partial<UserDocument>): Promise<UserDocument | null> {
    const db = await initDatabase();
    const user = await db.users.findOne(id).exec();
    if (!user) return null;
    await user.update({ $set: updateData });
    return user.toJSON();
  }

  async delete(id: string): Promise<boolean> {
    const db = await initDatabase();
    const user = await db.users.findOne(id).exec();
    if (!user) return false;
    await user.remove();
    return true;
  }
  */

  async findByRole(role: string): Promise<UserDocument[]> {
    const db = await initDatabase();
    const users = await db.users.find({ selector: { role: role as any } }).exec();
    return users.map((user) => user.toJSON());
  }

  async findByText(searchText: string): Promise<UserDocument[]> {
    if (!searchText || searchText.trim() === "") {
      return this.findAll();
    }
    const db = await initDatabase();
    const normalizedText = searchText.trim().toLowerCase();
    const allUsers = await db.users.find().exec();
    const filteredUsers = allUsers.filter((user) => {
      const userJson = user.toJSON();
      return (
        userJson.email.toLowerCase().includes(normalizedText) ||
        userJson.fullName.toLowerCase().includes(normalizedText) ||
        userJson.role.toLowerCase().includes(normalizedText)
      );
    });
    return filteredUsers.map((user) => user.toJSON());
  }

  async getStats(): Promise<{ total: number; active: number; byRole: Record<string, number> }> {
    const db = await initDatabase();
    const allUsers = await db.users.find().exec();
    const users = allUsers.map((u) => u.toJSON());
    const stats = {
      total: users.length,
      active: users.filter((u) => u.active).length,
      byRole: users.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
    return stats;
  }
}

export class FirestoreUserRepository implements IUserRepository {
  async create(_userData: Omit<UserDocument, 'id'>): Promise<UserDocument> {
    throw new Error('Firestore implementation not yet available');
  }
  async findByEmail(_email: string): Promise<UserDocument | null> {
    throw new Error('Firestore implementation not yet available');
  }
  async findById(_id: string): Promise<UserDocument | null> {
    throw new Error('Firestore implementation not yet available');
  }
  async findAll(): Promise<UserDocument[]> {
    throw new Error('Firestore implementation not yet available');
  }
  async update(_id: string, _updateData: Partial<UserDocument>): Promise<UserDocument | null> {
    throw new Error('Firestore implementation not yet available');
  }
  async delete(_id: string): Promise<boolean> {
    throw new Error('Firestore implementation not yet available');
  }
  async findByRole(_role: string): Promise<UserDocument[]> {
    throw new Error('Firestore implementation not yet available');
  }
  async findByText(_searchText: string): Promise<UserDocument[]> {
    throw new Error('Firestore implementation not yet available');
  }
  async getStats(): Promise<{ total: number; active: number; byRole: Record<string, number> }> {
    throw new Error('Firestore implementation not yet available');
  }
}

export const localUserRepository = new LocalUserRepository();
export const firestoreUserRepository = new FirestoreUserRepository();

export const getUserRepository = (): IUserRepository => {
  return config.APP_MODE === 'local' ? localUserRepository : firestoreUserRepository;
};
