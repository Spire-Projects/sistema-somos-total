# Importación de Compras desde Excel

## 📋 Descripción

Funcionalidad completa para importar compras masivas desde archivos Excel (.xlsx/.xls) con validación automática, previsualización y creación automática de productos.

## 🚀 Características

- ✅ **Drag & Drop**: Interfaz intuitiva para subir archivos Excel
- ✅ **Parser Inteligente**: Detecta automáticamente headers irregulares en la primera hoja
- ✅ **Validaciones**: Solo procesa filas con datos válidos (CODIGO, DESCRIPCION, PZAS >0 o P.U >0)
- ✅ **Previsualización**: Muestra tabla con todos los datos detectados antes de importar
- ✅ **Edición Manual**: Permite eliminar filas individuales de la importación
- ✅ **Creación Automática**: Crea productos automáticamente si no existen por código
- ✅ **Progress Bar**: Muestra progreso en tiempo real de la importación
- ✅ **Manejo de Errores**: Reporta errores detallados por fila

## 📁 Estructura de Archivos

```
frontend/src/features/purchases/
├── components/
│   └── UploadExcelPurchaseModal.tsx    # Modal principal con drag & drop
├── services/
│   └── PurchaseImporterService.ts      # Lógica de importación y creación
├── types/
│   ├── ParsedPurchaseRow.ts            # Interfaces TypeScript
│   └── index.ts                        # Exportaciones
├── utils/
│   └── parseExcelPurchases.ts          # Parser de Excel
└── views/
    └── PurchasesPage.tsx               # Integración del modal
```

## 🔧 Dependencias Instaladas

```bash
npm install xlsx              # Parser de Excel (SheetJS)
npm install react-dropzone    # Drag & drop de archivos
npm install @radix-ui/react-progress  # Barra de progreso
```

## 📊 Formato del Excel

### Columnas Reconocidas

El parser busca automáticamente estas columnas (case-insensitive):

- **CODIGO**: `CODIGO`, `CÓDIGO`, `COD`
- **DESCRIPCION**: `DESCRIPCION`, `DESCRIPCIÓN`, `DESC`
- **PZAS**: `PZAS`, `PZS`, `CAJAS`, `CANTIDAD`
- **P.U**: `P.U`, `PU`, `P.U.(BS)`, `P.U. (BS)`, `PRECIO`, `UNITARIO`

### Ejemplo de Formato Excel

| ITEM | CODIGO     | DESCRIPCION                    | CAJAS | PZAS | P.U. (BS) | SUB TOTAL (BS) | OBSERVACION |
|------|------------|--------------------------------|-------|------|-----------|----------------|-------------|
| 1    | TIWL201351 | LLAVE DE IMPACTO 1350Nm 20V    |       | 1    | 2.656,80  | 2.656,80       |             |
| 2    | THT121602  | JUEGO DADO 62 PCS 1/2          |       | 2    | 536,00    | 1.072,00       |             |
| 3    | THT561625  | BOLSO DE HERRAMIENTA (verde)   |       | 4    | 257,60    | 1.030,40       | OK          |

### Validaciones Automáticas

✅ **Filas Válidas**: Deben cumplir TODAS estas condiciones:
- Código no vacío
- Descripción no vacía
- **PZAS > 0** (obligatorio)
- **P.U > 0** (obligatorio)

❌ **Filas Ignoradas**:
- Filas vacías
- Filas con palabras clave: `TOTAL`, `N° PEDIDO`, `SALDO A FAVOR`, `AGOTADO`
- Código o descripción vacíos
- **PZAS ≤ 0 o null** (se excluyen siempre)
- **P.U ≤ 0 o null** (se excluyen siempre)

### Criterios de Importación (Estrictos)

**Se importa la fila SOLO si**:
- `PZAS > 0` **Y** `P.U > 0` (ambos requeridos)

**NO se importa la fila si**:
- ❌ `PZAS = 0` (aunque P.U > 0)
- ❌ `P.U = 0` (aunque PZAS > 0)
- ❌ Cualquiera de los dos es `null`
- ❌ Cualquiera de los dos es `≤ 0`

### Parser de Números Mejorado

El parser está optimizado para el **formato boliviano**:

```typescript
// Formato boliviano: punto (.) miles, coma (,) decimales
parseNumber("1.844,80")  → 1844.80  ✅
parseNumber("536,00")    → 536.00   ✅
parseNumber("1")         → 1        ✅
parseNumber("0")         → 0        ✅ (permite cero)
parseNumber("")          → null     ❌
```

**Reglas de parsing**:
1. Si tiene punto Y coma: punto = miles, coma = decimal
2. Si solo tiene coma: coma = decimal
3. Si solo tiene punto: punto = decimal (fallback americano)
4. Valores de 0 son válidos (no se descartan)

## 🎯 Uso

### 1. Acceder al Modal

1. Ir a la página de **Compras**
2. Hacer clic en el botón de opciones (⋮)
3. Seleccionar **Importar**

### 2. Subir Excel

