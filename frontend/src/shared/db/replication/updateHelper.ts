import { recordDocumentUpdate } from './conflictResolver';

/**
 * Función helper para actualizar documentos locales y asegurar que tengan prioridad
 * en la sincronización con Firestore
 */
/**
 * Actualiza un documento con prioridad local usando timestamp futuro
 */
export const updateDocumentWithPriority = async <T extends { [key: string]: any }>(
  doc: T,
  updateData: Partial<T>
): Promise<T> => {
  const documentId = (doc as any).id;
  const now = new Date();
  // Usar solo 2 segundos en el futuro para minimizar conflictos
  const futureTime = new Date(now.getTime() + 2 * 1000);
  
  console.log(`🔄 UpdateHelper: Preparando actualización con prioridad para documento ${documentId}`);
  
  const updatedDoc = {
    ...doc,
    ...updateData,
    updatedAt: futureTime.toISOString(),
    _lastModifiedAt: futureTime.toISOString(),
    _forceLocalPriority: true, // Marca temporal para el conflict handler
  };
  
  console.log(`📋 UpdateHelper: Datos preparados`, {
    id: documentId,
    updatedAt: updatedDoc.updatedAt,
    _lastModifiedAt: updatedDoc._lastModifiedAt,
    _forceLocalPriority: updatedDoc._forceLocalPriority
  });
  
  // Registrar la actualización para el sistema de cooldown
  recordDocumentUpdate(documentId);
  
  return updatedDoc;
};

/**
 * Función helper para crear documentos con timestamps correctos
 */
export const createDocumentWithTimestamps = <T extends { [key: string]: any }>(
  data: T
): T & { updatedAt: string; _lastModifiedAt: string; createdAt: string } => {
  const now = new Date().toISOString();
  
  return {
    ...data,
    createdAt: data.createdAt || now,
    updatedAt: now,
    _lastModifiedAt: now
  };
};
