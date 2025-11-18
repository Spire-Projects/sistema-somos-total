/**
 * Conflict Handler optimizado para RxDB + Firestore
 * 
 * Estrategia: Last Write Wins (LWW) basado en updatedAt
 * - Más simple y predecible
 * - Sin necesidad de bloqueos manuales
 * - Sin flags temporales
 * - Previene bucles infinitos naturalmente
 */

export const createConflictHandler = <T extends { [key: string]: any }>() => {
  return async (input: { 
    realMasterState: T; 
    newDocumentState: T 
  }) => {
    const { realMasterState: remoteDoc, newDocumentState: localDoc } = input;
    
    // Obtener timestamps para comparación
    const localTime = new Date(
      (localDoc as any).updatedAt || 
      (localDoc as any).createdAt || 
      '1970-01-01'
    ).getTime();
    
    const remoteTime = new Date(
      (remoteDoc as any).updatedAt || 
      (remoteDoc as any).createdAt || 
      '1970-01-01'
    ).getTime();
    
    // Last Write Wins: el documento con timestamp más reciente gana
    if (remoteTime > localTime) {
      // Remoto es más nuevo, aceptar cambios
      return {
        isEqual: false,
        documentData: remoteDoc
      };
    } else if (localTime > remoteTime) {
      // Local es más nuevo, mantener local
      return {
        isEqual: false,
        documentData: localDoc
      };
    } else {
      // Timestamps iguales: usar _rev para desempate (RxDB ya lo maneja)
      // Preferir remoto para evitar bucles
      return {
        isEqual: false,
        documentData: remoteDoc
      };
    }
  };
};
