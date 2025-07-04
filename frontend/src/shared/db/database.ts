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
import { activeIngredientSchema } from "./models/activeIngredient.model";
import { medicationCategorySchema } from "./models/medicationCategory.model";
import { pharmaceuticalFormSchema } from "./models/pharmaceuticalForm.model";
import { manufacturerSchema } from "./models/manufacturer.model";
import { medicationSchema } from "./models/medication.model";
import { medicationBatchSchema } from "./models/medicationBatch.model";
import type {
  ActiveIngredient,
  MedicationCategory,
  PharmaceuticalFormDoc,
  Manufacturer,
  Medication,
  MedicationBatch,
} from "../types/Medication";
import { config } from "../config/config";

// Configurar plugins según entorno
const setupRxDBPlugins = async () => {
  // Plugins básicos siempre necesarios
  addRxPlugin(RxDBQueryBuilderPlugin);
  addRxPlugin(RxDBUpdatePlugin);
  addRxPlugin(RxDBMigrationSchemaPlugin);

  if (import.meta.env.DEV) {
    // Solo en desarrollo: cargar dev-mode para debugging
    const { RxDBDevModePlugin, disableWarnings } = await import(
      "rxdb/plugins/dev-mode"
    );
    addRxPlugin(RxDBDevModePlugin);

    // Deshabilitar solo las advertencias molestas, mantener validaciones
    disableWarnings();

    console.log("🛠️ RxDB Dev-Mode activado para desarrollo");
  } else {
    console.log("🚀 RxDB en modo producción - máximo performance");
  }
};

// Tipos para las colecciones
export interface DatabaseCollections {
  users: RxCollection<UserDocument>;
  clients: RxCollection<Client>;
  active_ingredients: RxCollection<ActiveIngredient>;
  medication_categories: RxCollection<MedicationCategory>;
  pharmaceutical_forms: RxCollection<PharmaceuticalFormDoc>;
  manufacturers: RxCollection<Manufacturer>;
  medications: RxCollection<Medication>;
  medication_batches: RxCollection<MedicationBatch>;
}

let dbInstance: RxDatabase<DatabaseCollections> | null = null;
let dbPromise: Promise<RxDatabase<DatabaseCollections>> | null = null;

// Inicializar la base de datos RxDB
export async function initDatabase(): Promise<RxDatabase<DatabaseCollections>> {
  if (dbInstance) {
    return dbInstance;
  }

  // Si ya hay una inicialización en progreso, esperar a que termine
  if (dbPromise) {
    return dbPromise;
  }

  // Si ya hay una inicialización en progreso, esperar a que termine
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = (async () => {
    try {
      console.log("🔄 Configurando RxDB...");

      // Configurar plugins antes de crear la DB
      await setupRxDBPlugins();

      console.log("📱 Inicializando base de datos RxDB con IndexedDB...");

      // Crear la base de datos
      const db = await createRxDatabase<DatabaseCollections>({
        name: config.DB.NAME,
        storage: getRxStorageDexie(),
        ignoreDuplicate: true,
      });

      console.log("Base de datos creada, agregando colecciones...");

      // Agregar todas las colecciones
      await db.addCollections({
        users: {
          schema: userSchema,
        },
        clients: {
          schema: clientSchema,
        },
        active_ingredients: {
          schema: activeIngredientSchema,
        },
        medication_categories: {
          schema: medicationCategorySchema,
        },
        pharmaceutical_forms: {
          schema: pharmaceuticalFormSchema,
        },
        manufacturers: {
          schema: manufacturerSchema,
        },
        medications: {
          schema: medicationSchema,
        },
        medication_batches: {
          schema: medicationBatchSchema,
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

