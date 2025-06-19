import fs from 'fs';
import path from 'path';
import PouchDB from 'pouchdb';
import PouchdbAdapterLeveldb from 'pouchdb-adapter-leveldb';
import PouchDBFind from 'pouchdb-find';
import { config } from '../config/config.js';
import { v4 as uuidv4 } from 'uuid';
// Asegurarse de que el directorio de la base de datos exista
if (!fs.existsSync(config.dbPath)) {
    fs.mkdirSync(config.dbPath, { recursive: true });
}
// Configurar PouchDB con adaptadores y plugins
PouchDB.plugin(PouchdbAdapterLeveldb);
PouchDB.plugin(PouchDBFind);
// Definir las colecciones/bases de datos
const collections = {
    products: new PouchDB(path.join(config.dbPath, 'products'), { adapter: 'leveldb' })
};
// Configuración de la base de datos
export async function setupDatabase() {
    console.log(`Inicializando base de datos en: ${config.dbPath}`);
    try {
        // Crear índices para optimizar consultas
        await collections.products.createIndex({
            index: { fields: ['name', 'category', 'updatedAt'] }
        });
        console.log('Bases de datos e índices creados exitosamente');
        return collections;
    }
    catch (error) {
        console.error('Error al inicializar la base de datos:', error);
        throw error;
    }
}
// Funciones auxiliares para trabajar con las colecciones
export const dbHelpers = {
    // Productos
    products: {
        // Obtener todos los productos
        async getAll() {
            const result = await collections.products.allDocs({
                include_docs: true
            });
            return result.rows.map(row => row.doc);
        },
        // Obtener un producto por ID
        async getById(id) {
            try {
                return await collections.products.get(id);
            }
            catch (error) {
                const err = error;
                if (err.name === 'not_found') {
                    return null;
                }
                throw error;
            }
        },
        // Crear un nuevo producto
        async create(productData) {
            const now = Date.now();
            const newProduct = {
                _id: uuidv4(),
                ...productData,
                createdAt: now,
                updatedAt: now
            };
            const response = await collections.products.put(newProduct);
            return { ...newProduct, _rev: response.rev };
        },
        // Actualizar un producto existente
        async update(id, productData) {
            try {
                const product = await collections.products.get(id);
                const updatedProduct = {
                    ...product,
                    ...productData,
                    updatedAt: Date.now()
                };
                const response = await collections.products.put(updatedProduct);
                return { ...updatedProduct, _rev: response.rev };
            }
            catch (error) {
                const err = error;
                if (err.name === 'not_found') {
                    throw new Error('Producto no encontrado');
                }
                throw error;
            }
        },
        // Eliminar un producto
        async delete(id) {
            try {
                const product = await collections.products.get(id);
                if (product._rev) {
                    await collections.products.remove(product);
                    return { id, success: true };
                }
                else {
                    throw new Error('Producto no tiene revisión');
                }
            }
            catch (error) {
                const err = error;
                if (err.name === 'not_found') {
                    throw new Error('Producto no encontrado');
                }
                throw error;
            }
        },
        // Buscar productos por nombre o categoría
        async search(query) {
            // Obtenemos todos los productos y filtramos manualmente
            const allProducts = await this.getAll();
            const regex = new RegExp(query, 'i');
            return allProducts.filter(product => regex.test(product.name) ||
                (product.category && regex.test(product.category)));
        }
    }
};
