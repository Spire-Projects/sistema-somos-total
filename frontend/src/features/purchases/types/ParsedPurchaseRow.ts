/**
 * Representa una fila parseada del Excel de compras
 */
export interface ParsedPurchaseRow {
  /** Índice de fila en el Excel (1-based) */
  rowNumber: number;
  
  /** Código del producto */
  codigo: string;
  
  /** Descripción del producto */
  descripcion: string;
  
  /** Cantidad de piezas */
  pzas: number | null;
  
  /** Precio unitario en Bs */
  pu: number | null;
  
  /** ID único temporal para UI (eliminar filas en preview) */
  tempId: string;
}

/**
 * Resultado del parsing del Excel
 */
export interface ExcelParseResult {
  /** Filas válidas encontradas */
  validRows: ParsedPurchaseRow[];
  
  /** Errores encontrados durante el parsing */
  errors: string[];
  
  /** Total de filas procesadas */
  totalRowsProcessed: number;
}
