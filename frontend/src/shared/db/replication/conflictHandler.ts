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
      
      // Solo prevenir updates muy frecuentes si NO hay prioridad forzada
      if (!hasLocalPriority && wasRecentlyUpdated(documentId)) {
        console.log(`⏰ ConflictHandler: Documento ${documentId} actualizado recientemente sin prioridad forzada, usando versión remota`);
        return {
          isEqual: false,
          documentData: remoteDoc
        };
      }
      
      // Priorizar documento con timestamp más reciente o con marca de prioridad local
      if (hasLocalPriority || localTime > remoteTime) {
        console.log(`✅ ConflictHandler: Documento local ${documentId} tiene prioridad (${hasLocalPriority ? 'forzado' : localTime.toISOString()} > ${remoteTime.toISOString()})`);
        
        // Limpiar flag de prioridad forzada para evitar bucles futuros
        const cleanLocalDoc = { ...localDoc };
        delete cleanLocalDoc._forceLocalPriority;
        
        return {
          isEqual: false,
          documentData: cleanLocalDoc
        };
      } else {
        console.log(`⚠️ ConflictHandler: Documento remoto ${documentId} tiene prioridad (${remoteTime.toISOString()} >= ${localTime.toISOString()})`);
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
