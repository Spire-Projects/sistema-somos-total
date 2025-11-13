import { createRxDatabase, addRxPlugin } from "rxdb";
import type { RxDatabase, RxCollection } from "rxdb";
import { RxDBQueryBuilderPlugin } from "rxdb/plugins/query-builder";
import { RxDBMigrationSchemaPlugin } from "rxdb/plugins/migration-schema";
import { RxDBUpdatePlugin } from "rxdb/plugins/update";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
import { userSchema } from "./models/user.model";
import type { UserDocument } from "./models/user.model";
import { clientSchema } from "./models/client.model";
import type { Client } from "../types/Client";
import { config } from "../config/config";
import { dailyCashClosureSchema } from "./models/dailyCashClosure.model";
import type { DailyCashClosure } from "../types/DailyCashClosure";
import { nitSchema } from "./models/nit.model";
import type { NIT } from "../types/Nit";
import {
  numberInvoiceRangeSchema,
  type NumberInvoiceRangeDocument
} from "./models/numberInvoiceRange.model";
import type { PurchaseBox} from "../types/modelTypes/PurchaseBox";
import type { Product } from "../types/modelTypes/Product";
import type { Category } from "../types/modelTypes/Category";

import { salesMigrationStrategies, salesSchema } from "./models/sale.model";
import { productSchema } from "./models/coreModels/product.model";
import { purchaseBoxSchema } from "./models/coreModels/purchase.model";
import { categorySchema } from "./models/coreModels/category.model";
import { manufacturerSchema } from "./models/manufacturer.model";
import type { Manufacturer } from "../types/modelTypes/Manufacturer";
import type { Sale } from "../types/modelTypes/Sale";
import { currencySchema } from "./models/currency.model";
import type { Currency } from "../types/modelTypes/Currency";


const setupRxDBPlugins = async () => {

  addRxPlugin(RxDBQueryBuilderPlugin);
  addRxPlugin(RxDBUpdatePlugin);
  addRxPlugin(RxDBMigrationSchemaPlugin);
  const { RxDBDevModePlugin, disableWarnings } = await import(
    "rxdb/plugins/dev-mode"
  );
  addRxPlugin(RxDBDevModePlugin);
  disableWarnings();
};

// Tipos para las colecciones
export interface DatabaseCollections {
  users: RxCollection<UserDocument>;
  clients: RxCollection<Client>;
  daily_cash_closures: RxCollection<DailyCashClosure>;
  sales: RxCollection<Sale>;
  nits: RxCollection<NIT>;
  number_invoice_ranges: RxCollection<NumberInvoiceRangeDocument>;
  purchases: RxCollection<PurchaseBox>;
  products: RxCollection<Product>;
  categories: RxCollection<Category>;
  manufacturers: RxCollection<Manufacturer>;
  currency: RxCollection<Currency>;
}

let dbInstance: RxDatabase<DatabaseCollections> | null = null;
let dbPromise: Promise<RxDatabase<DatabaseCollections>> | null = null;


export async function initDatabase(): Promise<RxDatabase<DatabaseCollections>> {
  if (dbInstance) {
    return dbInstance;
  }

  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = (async () => {
    try {
     
      await setupRxDBPlugins();
      const db = await createRxDatabase<DatabaseCollections>({
        name: config.DB.NAME,
        storage: getRxStorageDexie(),
        ignoreDuplicate: true,
      });

      console.log("Base de datos creada, agregando colecciones...");

      await db.addCollections({
        users: {
          schema: userSchema,
          autoMigrate: true,
        },
        clients: {
          schema: clientSchema,
          autoMigrate: true,
        },
        categories: {
          schema: categorySchema,
          autoMigrate: true,
        },
        daily_cash_closures: {
          schema: dailyCashClosureSchema,
          autoMigrate: true,
        },
        sales: {
          schema: salesSchema,
          migrationStrategies: salesMigrationStrategies,
        },
        products: {
          schema: productSchema,
          autoMigrate: true,
        },
        purchases: {
          schema: purchaseBoxSchema,
          autoMigrate: true,
        },   
        nits: {
          schema: nitSchema,
          autoMigrate: true,
        },
        number_invoice_ranges: {
          schema: numberInvoiceRangeSchema,
          autoMigrate: true,
        },
        manufacturers: {
          schema: manufacturerSchema,
          autoMigrate: true,
        },
        currency: {
          schema: currencySchema,
          autoMigrate: true,
        },
      });

      dbInstance = db;
      console.log("✅ Base de datos RxDB inicializada correctamente");

      return db;
    } catch (error) {
      console.error("❌ Error inicializando base de datos:", error);
      dbPromise = null; // Reset para permitir reintento
      throw error;
    }
  })();

  return dbPromise;
}

// Obtener la instancia de la base de datos
export function getDatabase(): RxDatabase<DatabaseCollections> | null {
  return dbInstance;
}

// Cerrar la base de datos
export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.destroy();
    dbInstance = null;
    dbPromise = null;
    console.log("Base de datos cerrada");
  }
}

export async function initDatabaseAndModels(): Promise<
  RxDatabase<DatabaseCollections>
> {
  return await initDatabase();
}
