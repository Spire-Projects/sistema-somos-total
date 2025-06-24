# Gestión de Lotes de Medicamentos - Documentación

## Resumen

Se ha implementado una página completa de gestión de lotes de medicamentos siguiendo la misma estética y estructura de la página de gestión de usuarios. La funcionalidad incluye:

## Características Implementadas

### 1. **Componentes Principales**

#### `BatchManager.tsx`
- Componente principal que orquesta toda la funcionalidad
- Manejo de estado para lotes, medicamentos, paginación, búsqueda y filtros
- Estadísticas rápidas (total de lotes, valor de inventario, margen promedio)
- Integración con todos los subcomponentes

#### `BatchTable.tsx`
- Tabla responsiva con datos de lotes agrupados por medicamento
- Columnas: Medicamento, Lote ID, Cantidad, Fechas, Estado, Precios, Margen, Proveedor
- Estado de vencimiento con badges de colores (Vencido, Por vencer, Próximo a vencer, Vigente)
- Selección múltiple de lotes
- Botones de acción (Editar, Eliminar)

#### `BatchSearchAndFilters.tsx`
- Búsqueda por texto (medicamento, lote ID, proveedor)
- Filtros de fecha (desde - hasta)
- Filtro por medicamento específico
- Panel de filtros expandible/colapsable
- Contador de filtros activos

#### `BatchDialog.tsx`
- Formulario modal para crear/editar lotes
- Cálculo automático de precio de venta por margen de ganancia
- Modo manual para establecer precio de venta directamente
- Validaciones completas del formulario
- Selección de medicamento existente

### 2. **Componentes Reutilizables**

#### `DataPagination.tsx`
- Componente de paginación genérico extraído de la funcionalidad de usuarios
- Soporta cualquier tipo de datos (usuarios, lotes, etc.)
- Responsive design con diferentes vistas para móvil y desktop
- Selector de elementos por página

#### `Sales.ts` (Tipos)
- Tipos TypeScript específicos para la gestión de lotes
- `BatchWithMedication`: Combina datos de lote con información del medicamento
- `CreateBatchData`: Datos para crear nuevos lotes
- `BatchFilter`: Filtros de búsqueda y fecha

### 3. **Funcionalidades de Precios**

#### Cálculo Automático de Precios
- **Modo Margen**: Establece el margen de ganancia deseado (%) y calcula automáticamente el precio de venta
- **Modo Manual**: Permite establecer el precio de venta manualmente y muestra el margen resultante
- Prevención de precios de venta menores al costo
- Visualización en tiempo real de márgenes y precios

### 4. **Estética y UX**

#### Diseño Consistente
- Misma paleta de colores y componentes que la página de usuarios
- Cards informativos con estadísticas relevantes
- Badges de estado con códigos de color intuitivos
- Iconografía coherente (Package, DollarSign, Calendar, etc.)

#### Responsive Design
- Adaptable a dispositivos móviles y desktop
- Tabla con scroll horizontal en pantallas pequeñas
- Filtros colapsables en móvil

### 5. **Datos de Ejemplo**

Se incluyen datos de ejemplo (mock data) para demostrar la funcionalidad:
- 2 medicamentos de ejemplo (Paracetamol, Ibuprofeno)
- 2 lotes de ejemplo con diferentes estados y márgenes
- Datos realistas con fechas, precios y proveedores

## Estructura de Archivos

```
src/features/sales/
├── components/
│   ├── BatchManager.tsx          # Componente principal
│   ├── BatchTable.tsx            # Tabla de lotes
│   ├── BatchDialog.tsx           # Modal crear/editar
│   ├── BatchSearchAndFilters.tsx # Búsqueda y filtros
│   ├── SalesPage.tsx             # Página principal
│   └── index.ts                  # Exportaciones
├── index.ts                      # Exportaciones principales
└── ...

src/shared/
├── components/
│   └── DataPagination.tsx        # Paginación reutilizable
├── types/
│   └── Sales.ts                  # Tipos específicos
└── ...
```

## Integración

### Rutas
La página está integrada en el sistema de rutas existente:
- Ruta: `/sales`
- Componente: `SalesPage`

### Estado
- Estado local para demostración
- Preparado para integración con APIs reales
- Estructura compatible con el patrón de servicios existente

## Próximos Pasos (TODOs)

1. **Integración con Backend**
   - Conectar con APIs reales para CRUD de lotes
   - Integración con el servicio de medicamentos existente

2. **Autenticación**
   - Obtener usuario actual del contexto de autenticación
   - Permisos por rol (admin, cashier, etc.)

3. **Funcionalidades Adicionales**
   - Exportación de datos (Excel, PDF)
   - Alertas de vencimiento
   - Historial de cambios de precios
   - Integración con módulo de compras

4. **Optimizaciones**
   - Lazy loading de medicamentos
   - Cache de datos
   - Optimistic updates

## Uso

1. Navegar a `/sales` en la aplicación
2. Ver estadísticas de lotes en la parte superior
3. Usar filtros para buscar lotes específicos
4. Hacer clic en "Nuevo Lote" para agregar un lote
5. Usar los botones de acción en la tabla para editar/eliminar

La funcionalidad está completamente operativa con datos de ejemplo y lista para integración con el backend real.
