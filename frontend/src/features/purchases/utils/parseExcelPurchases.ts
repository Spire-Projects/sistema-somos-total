import * as XLSX from 'xlsx';
import type { ParsedPurchaseRow, ExcelParseResult } from '../types/ParsedPurchaseRow';

/**
 * Palabras clave para detectar headers en el Excel
 * Ordenadas por prioridad (más específicas primero)
 */
const HEADER_KEYWORDS = {
  CODIGO: ['CODIGO', 'CÓDIGO', 'COD'],
  DESCRIPCION: ['DESCRIPCION', 'DESCRIPCIÓN', 'DESC'],
  PZAS: ['PZAS', 'PZS', 'CANTIDAD'], // PZAS primero, CAJAS último
  PU: ['P.U.(BS)', 'P.U. (BS)', 'P.U', 'PU', 'PRECIO', 'UNITARIO'], // Más específico primero
};

/**
 * Palabras que indican el fin de una tabla o fila inválida
 */
const STOP_KEYWORDS = [
  'TOTAL',
  'N° PEDIDO',
  'Nº PEDIDO',
  'TOTAL A PAGAR',
  'SALDO A FAVOR',
  'OBSERVACION',
  'AGOTADO',
];

/**
 * Normaliza el texto de una celda
 */
function normalizeCellText(value: any): string {
  if (value === null || value === undefined || value === '') return '';
  return String(value).trim();
}

/**
 * Parsea un número que puede venir con formato boliviano
 * Formato boliviano: punto (.) para miles, coma (,) para decimales
 * Ejemplo: 1.844,80 = 1844.80
 */
function parseNumber(raw: any): number | null {
  if (raw === null || raw === undefined) return null;
  
  let str = String(raw).trim();
  if (str === '') return null;
  
  // Eliminar espacios
  str = str.replace(/\s+/g, '');
  
  // Formato boliviano: punto para miles, coma para decimales
  // Si tiene ambos, punto son miles y coma decimal
  if (str.indexOf('.') !== -1 && str.indexOf(',') !== -1) {
    // Formato: 1.844,80 → eliminar puntos, convertir coma a punto
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (str.indexOf(',') !== -1 && str.indexOf('.') === -1) {
    // Solo coma: es decimal (ej: 536,00)
    str = str.replace(',', '.');
  }
  // Si solo tiene punto, asumir que es decimal americano (ej: 1844.80)
  
  // Eliminar caracteres no numéricos excepto punto y menos
  str = str.replace(/[^\d\.-]/g, '');
  
  const num = Number(str);
  
  // Retornar null solo si no es un número finito
  if (!Number.isFinite(num)) return null;
  
  // Permitir cero (0) como valor válido
  return num;
}

/**
 * Busca la fila de encabezado en el array de filas
 */
function findHeaderRow(rows: any[][]): { index: number; mapping: Record<string, number> } | null {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    
    const rowUpper = row.map((cell) => normalizeCellText(cell).toUpperCase());
    
    // Buscar índices de columnas con mejor match (más específico primero)
    const codigoIdx = findBestMatch(rowUpper, HEADER_KEYWORDS.CODIGO);
    const descripcionIdx = findBestMatch(rowUpper, HEADER_KEYWORDS.DESCRIPCION);
    const pzasIdx = findBestMatch(rowUpper, HEADER_KEYWORDS.PZAS);
    const puIdx = findBestMatch(rowUpper, HEADER_KEYWORDS.PU);
    
    // Debe tener al menos CODIGO y DESCRIPCION
    if (codigoIdx !== -1 && descripcionIdx !== -1) {
      return {
        index: i,
        mapping: {
          codigo: codigoIdx,
          descripcion: descripcionIdx,
          pzas: pzasIdx,
          pu: puIdx,
        },
      };
    }
  }
  
  return null;
}

/**
 * Encuentra el mejor match para una columna
 * Prioriza matches exactos y más específicos
 */
