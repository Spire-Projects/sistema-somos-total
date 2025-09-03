/**
 * Ejemplo de uso del servicio y repositorio de NIT
 * 
 * Este archivo muestra cómo utilizar las funciones del servicio NIT
 * siguiendo los mismos patrones que se usan en el resto de la aplicación.
 */

import {
  createNit,
  getAllNits,
  getAllNitsPaginated,
  getNitById,
  getNitByNumber,
  getNitBySocialReason,
  updateNit,
  deleteNit,
  softDeleteNit,
  restoreNit,
  getNitStatistics,
  getActiveNits,
  getDeletedNits,
  searchNits,
  formatNitInfo,
  validateNitNumber,
  validateSocialReason
} from '@/shared/services/NitService';

/**
 * Ejemplo de creación de un NIT
 */
async function ejemploCrearNit() {
  try {
    const nuevoNit = await createNit({
      numberNit: "123456789-0",
      socialReason: "Empresa de Ejemplo S.A."
    });
    
    console.log('NIT creado:', nuevoNit);
  } catch (error) {
    console.error('Error al crear NIT:', error);
  }
}

/**
 * Ejemplo de búsqueda de NITs
 */
async function ejemploBuscarNits() {
  try {
    // Buscar todos los NITs
    const todosLosNits = await getAllNits();
    console.log('Todos los NITs:', todosLosNits);

    // Buscar NITs con paginación
    const nitsPaginados = await getAllNitsPaginated(1, 10, 'Empresa');
    console.log('NITs paginados:', nitsPaginados);

    // Buscar por ID
    const nitPorId = await getNitById("ejemplo-id");
    console.log('NIT por ID:', nitPorId);

    // Buscar por número de NIT
    const nitPorNumero = await getNitByNumber("123456789-0");
    console.log('NIT por número:', nitPorNumero);

    // Buscar por razón social
    const nitPorRazonSocial = await getNitBySocialReason("Empresa de Ejemplo S.A.");
    console.log('NIT por razón social:', nitPorRazonSocial);

    // Búsqueda de texto libre
    const resultadosBusqueda = await searchNits("Empresa");
    console.log('Resultados de búsqueda:', resultadosBusqueda);
  } catch (error) {
    console.error('Error en búsqueda:', error);
  }
}

/**
 * Ejemplo de actualización de un NIT
 */
async function ejemploActualizarNit() {
  try {
    const nitId = "ejemplo-id";
    
    const nitActualizado = await updateNit(nitId, {
      socialReason: "Nueva Razón Social S.A."
    });
    
    console.log('NIT actualizado:', nitActualizado);
  } catch (error) {
    console.error('Error al actualizar NIT:', error);
  }
}

/**
 * Ejemplo de eliminación de NITs
 */
async function ejemploEliminarNit() {
  try {
    const nitId = "ejemplo-id";
    const userId = "usuario123";
    
    // Eliminación suave (soft delete)
    const eliminado = await softDeleteNit(nitId, userId);
    console.log('NIT eliminado (soft):', eliminado);
    
    // Restaurar NIT eliminado
    const restaurado = await restoreNit(nitId);
    console.log('NIT restaurado:', restaurado);
    
    // Eliminación definitiva
    const eliminadoDefinitivo = await deleteNit(nitId);
    console.log('NIT eliminado definitivamente:', eliminadoDefinitivo);
  } catch (error) {
    console.error('Error al eliminar NIT:', error);
  }
}

/**
 * Ejemplo de estadísticas y consultas especiales
 */
async function ejemploEstadisticas() {
  try {
    // Obtener estadísticas
    const estadisticas = await getNitStatistics();
    console.log('Estadísticas de NITs:', estadisticas);
    
    // Obtener solo NITs activos
    const nitsActivos = await getActiveNits();
    console.log('NITs activos:', nitsActivos);
    
    // Obtener NITs eliminados
    const nitsEliminados = await getDeletedNits();
    console.log('NITs eliminados:', nitsEliminados);
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
  }
}

/**
 * Ejemplo de funciones de utilidad
 */
function ejemploUtilidades() {
  const nit = {
    id: "1",
    numberNit: "123456789-0",
    socialReason: "Empresa de Ejemplo S.A.",
    sincronized: true,
    _deleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Formatear información del NIT
  const infoFormateada = formatNitInfo(nit);
  console.log('Info formateada:', infoFormateada);
  
  // Validar número de NIT
  const numeroValido = validateNitNumber("123456789-0");
  console.log('Número válido:', numeroValido);
  
  // Validar razón social
  const razonSocialValida = validateSocialReason("Empresa S.A.");
  console.log('Razón social válida:', razonSocialValida);
}

/**
 * Función principal que ejecuta todos los ejemplos
 */
export async function ejecutarEjemplosNit() {
  console.log('=== Iniciando ejemplos de NIT ===');
  
  await ejemploCrearNit();
  await ejemploBuscarNits();
  await ejemploActualizarNit();
  await ejemploEliminarNit();
  await ejemploEstadisticas();
  ejemploUtilidades();
  
  console.log('=== Ejemplos completados ===');
}

// Exportar funciones individuales para uso selectivo
export {
  ejemploCrearNit,
  ejemploBuscarNits,
  ejemploActualizarNit,
  ejemploEliminarNit,
  ejemploEstadisticas,
  ejemploUtilidades
};
