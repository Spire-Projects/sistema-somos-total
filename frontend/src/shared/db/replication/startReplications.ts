import { getDatabase, type DatabaseCollections } from "../database";
import { checkPendingSync, debugReplications } from "./debugReplications";
import { replicateCollection } from "./replicateCollection";

export const startAllReplications = (collections: DatabaseCollections) => {
  console.log("🔄 Iniciando todas las replicaciones...");

  // Replicar todas las colecciones

  replicateCollection("number_invoice_ranges-st", collections.number_invoice_ranges);
  replicateCollection("users-st", collections.users);
  replicateCollection("clients-st", collections.clients);
  replicateCollection("categories-st", collections.categories);
  replicateCollection("daily_cash_closures-st", collections.daily_cash_closures);
  replicateCollection("sales-st", collections.sales);
  replicateCollection("purchases-st", collections.purchases);
  replicateCollection("nits-st", collections.nits);
  replicateCollection("products-st", collections.products);

  replicateCollection("manufacturers-st", collections.manufacturers);
  replicateCollection("currency-st", collections.currency);

  console.log("✅ Todas las replicaciones iniciadas");
};

export const startDebugReplication = async () => {
  const db =  getDatabase();
  await debugReplications(db?.collections!);
  await checkPendingSync(db?.collections!);
}
// Exportar utilidades de debug
export { debugReplications, checkPendingSync } from "./debugReplications";

