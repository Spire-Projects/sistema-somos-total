import fs from 'fs';
import path from 'path';
import PouchDB from 'pouchdb';
import PouchdbAdapterLeveldb from 'pouchdb-adapter-leveldb';
import PouchDBFind from 'pouchdb-find';
import { config } from '../config/config.js';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../models/user.model.js';

// Definir interfaces para tipar los datos
interface Product {
  _id: string;
  _rev?: string;
  name: string;
  description?: string;
  price: number;
  stock?: number;
  category?: string;
  createdAt: number;
  updatedAt: number;
}

interface UserDoc extends User {
  _id: string;
  _rev?: string;
}

interface PouchError {
  name: string;
  status?: number;
  message?: string;
}

// Asegurarse de que el directorio de la base de datos exista
if (!fs.existsSync(config.dbPath)) {
  fs.mkdirSync(config.dbPath, { recursive: true });
}

// Configurar PouchDB con adaptadores y plugins
PouchDB.plugin(PouchdbAdapterLeveldb);
PouchDB.plugin(PouchDBFind);

// Definir las colecciones/bases de datos
const collections = {
  products: new PouchDB(path.join(config.dbPath, 'products'), { adapter: 'leveldb' }),
  users: new PouchDB(path.join(config.dbPath, 'users'), { adapter: 'leveldb' })
};

// Configuración de la base de datos
export async function setupDatabase() {
  console.log(`Inicializando base de datos en: ${config.dbPath}`);
  
  try {
    // Crear índices para optimizar consultas
    await collections.products.createIndex({
      index: { fields: ['name', 'category', 'updatedAt'] }
    });
    
    await collections.users.createIndex({
      index: { fields: ['email', 'role', 'active'] }
    });
    
    console.log('Bases de datos e índices creados exitosamente');
    
    return collections;
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
    throw error;
  }
}

// Funciones auxiliares para trabajar con las colecciones
export const dbHelpers = {
  // Productos
  products: {
    // Obtener todos los productos
    async getAll(): Promise<Product[]> {
      const result = await collections.products.allDocs({
        include_docs: true
      });
      return result.rows.map(row => row.doc as Product);
    },
    
    // Obtener un producto por ID
    async getById(id: string): Promise<Product | null> {
      try {
        return await collections.products.get(id) as Product;
      } catch (error) {
        const err = error as PouchError;
        if (err.name === 'not_found') {
          return null;
        }
        throw error;
      }
    },
    
    // Crear un nuevo producto
    async create(productData: Omit<Product, '_id' | '_rev' | 'createdAt' | 'updatedAt'>): Promise<Product> {
      const now = Date.now();
      const newProduct: Product = {
        _id: uuidv4(),
        ...productData,
        createdAt: now,
        updatedAt: now
      };
      
      const response = await collections.products.put(newProduct);
      return { ...newProduct, _rev: response.rev };
    },
    
    // Actualizar un producto existente
    async update(id: string, productData: Partial<Omit<Product, '_id' | '_rev' | 'createdAt' | 'updatedAt'>>): Promise<Product> {
      try {
        const product = await collections.products.get(id) as Product;
        const updatedProduct: Product = {
          ...product,
          ...productData,
          updatedAt: Date.now()
        };
        
        const response = await collections.products.put(updatedProduct);
        return { ...updatedProduct, _rev: response.rev };
      } catch (error) {
        const err = error as PouchError;
        if (err.name === 'not_found') {
          throw new Error('Producto no encontrado');
        }
        throw error;
      }
    },
    
    // Eliminar un producto
    async delete(id: string): Promise<{ id: string, success: boolean }> {
      try {
        const product = await collections.products.get(id) as Product & PouchDB.Core.IdMeta & PouchDB.Core.GetMeta;
        if (product._rev) {
          await collections.products.remove(product);
          return { id, success: true };
        } else {
          throw new Error('Producto no tiene revisión');
        }
      } catch (error) {
        const err = error as PouchError;
        if (err.name === 'not_found') {
          throw new Error('Producto no encontrado');
        }
        throw error;
      }
    },
    
    // Buscar productos por nombre o categoría
    async search(query: string): Promise<Product[]> {
      // Obtenemos todos los productos y filtramos manualmente
      const allProducts = await this.getAll();
      const regex = new RegExp(query, 'i');
      
      return allProducts.filter(product => 
        regex.test(product.name) || 
        (product.category && regex.test(product.category))
      );
    }
  },

  // Usuarios
  users: {
    // Obtener todos los usuarios
    async getAll(): Promise<User[]> {
      const result = await collections.users.allDocs({
        include_docs: true
      });
      return result.rows.map(row => {
        const doc = row.doc as UserDoc;
        const { _id, _rev, ...user } = doc;
        return user;
      });
    },

    // Obtener usuarios con paginación
    async getAllPaginated(page: number = 1, size: number = 10): Promise<{ users: User[], total: number, totalPages: number, page: number, size: number }> {
      const allUsers = await this.getAll();
      const total = allUsers.length;
      const totalPages = Math.ceil(total / size);
      const offset = (page - 1) * size;
      const users = allUsers.slice(offset, offset + size);

      return {
        users,
        total,
        totalPages,
        page,
        size
      };
    },

    // Obtener un usuario por ID
    async getById(id: string): Promise<User | null> {
      try {
        const doc = await collections.users.get(id) as UserDoc;
        const { _id, _rev, ...user } = doc;
        return user;
      } catch (error) {
        const err = error as PouchError;
        if (err.name === 'not_found') {
          return null;
        }
        throw error;
      }
    },

    // Obtener un usuario por email
    async getByEmail(email: string): Promise<User | null> {
      try {
        const result = await collections.users.find({
          selector: { email: email }
        });
        
        if (result.docs.length > 0) {
          const doc = result.docs[0] as UserDoc;
          const { _id, _rev, ...user } = doc;
          return user;
        }
        return null;
      } catch (error) {
        console.error('Error al buscar usuario por email:', error);
        return null;
      }
    },

    // Crear un nuevo usuario
    async create(userData: User): Promise<User> {
      const userDoc: UserDoc = {
        _id: userData.id,
        ...userData
      };
      
      const response = await collections.users.put(userDoc);
      return userData;
    },

    // Actualizar un usuario existente
    async update(id: string, userData: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User> {
      try {
        const userDoc = await collections.users.get(id) as UserDoc;
        const updatedUserDoc: UserDoc = {
          ...userDoc,
          ...userData
        };
        
        const response = await collections.users.put(updatedUserDoc);
        const { _id, _rev, ...user } = updatedUserDoc;
        return user;
      } catch (error) {
        const err = error as PouchError;
        if (err.name === 'not_found') {
          throw new Error('Usuario no encontrado');
        }
        throw error;
      }
    },

    // Eliminar un usuario (desactivar)
    async delete(id: string): Promise<{ id: string, success: boolean }> {
      try {
        const userDoc = await collections.users.get(id) as UserDoc & PouchDB.Core.IdMeta & PouchDB.Core.GetMeta;
        if (userDoc._rev) {
          await collections.users.remove(userDoc);
          return { id, success: true };
        } else {
          throw new Error('Usuario no tiene revisión');
        }
      } catch (error) {
        const err = error as PouchError;
        if (err.name === 'not_found') {
          throw new Error('Usuario no encontrado');
        }
        throw error;
      }
    }
  }
};
