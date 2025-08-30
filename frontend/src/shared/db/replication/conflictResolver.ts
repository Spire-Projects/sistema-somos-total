/**
 * Utilidades para prevenir bucles infinitos en la resolución de conflictos
 */

// Cache para rastrear documentos que están siendo procesados
const processingDocuments = new Set<string>();
const lastUpdateTimes = new Map<string, number>();

/**
 * Verifica si un documento está siendo procesado actualmente
 */
export const isDocumentBeingProcessed = (documentId: string): boolean => {
  return processingDocuments.has(documentId);
};

/**
 * Marca un documento como en proceso
 */
export const markDocumentAsProcessing = (documentId: string): void => {
  processingDocuments.add(documentId);
  // Auto-limpiar después de 30 segundos para evitar memory leaks
  setTimeout(() => {
    processingDocuments.delete(documentId);
  }, 30000);
};

/**
 * Desmarca un documento como en proceso
 */
export const unmarkDocumentAsProcessing = (documentId: string): void => {
  processingDocuments.delete(documentId);
};

/**
 * Verifica si un documento fue actualizado recientemente (cooldown de 2 segundos)
 */
export const wasRecentlyUpdated = (documentId: string): boolean => {
  const lastUpdate = lastUpdateTimes.get(documentId);
  if (!lastUpdate) return false;
  
  const cooldownPeriod = 2000; // 2 segundos (reducido desde 5)
  return Date.now() - lastUpdate < cooldownPeriod;
};

/**
 * Registra que un documento fue actualizado
 */
export const recordDocumentUpdate = (documentId: string): void => {
  lastUpdateTimes.set(documentId, Date.now());
  
  // Limpiar entradas antigas para evitar memory leaks
  setTimeout(() => {
    lastUpdateTimes.delete(documentId);
  }, 60000); // Limpiar después de 1 minuto
};

/**
 * Compara dos documentos para ver si son funcionalmente idénticos
 * (ignorando campos de metadata y timestamps)
 */
export const areDocumentsFunctionallyEqual = (doc1: any, doc2: any): boolean => {
  // Campos a ignorar en la comparación
  const fieldsToIgnore = [
    '_rev',
    '_deleted', 
    '_meta',
    '_lastSyncedAt',
    '_serverUpdatedAt',
    '_forceLocalPriority',
    'updatedAt',
    '_lastModifiedAt',
    'createdAt'
  ];
  
  // Crear copias limpias para comparación
  const clean1 = { ...doc1 };
  const clean2 = { ...doc2 };
  
  fieldsToIgnore.forEach(field => {
    delete clean1[field];
    delete clean2[field];
  });
  
  // Comparar como JSON para una comparación profunda
  const json1 = JSON.stringify(clean1, Object.keys(clean1).sort());
  const json2 = JSON.stringify(clean2, Object.keys(clean2).sort());
  
  return json1 === json2;
};

/**
 * Limpia todas las caches (útil para testing)
 */
export const clearConflictResolverCache = (): void => {
  processingDocuments.clear();
  lastUpdateTimes.clear();
};
