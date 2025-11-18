import type { DatabaseCollections } from "../database";

/**
 * Utilidad para debuggear el estado de las replicaciones
 * Ejecuta en consola: debugReplications()
 */
export const debugReplications = async (collections: DatabaseCollections) => {
  console.log("🔍 Iniciando debug de replicaciones...\n");

  const collectionNames = [
    "users",
    "clients", 
    "categories",
    "daily_cash_closures",
    "sales",
    "products",
    "purchases",
    "nits",
    "number_invoice_ranges",
    "manufacturers",
    "currency"
  ] as const;

  for (const name of collectionNames) {
    try {
      const collection = collections[name as keyof DatabaseCollections];
      const docs = await collection.find().exec();
      
      console.log(`✅ ${name}:`, {
        documentos: docs.length,
        muestra: docs.slice(0, 2).map(d => ({ 
          id: d.id, 
          sincronized: (d as any).sincronized,
          updatedAt: (d as any).updatedAt 
        }))
      });
    } catch (error) {
      console.error(`❌ ${name}:`, error);
    }
  }

  console.log("\n✅ Debug completado");
};

/**
 * Verifica si una colección tiene documentos pendientes de sincronizar
 */
export const checkPendingSync = async (collections: DatabaseCollections) => {
  console.log("🔍 Verificando documentos pendientes de sincronización...\n");

  const collectionNames = Object.keys(collections) as (keyof DatabaseCollections)[];
  
  for (const name of collectionNames) {
    try {
      const collection = collections[name];
      const pending = await collection.find({
        selector: { sincronized: { $eq: false } }
      }).exec();
      
      if (pending.length > 0) {
        console.warn(`⚠️ ${name}: ${pending.length} documentos pendientes`);
      } else {
        console.log(`✅ ${name}: Todos sincronizados`);
      }
    } catch (error) {
      console.error(`❌ Error en ${name}:`, error);
    }
  }

  console.log("\n✅ Verificación completada");
};
