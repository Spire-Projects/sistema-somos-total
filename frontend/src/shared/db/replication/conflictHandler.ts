import { 
  areDocumentsFunctionallyEqual, 
  isDocumentBeingProcessed, 
  markDocumentAsProcessing, 
  unmarkDocumentAsProcessing,
  wasRecentlyUpdated 
} from './conflictResolver';

/**
 * Conflict Handler personalizado que prioriza cambios locales más recientes
 * Basado en el campo _lastModifiedAt o updatedAt
 * Incluye prevención de bucles infinitos y manejo robusto de conflictos
 */

export const createLocalPriorityConflictHandler = <T extends { [key: string]: any }>() => {
  return async (input: { 
    realMasterState: T; 
    newDocumentState: T 
  }) => {
    const { realMasterState: remoteDoc, newDocumentState: localDoc } = input;
    const documentId = (localDoc as any).id || (remoteDoc as any).id;
    
    console.log(`🔄 ConflictHandler: Evaluando conflicto para documento ${documentId}`);
    
    // Obtener timestamps ANTES de verificar si está en proceso
    const localTime = new Date((localDoc as any)._lastModifiedAt || (localDoc as any).updatedAt || '1970-01-01');
    const remoteTime = new Date((remoteDoc as any)._lastModifiedAt || (remoteDoc as any).updatedAt || '1970-01-01');
    const hasLocalPriority = (localDoc as any)._forceLocalPriority === true;
    
    console.log(`📊 ConflictHandler: Timestamps - Local: ${localTime.toISOString()}, Remoto: ${remoteTime.toISOString()}, ForceLocal: ${hasLocalPriority}`);
    
    // Verificar si hay cambios funcionales reales ANTES de aplicar bloqueos
    const functionallyEqual = areDocumentsFunctionallyEqual(localDoc, remoteDoc);
    
    if (functionallyEqual) {
      console.log(`✅ ConflictHandler: Documentos funcionalmente idénticos ${documentId}, sin conflicto real`);
      return {
        isEqual: true,
        documentData: remoteDoc
      };
    }
    
    // Solo aplicar bloqueo si hay cambios funcionales reales
    console.log(`🔄 ConflictHandler: Conflicto real detectado para documento ${documentId}`);
    
    // Prevenir bucles: si el documento está siendo procesado Y es el mismo timestamp, esperar
    if (isDocumentBeingProcessed(documentId)) {
      console.log(`⏸️ ConflictHandler: Documento ${documentId} ya está siendo procesado`);
      
      // Si es el mismo timestamp exacto, probablemente es el mismo update, usar remoto
      if (localTime.getTime() === remoteTime.getTime()) {
        console.log(`⏸️ ConflictHandler: Mismo timestamp exacto, usando versión remota para evitar loop`);
        return {
          isEqual: true,
          documentData: remoteDoc
        };
      }
      
      // Si el remoto es más nuevo, aplicar cambios a pesar del procesamiento
      if (remoteTime > localTime) {
        console.log(`✅ ConflictHandler: Documento remoto es más nuevo, aplicando cambios a pesar del procesamiento`);
        return {
          isEqual: false,
          documentData: remoteDoc
        };
      } else {
        console.log(`⏸️ ConflictHandler: Manteniendo versión local a pesar del procesamiento`);
        return {
          isEqual: true,
          documentData: localDoc
        };
      }
    }
    
    // Marcar como en proceso solo si vamos a hacer cambios
    markDocumentAsProcessing(documentId);
    
    try {
      // Verificar si hay marca de prioridad local forzada
      if (hasLocalPriority) {
        console.log(`✅ ConflictHandler: Documento local ${documentId} tiene prioridad forzada`);
        
        // Limpiar flag de prioridad forzada para evitar bucles futuros
        const cleanLocalDoc = { ...localDoc };
        delete cleanLocalDoc._forceLocalPriority;
        
        return {
          isEqual: false,
          documentData: cleanLocalDoc
        };
      }
      
      // Solo prevenir updates muy frecuentes si no hay cambios importantes de timestamp
      if (wasRecentlyUpdated(documentId) && Math.abs(remoteTime.getTime() - localTime.getTime()) < 1000) {
        console.log(`⏰ ConflictHandler: Documento ${documentId} actualizado recientemente con timestamps similares, manteniendo versión local`);
        return {
          isEqual: false,
          documentData: localDoc
        };
      }
      
      // Decisión basada en timestamp (Last Write Wins)
      if (remoteTime > localTime) {
        console.log(`⚠️ ConflictHandler: Documento remoto ${documentId} es más reciente, aceptando cambios remotos`);
        return {
          isEqual: false,
          documentData: remoteDoc
        };
      } else if (localTime > remoteTime) {
        console.log(`✅ ConflictHandler: Documento local ${documentId} es más reciente, manteniendo cambios locales`);
        return {
          isEqual: false,
          documentData: localDoc
        };
      } else {
        // Timestamps iguales, preferir remoto para consistencia
        console.log(`⚖️ ConflictHandler: Timestamps iguales, prefiriendo versión remota para consistencia`);
        return {
          isEqual: false,
          documentData: remoteDoc
        };
      }
    } finally {
      // Desmarcar con delay corto para permitir updates legítimos más rápidos
      setTimeout(() => unmarkDocumentAsProcessing(documentId), 100);
    }
  };
};