function findBestMatch(rowCells: string[], keywords: string[]): number {
  // Primero buscar match exacto
  for (const keyword of keywords) {
    const exactIdx = rowCells.findIndex((cell) => cell === keyword);
    if (exactIdx !== -1) return exactIdx;
  }
  
  // Luego buscar match por inclusión (en orden de prioridad de keywords)
  for (const keyword of keywords) {
    const includesIdx = rowCells.findIndex((cell) => cell.includes(keyword));
    if (includesIdx !== -1) return includesIdx;
  }
  
  return -1;
}

/**
 * Verifica si una fila debe ser ignorada (es un separador o total)
 */
function shouldSkipRow(row: any[]): boolean {
  const concatenated = row
    .map(normalizeCellText)
    .join(' ')
    .toUpperCase();
  
  if (!concatenated.trim()) return true;
  
  return STOP_KEYWORDS.some((keyword) => concatenated.includes(keyword));
}

/**
 * Genera un ID único temporal para la fila
 */
function generateTempId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Parsea un archivo Excel y extrae las filas válidas de compras
 * Solo procesa la primera hoja del archivo
 */
export async function parseExcelFile(file: File): Promise<ExcelParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error('No se pudo leer el archivo'));
          return;
        }
        
        // Leer el workbook con raw: true para preservar formato original
        // Esto evita que SheetJS parsee números con formato americano
        const workbook = XLSX.read(data, { type: 'array', raw: true });
        
        if (!workbook.SheetNames.length) {
          resolve({
            validRows: [],
            errors: ['El archivo Excel no contiene hojas'],
            totalRowsProcessed: 0,
          });
          return;
        }
        
        // Solo procesar la primera hoja
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convertir a array de arrays con raw: true para preservar formato
        const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          raw: true,  // Mantener valores como texto para parsear manualmente
          defval: '',
        });
        
        if (!rows || rows.length === 0) {
          resolve({
            validRows: [],
            errors: ['La hoja está vacía'],
            totalRowsProcessed: 0,
          });
          return;
        }
        
        const validRows: ParsedPurchaseRow[] = [];
        const errors: string[] = [];
        let totalRowsProcessed = 0;
        
        // Buscar encabezado
        const headerInfo = findHeaderRow(rows);
        
        if (!headerInfo) {
          resolve({
            validRows: [],
            errors: ['No se encontró una fila de encabezado válida con CODIGO y DESCRIPCION'],
            totalRowsProcessed: rows.length,
          });
          return;
        }
        
        const { index: headerIndex, mapping } = headerInfo;
        
        // Procesar filas después del encabezado
        for (let i = headerIndex + 1; i < rows.length; i++) {
          const row = rows[i];
          totalRowsProcessed++;
          
          // Saltar filas vacías o separadores
          if (shouldSkipRow(row)) continue;
          
          // Extraer valores
          const codigo = normalizeCellText(row[mapping.codigo]);
          const descripcion = normalizeCellText(row[mapping.descripcion]);
          const pzas = mapping.pzas !== -1 ? parseNumber(row[mapping.pzas]) : null;
          const pu = mapping.pu !== -1 ? parseNumber(row[mapping.pu]) : null;
          
          // Validaciones: debe tener código y descripción
          if (!codigo || !descripcion) {
            continue;
          }
          
          // REGLA CRÍTICA: PZAS debe ser mayor a 0 (obligatorio)
          // No se importan filas con PZAS = 0, aunque tengan P.U válido
          if (pzas === null || pzas <= 0) {
            continue;
          }
          
          // Además, debe tener al menos un precio unitario válido
          if (pu === null || pu <= 0) {
            continue;
          }
          
          validRows.push({
            rowNumber: i + 2, // Excel es 1-based
            codigo,
            descripcion,
            pzas,
            pu,
            tempId: generateTempId(),
          });
        }
        
        resolve({
          validRows,
          errors,
          totalRowsProcessed,
        });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsArrayBuffer(file);
  });
}
