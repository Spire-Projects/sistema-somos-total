import { 
  areDocumentsFunctionallyEqual, 
  isDocumentBeingProcessed, 
  markDocumentAsProcessing, 
  unmarkDocumentAsProcessing,
  wasRecentlyUpdated 
} from './conflictResolver';

/**
 * Conflict handler personalizado que prioriza cambios locales más recientes
 * Basado en el campo _lastModifiedAt o updatedAt
 */
export const createLocalPriorityConflictHandler = <T extends { [key: string]: any }>() => {
  return async (input: { realMasterState: T; newDocumentState: T }) => {
    const { realMasterState: remoteDoc, newDocumentState: localDoc } = input;
    const documentId = (localDoc as any).id || (remoteDoc as any).id;
    
    console.log(`🔄 ConflictHandler: Evaluando conflicto para documento ${documentId}`);
    console.log(`🔄 ConflictHandler: Documento LOCAL completo:`, localDoc);
    console.log(`🔄 ConflictHandler: Documento REMOTO completo:`, remoteDoc);
    
    // Obtener timestamps ANTES de verificar si está en proceso
    const localTime = new Date((localDoc as any)._lastModifiedAt || (localDoc as any).updatedAt || '1970-01-01');
    const remoteTime = new Date((remoteDoc as any)._lastModifiedAt || (remoteDoc as any).updatedAt || '1970-01-01');
    const hasLocalPriority = (localDoc as any)._forceLocalPriority === true;
    
    // Verificar si hay cambios funcionales reales ANTES de aplicar bloqueos
    const functionallyEqual = areDocumentsFunctionallyEqual(localDoc, remoteDoc);
    
    if (functionallyEqual) {
      console.log(`✅ ConflictHandler: Documentos funcionalmente idénticos ${documentId}, sin conflicto`);
      console.log(`✅ ConflictHandler: RESULTADO - Usando documento remoto (sin cambios reales)`);
      return {
        isEqual: true,
        documentData: remoteDoc
      };
    }
    
    // Solo aplicar bloqueo si hay cambios funcionales reales
    console.log(`🔄 ConflictHandler: Conflicto real detectado para documento ${documentId}:`, {
      local: (localDoc as any)._lastModifiedAt || (localDoc as any).updatedAt,
      remote: (remoteDoc as any)._lastModifiedAt || (remoteDoc as any).updatedAt,
      hasLocalPriority: hasLocalPriority,
      localTime: localTime.toISOString(),
      remoteTime: remoteTime.toISOString()
    });
    
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
        // NO marcar como procesando para permitir que el update continue
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
      
      // Decisión basada en timestamp
      if (remoteTime > localTime) {
        console.log(`⚠️ ConflictHandler: Documento remoto ${documentId} es más reciente, aceptando cambios remotos`);
        console.log(`⚠️ ConflictHandler: RESULTADO - Usando documento REMOTO:`, remoteDoc);
        return {
          isEqual: false,
          documentData: remoteDoc
        };
      } else if (localTime > remoteTime) {
        console.log(`✅ ConflictHandler: Documento local ${documentId} es más reciente, manteniendo cambios locales`);
        console.log(`✅ ConflictHandler: RESULTADO - Usando documento LOCAL:`, localDoc);
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
      // Desmarcar con delay más corto para permitir updates legítimos más rápidos
      setTimeout(() => unmarkDocumentAsProcessing(documentId), 100);
    }
  };
};
