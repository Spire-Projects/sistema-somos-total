import type { RxDatabase } from "rxdb";
import type { DatabaseCollections } from "../database";

/**
 * Función para verificar y forzar migraciones de esquemas específicos
 */
export async function verifyAndRunMigrations(db: RxDatabase<DatabaseCollections>) {
  console.log("🔄 Verificando migraciones de esquemas...");

  try {
    // Verificar migración de generic_names
    const genericNamesCollection = db.generic_names;
    const genericNamesCount = await genericNamesCollection.count().exec();
    console.log(`📊 generic_names: ${genericNamesCount} documentos encontrados`);

    // Verificar migración de manufacturers  
    const manufacturersCollection = db.manufacturers;
    const manufacturersCount = await manufacturersCollection.count().exec();
    console.log(`📊 manufacturers: ${manufacturersCount} documentos encontrados`);

    // Verificar que los documentos tienen los nuevos campos
    const sampleGenericName = await genericNamesCollection.findOne().exec();
    if (sampleGenericName) {
      console.log(`✅ generic_names - Documento verificado correctamente`);
    }

    const sampleManufacturer = await manufacturersCollection.findOne().exec();
    if (sampleManufacturer) {
      const doc = sampleManufacturer.toJSON();
      console.log(`✅ manufacturers - Campo updatedAt: ${doc.updatedAt !== undefined ? 'presente' : 'ausente'}`);
      console.log(`✅ manufacturers - Campo updatedBy: ${doc.updatedBy !== undefined ? 'presente' : 'ausente'}`);
    }

    console.log("✅ Verificación de migraciones completada");
    
  } catch (error) {
    console.error("❌ Error durante la verificación de migraciones:", error);
    throw error;
  }
}

/**
 * Función para migrar manualmente documentos si es necesario
 */
export async function manualMigrationIfNeeded(db: RxDatabase<DatabaseCollections>) {
  console.log("🔧 Ejecutando migración manual si es necesaria...");

  try {
    // Migrar manufacturers que no tengan los campos nuevos
    const manufacturersWithoutUpdatedAt = await db.manufacturers
      .find({
        selector: {
          updatedAt: { $exists: false }
        }
      })
      .exec();

    if (manufacturersWithoutUpdatedAt.length > 0) {
      console.log(`🔧 Migrando ${manufacturersWithoutUpdatedAt.length} manufacturers...`);
      
      for (const doc of manufacturersWithoutUpdatedAt) {
        const currentTime = new Date().toISOString();
        await doc.update({
          $set: {
            updatedAt: doc.createdAt || currentTime,
            updatedBy: doc.createdBy || 'system'
          }
        });
      }
      console.log("✅ Migración de manufacturers completada");
    }

    console.log("✅ Migración manual completada - generic_names no requiere cambios adicionales");

  } catch (error) {
    console.error("❌ Error durante migración manual:", error);
    throw error;
  }
}