- **Opción A**: Arrastrar archivo Excel al área de dropzone
- **Opción B**: Hacer clic para abrir selector de archivos

### 3. Revisar Previsualización

- Ver tabla con todas las filas detectadas
- Verificar: Código, Descripción, Pzas, P.U.
- **Opcional**: Eliminar filas no deseadas (🗑️)

### 4. Confirmar Importación

- Hacer clic en **Importar X compras**
- Ver progreso en tiempo real
- Esperar confirmación de éxito

## ⚙️ Comportamiento del Sistema

### Búsqueda/Creación de Productos

Para cada fila:

1. **Busca** producto existente por código (case-insensitive)
2. Si **NO existe**:
   - Crea producto nuevo con:
     - `code`: Código del Excel
     - `name`: Descripción del Excel
     - `createdBy`: "excel-importer"
3. Si **existe**: Usa el producto encontrado

### Creación de Compras

Para cada fila se crea una compra con:

```typescript
{
  productId: "<id-del-producto>",
  purchaseDate: new Date().toISOString(),
  receiptNumber: "ABCD1234", // 4 letras + 4 números aleatorios
  quantityPurchased: row.pzas ?? 1,
  unitCost: row.pu ?? 0,
  totalCost: (pzas ?? 1) * (pu ?? 0),
  profitMarginPercentage: 0,
  notes: row.descripcion,
  createdBy: "current-user"
}
```

## 🐛 Manejo de Errores

### Errores de Parsing

Si el parser no encuentra headers válidos o el archivo está corrupto:
- Se muestra alerta con detalles específicos
- No se permite continuar con importación

### Errores de Importación

Si falla la creación de productos o compras:
- Se registra el error por fila
- Se continúa con las siguientes filas
- Al final se muestra resumen: exitosas vs fallidas

### Mensajes Toast

- ✅ **Success**: "Se importaron exitosamente X compras"
- ⚠️ **Warning**: "Se importaron X de Y filas. Z fallaron."
- ❌ **Error**: "Error al importar las compras"

## 🔍 Detalles Técnicos

### Detección Inteligente de Columnas

El parser usa un algoritmo de **mejor match** para detectar columnas:

1. **Match Exacto**: Busca coincidencia exacta primero (ej: "PZAS" == "PZAS")
2. **Match por Inclusión**: Si no hay exacto, busca por contención (ej: "PZAS" en "TOTAL PZAS")
3. **Prioridad**: Sigue el orden de keywords (más específico primero)

**Ejemplo**: Si el Excel tiene columnas `CAJAS` y `PZAS`:
- Buscará primero "PZAS" (más específico)
- Si no existe, buscará "PZS"
- Por último buscará "CAJAS"

Esto evita conflictos cuando hay múltiples columnas similares.

### Parser de Números Boliviano

Soporta el formato estándar boliviano:

```typescript
parseNumber("1.844,80")  → 1844.80  // Formato boliviano
parseNumber("536,00")    → 536.00   // Solo decimales
parseNumber("1 234,56")  → 1234.56  // Con espacios
parseNumber("Bs 1.844")  → 1844     // Con símbolo de moneda
parseNumber("1")         → 1        // Entero
parseNumber("0")         → 0        // Cero válido
```

### Generación de Receipt Number

Formato único: 4 letras mayúsculas + 4 números

Ejemplo: `ABCD1234`, `XYZW5678`, `MNOP9012`

### Performance

- **Procesamiento**: Secuencial (evita problemas de concurrencia)
- **Callback de Progreso**: Actualización cada fila procesada
- **Límite Recomendado**: ~1000 filas por archivo

## 📝 TODOs Futuros

- [ ] Validación de proveedor por nombre
- [ ] Configuración de profitMarginPercentage personalizada
- [ ] Asignación de fecha de compra desde Excel
- [ ] Export de template Excel vacío
- [ ] Validación de duplicados antes de importar
- [ ] Rollback en caso de error parcial
- [ ] Importación en background para archivos grandes

## 🤝 Integración con Servicios

### ProductService

```typescript
productService.getAllView(1, 1000)  // Buscar productos existentes
productService.create(data)         // Crear nuevo producto
```

### PurchaseService

```typescript
purchaseService.create(data)  // Crear nueva compra
```

### PurchaseImporterService

```typescript
purchaseImporterService.importRows(
  rows: ParsedPurchaseRow[],
  createdBy: string,
  onProgress?: (current: number, total: number) => void
): Promise<ImportResult>
```

## 📸 Capturas de Pantalla

### 1. Dropzone Inicial
- Área de arrastrar y soltar
- Validación de tipos de archivo

### 2. Procesando Archivo
- Loader animado
- Mensaje "Procesando archivo..."

### 3. Previsualización
- Tabla con filas detectadas
- Botón de eliminar por fila
- Total de filas válidas

### 4. Importando
- Barra de progreso
- Porcentaje completado

### 5. Resultado
- Toast con resumen
- Actualización automática de la tabla de compras

---

**Desarrollado con**: TypeScript + React + Vite + Shadcn/UI + SheetJS
