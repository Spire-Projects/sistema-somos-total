import { getDatabase, type DatabaseCollections } from "../database";
import { checkPendingSync, debugReplications } from "./debugReplications";
import { replicateCollection } from "./replicateCollection";

export const startAllReplications = (collections: DatabaseCollections) => {
  console.log("🔄 Iniciando todas las replicaciones...");

  // Replicar todas las colecciones

  replicateCollection("number_invoice_ranges", collections.number_invoice_ranges);
  replicateCollection("users", collections.users);
  replicateCollection("clients", collections.clients);
  replicateCollection("categories", collections.categories);
  replicateCollection("daily_cash_closures", collections.daily_cash_closures);
  replicateCollection("sales", collections.sales);
  replicateCollection("purchases", collections.purchases);
  replicateCollection("nits", collections.nits);
    replicateCollection("products", collections.products);

  replicateCollection("manufacturers", collections.manufacturers);
  replicateCollection("currency", collections.currency);

  console.log("✅ Todas las replicaciones iniciadas");
};

export const startDebugReplication = async () => {
  const db =  getDatabase();
  await debugReplications(db?.collections!);
  await checkPendingSync(db?.collections!);
}
// Exportar utilidades de debug
export { debugReplications, checkPendingSync } from "./debugReplications";
