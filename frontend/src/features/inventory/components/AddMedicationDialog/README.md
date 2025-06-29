# AddMedicationDialog - Componente Optimizado

Este componente ha sido diseñado siguiendo las mejores prácticas de React para crear un formulario de medicamentos ágil y optimizado.

## 🚀 Características de Optimización

### 1. **React Hook Form** 
- ✅ Validación en tiempo real
- ✅ Formulario no controlado para mejor rendimiento
- ✅ Validaciones personalizadas con reglas centralizadas
- ✅ Manejo de errores integrado

### 2. **Memoización y Prevención de Re-renders**
- ✅ `memo()` en todos los componentes para evitar re-renders innecesarios
- ✅ `useCallback()` para funciones que se pasan como props
- ✅ `useMemo()` para valores calculados costosos
- ✅ Componentes separados para responsabilidades específicas

### 3. **Lazy Loading y Code Splitting**
- ✅ Componentes separados por funcionalidad
- ✅ Carga diferida de catálogos pesados
- ✅ Hooks personalizados para gestión de estado

### 4. **Gestión de Estado Eficiente**
- ✅ Estado local optimizado con hooks personalizados
- ✅ `useActiveIngredients` para manejo de principios activos
- ✅ `useCatalogData` para carga de datos de catálogos
- ✅ Evita useEffect innecesarios

### 5. **UX/UI Optimizada**
- ✅ CreatableSelect para búsqueda y creación rápida
- ✅ Validación visual en tiempo real
- ✅ Loading states para feedback inmediato
- ✅ Confirmación antes de cerrar formulario con cambios
- ✅ Toasts para notificaciones

## 📁 Estructura de Componentes

```
AddMedicationDialog/
├── AddMedicationDialog.tsx          # Componente principal
├── MedicationCatalogSelects.tsx     # Selects de catálogos (categoría, proveedor, etc.)
├── ActiveIngredientsMultiSelect.tsx # Selector múltiple de principios activos
├── useActiveIngredients.ts          # Hook para gestión de principios activos
├── useCatalogData.ts               # Hook para carga de datos de catálogos
└── index.ts                        # Exports públicos
```

## 🎯 Características del Formulario

### Campos Principales
- **Nombre Comercial** * (requerido, 2-100 caracteres)
- **Nombre del Fabricante** * (requerido, 2-100 caracteres)
- **Categoría** * (búsqueda/creación con CreatableSelect)
- **Nombre Genérico** * (búsqueda/creación con CreatableSelect)
- **Proveedor** * (búsqueda/creación con CreatableSelect)
- **Forma Farmacéutica** * (búsqueda/creación con CreatableSelect)
- **Principios Activos** * (selección múltiple con búsqueda)
- **Presentación** * (ej: "Tabletas - Caja x 30")
- **Concentración** * (validación de formato: "500mg", "10ml", etc.)
- **Código de Barras** (opcional, validación 8-14 dígitos)
- **Descripción** (opcional)
- **Indicaciones** (opcional)
- **Advertencias** (opcional)

### Validaciones Implementadas

```typescript
const validationRules = {
  comercialName: {
    required: "El nombre comercial es requerido",
    minLength: { value: 2, message: "Mínimo 2 caracteres" },
    maxLength: { value: 100, message: "Máximo 100 caracteres" }
  },
  concentration: {
    required: "La concentración es requerida",
    pattern: {
      value: /^[\d.,]+\s*(mg|g|ml|l|UI|mcg|µg|%|mEq|mmol)\s*$/i,
      message: "Formato inválido. Ej: 500mg, 10ml, 25%"
    }
  },
  barcode: {
    pattern: {
      value: /^[0-9]{8,14}$/,
      message: "Código de barras debe tener entre 8 y 14 dígitos"
    }
  }
};
```

## ⚡ Optimizaciones de Rendimiento

### 1. **Componentes Memoizados**
```tsx
const AddMedicationDialog = memo(({ onMedicationAdded }) => {
  // Implementación optimizada
});
```

### 2. **Callbacks Optimizados**
```tsx
const handleFieldChange = useCallback((field, value) => {
  setValue(field, value, { shouldDirty: true, shouldValidate: true });
}, [setValue]);
```

### 3. **Búsquedas Debounced**
```tsx
const searchCategories = useCallback(async (query) => {
  try {
    return await searchMedicationCategories(query);
  } catch (error) {
    console.error("Error searching categories:", error);
    return [];
  }
}, []);
```

### 4. **Validación de Formulario Optimizada**
```tsx
const isFormValid = useMemo(() => {
  return (
    watchedValues.comercialName?.trim() &&
    watchedValues.tradeName?.trim() &&
    watchedValues.categoryId &&
    // ... más validaciones
  );
}, [watchedValues]);
```

## 🔧 Uso del Componente

```tsx
import AddMedicationDialog from './components/AddMedicationDialog';

function InventoryPage() {
  const handleMedicationAdded = () => {
    // Refrescar lista de medicamentos
    console.log('Medicamento agregado exitosamente');
  };

  return (
    <div>
      <AddMedicationDialog onMedicationAdded={handleMedicationAdded} />
    </div>
  );
}
```

## 📋 Dependencias

- `react-hook-form` - Gestión de formularios
- `sonner` - Notificaciones toast
- `lucide-react` - Iconos
- Componentes UI personalizados (Button, Input, Dialog, etc.)

## 🎨 Diseño Responsivo

- ✅ Grid responsivo que se adapta a móvil/desktop
- ✅ Botones que cambian de disposición en pantallas pequeñas
- ✅ Diálogo con altura máxima y scroll automático
- ✅ Inputs y selects optimizados para touch

## 🚨 Manejo de Errores

- ✅ Validación de campos requeridos
- ✅ Mensajes de error específicos por campo
- ✅ Manejo de errores de red al crear elementos
- ✅ Confirmación antes de perder datos

Este componente está diseñado para ser **rápido**, **intuitivo** y **escalable**, siguiendo las mejores prácticas de React para aplicaciones de nivel empresarial.
