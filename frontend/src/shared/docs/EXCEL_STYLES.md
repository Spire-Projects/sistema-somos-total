# Estilos Avanzados para Exportación Excel

## 🎨 Nuevas Características de Estilo

El sistema de exportación ahora incluye estilos avanzados para crear reportes Excel profesionales con:

### ✅ Estilos Implementados

1. **Headers con Negrita y Color**
   - Fondo azul corporativo (#4472C4)
   - Texto blanco y negrita
   - Bordes completos
   - Centrado horizontal y vertical

2. **Bordes Completos en Tablas**
   - Bordes en todas las celdas
   - Headers con bordes más gruesos
   - Datos con bordes suaves

3. **Filas Alternadas**
   - Filas pares con fondo gris claro (#F8F9FA)
   - Mejor legibilidad de datos

4. **Metadatos Estilizados**
   - Títulos con fondo azul claro y bordes
   - Etiquetas en negrita alineadas a la derecha
   - Merge de celdas para títulos principales

5. **Formato Condicional**
   - Colores basados en valores (stock bajo/normal/alto)
   - Estilos personalizados por tipo de dato

## 📋 Ejemplo de Uso Básico

```typescript
// Los estilos se aplican automáticamente al usar ExcelExporter
await ExcelExporter.exportToExcel(data, config, metadata, fileName);
```

## 🎯 Configuración de Campos con Estilo

```typescript
const exportFields: ExportFieldConfig<MiTipo>[] = [
  { 
    key: 'nombre', 
    label: 'Nombre Completo', 
    selected: true,
    width: 20 // Ancho personalizado
  },
  { 
    key: 'precio', 
    label: 'Precio', 
    selected: true,
    width: 12,
    format: (value) => `$${value.toFixed(2)}` // Formato de moneda
  },
  { 
    key: 'fecha', 
    label: 'Fecha', 
    selected: true,
    width: 15,
    format: (value) => new Date(value).toLocaleDateString('es-ES')
  }
];
```

## 🌈 Estilos Personalizados Disponibles

### Estilos Predefinidos
```typescript
const customStyles = ExcelExporter.createCustomStyles();

// Usar estilos:
customStyles.currency    // Formato de moneda con alineación derecha
customStyles.percentage  // Formato de porcentaje centrado
customStyles.date       // Formato de fecha centrado
customStyles.number     // Formato de número con separadores
customStyles.warning    // Fondo amarillo para advertencias
customStyles.danger     // Fondo rojo para errores
customStyles.success    // Fondo verde para éxito
```

### Formato Condicional

```typescript
// Ejemplo para medicamentos con stock bajo
const conditions = [
  {
    field: 'stock',
    condition: (value: number) => value === 0,
    style: customStyles.danger // Rojo para sin stock
  },
  {
    field: 'stock',
    condition: (value: number) => value > 0 && value <= 10,
    style: customStyles.warning // Amarillo para stock bajo
  },
  {
    field: 'stock',
    condition: (value: number) => value > 10,
    style: customStyles.success // Verde para stock normal
  }
];

// Mapeo de campos a columnas
const fieldMapping = [
  { key: 'stock', colIndex: 5 }
];

// Aplicar formato condicional
ExcelExporter.applyConditionalFormatting(
  worksheet,
  data,
  conditions,
  fieldMapping
);
```

## 🏥 Ejemplo Específico: Inventario de Medicamentos

### Resultado Visual del Excel Generado:

**Hoja "Información":**
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃        INFORMACIÓN DEL REPORTE                   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
                   
Título:                    Catálogo de Medicamentos
Fecha de exportación:      17/07/2025
Rango de fechas:          01/07/2025 - 31/07/2025
Total de registros:       145
Exportado por:            Usuario

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃               FILTROS APLICADOS                   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

searchQuery:              aspirina
categoryId:               antibioticos
```

**Hoja "Datos":**
```
┏━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━┓
┃ Nombre Comercial ┃ Nombre de Marca  ┃ Nombre Genérico  ┃ Stock Total ┃ Estado Stock  ┃
┣━━━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━┫
┃ Aspirina 500mg   ┃ Bayer Aspirina   ┃ Ácido Salicílico ┃     🟢 25   ┃   En Stock    ┃
┣━━━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━┫
┃ Paracetamol      ┃ Tylenol          ┃ Paracetamol      ┃     🟡 5    ┃  Stock Bajo   ┃
┣━━━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━┫
┃ Ibuprofeno       ┃ Advil            ┃ Ibuprofeno       ┃     🔴 0    ┃   Sin Stock   ┃
┗━━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━┛
```

## 🛠 Personalización Avanzada

### Crear Estilos Personalizados

```typescript
const miEstiloPersonalizado = {
  fill: { fgColor: { rgb: "FFE6E6" } },      // Fondo rosa claro
  font: { 
    color: { rgb: "CC0000" },                // Texto rojo
    bold: true,                              // Negrita
    italic: true                             // Cursiva
  },
  border: {
    top: { style: "thick", color: { rgb: "FF0000" } },
    bottom: { style: "thick", color: { rgb: "FF0000" } },
    left: { style: "thick", color: { rgb: "FF0000" } },
    right: { style: "thick", color: { rgb: "FF0000" } }
  },
  alignment: {
    horizontal: "center",
    vertical: "center"
  }
};
```

### Altura de Filas Personalizada

El sistema automáticamente configura:
- Headers: 25pt de altura
- Datos: Altura automática
- Metadatos - Títulos: 30pt
- Metadatos - Datos: 20pt

### Ancho de Columnas

```typescript
const campos = [
  { 
    key: 'descripcionLarga', 
    label: 'Descripción Completa', 
    selected: true,
    width: 30 // Columna más ancha para texto largo
  },
  { 
    key: 'codigo', 
    label: 'Código', 
    selected: true,
    width: 10 // Columna más estrecha para códigos
  }
];
```

## 🎨 Códigos de Color Utilizados

### Colores Principales
- **Header Background**: `#4472C4` (Azul corporativo)
- **Header Text**: `#FFFFFF` (Blanco)
- **Alternate Rows**: `#F8F9FA` (Gris muy claro)
- **Metadata Titles**: `#E7F3FF` (Azul muy claro)

### Colores de Estado
- **Success/En Stock**: `#E6F7E6` (Verde claro)
- **Warning/Stock Bajo**: `#FFF2CC` (Amarillo claro)
- **Danger/Sin Stock**: `#FFE6E6` (Rojo claro)

### Colores de Borde
- **Headers**: `#000000` (Negro)
- **Data**: `#CCCCCC` (Gris)
- **Metadata**: `#1F4E79` (Azul oscuro)

## 📊 Resultado Final

El Excel generado tendrá:

1. **Apariencia Profesional**
   - Headers destacados con color corporativo
   - Bordes en toda la tabla
   - Filas alternadas para mejor lectura

2. **Información Clara**
   - Metadatos organizados en la primera hoja
   - Datos principales en la segunda hoja
   - Formato condicional para alertas visuales

3. **Fácil de Leer**
   - Columnas con ancho apropiado
   - Alineación consistente
   - Colores que indican estado o prioridad

El sistema está completamente automatizado - solo necesitas usar `ExcelExporter.exportToExcel()` y obtendrás un archivo Excel profesional con todos estos estilos aplicados automáticamente.
