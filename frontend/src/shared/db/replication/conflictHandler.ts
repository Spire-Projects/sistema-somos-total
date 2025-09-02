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
    
    // Prevenir bucles: si el documento está siendo procesado activamente, esperar
    if (isDocumentBeingProcessed(documentId)) {
      console.log(`⏸️ ConflictHandler: Documento ${documentId} ya está siendo procesado, usando versión remota`);
      return {
        isEqual: true,
        documentData: remoteDoc
      };
    }
    
    // Marcar como en proceso
    markDocumentAsProcessing(documentId);
    
    try {
      // Comparar si los documentos son funcionalmente idénticos
      if (areDocumentsFunctionallyEqual(localDoc, remoteDoc)) {
        console.log(`✅ ConflictHandler: Documentos funcionalmente idénticos ${documentId}, sin conflicto`);
        console.log(`✅ ConflictHandler: RESULTADO - Usando documento remoto (sin cambios reales)`);
        return {
          isEqual: true,
          documentData: remoteDoc
        };
      }
      
      console.log(`🔄 ConflictHandler: Conflicto real detectado para documento ${documentId}:`, {
        local: (localDoc as any)._lastModifiedAt || (localDoc as any).updatedAt,
        remote: (remoteDoc as any)._lastModifiedAt || (remoteDoc as any).updatedAt,
        hasLocalPriority: (localDoc as any)._forceLocalPriority
      });
      
      // Obtener timestamps para comparación
      const localTime = new Date((localDoc as any)._lastModifiedAt || (localDoc as any).updatedAt || '1970-01-01');
      const remoteTime = new Date((remoteDoc as any)._lastModifiedAt || (remoteDoc as any).updatedAt || '1970-01-01');
      
      // Verificar si hay marca de prioridad local forzada
      const hasLocalPriority = (localDoc as any)._forceLocalPriority === true;
      
      // Si no hay prioridad local forzada y el documento remoto es más reciente, aceptarlo
      if (!hasLocalPriority) {
        if (remoteTime >= localTime) {
          console.log(`⚠️ ConflictHandler: Documento remoto ${documentId} es más reciente o igual, aceptando cambios remotos`);
          console.log(`⚠️ ConflictHandler: RESULTADO - Usando documento REMOTO:`, remoteDoc);
          return {
            isEqual: false,
            documentData: remoteDoc
          };
        } else {
          console.log(`✅ ConflictHandler: Documento local ${documentId} es más reciente, manteniendo cambios locales`);
          console.log(`✅ ConflictHandler: RESULTADO - Usando documento LOCAL:`, localDoc);
          return {
            isEqual: false,
            documentData: localDoc
          };
        }
      }
      
      // Solo prevenir updates muy frecuentes si hay prioridad forzada
      if (hasLocalPriority && wasRecentlyUpdated(documentId)) {
        console.log(`⏰ ConflictHandler: Documento ${documentId} con prioridad forzada actualizado recientemente, manteniendo versión local`);
        
        // Limpiar flag de prioridad forzada para el siguiente ciclo
        const cleanLocalDoc = { ...localDoc };
        delete cleanLocalDoc._forceLocalPriority;
        
        return {
          isEqual: false,
          documentData: cleanLocalDoc
        };
      }
      
      // Si hay prioridad local forzada, usarla
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
      
      // Fallback: usar timestamp
      if (localTime > remoteTime) {
        console.log(`✅ ConflictHandler: Documento local ${documentId} tiene timestamp más reciente`);
        console.log(`✅ ConflictHandler: RESULTADO FINAL - Usando documento LOCAL:`, localDoc);
        return {
          isEqual: false,
          documentData: localDoc
        };
      } else {
        console.log(`⚠️ ConflictHandler: Documento remoto ${documentId} tiene timestamp más reciente o igual`);
        console.log(`⚠️ ConflictHandler: RESULTADO FINAL - Usando documento REMOTO:`, remoteDoc);
        return {
          isEqual: false,
          documentData: remoteDoc
        };
      }
    } finally {
      // Siempre desmarcar al final (con delay menor para permitir updates legítimos)
      setTimeout(() => unmarkDocumentAsProcessing(documentId), 500);
    }
  };
};
