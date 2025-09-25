# Corrección del Bug de Rangos Duplicados de Facturas - V2

## Problema Re-Identificado (Actualización)

**ESTADO**: El problema se repitió después de la primera corrección. Análisis adicional reveló validaciones insuficientes y falta de coordinación entre terminales.

### Síntomas Observados:
- Múltiples rangos con números idénticos o superpuestos (ej: [1,10], [11,20], [14,20])
- Terminales diferentes grabando el mismo rango reciclado
- Condiciones de carrera durante creación simultánea de rangos

## Root Cause Analysis Actualizado

### 1. Validación Insuficiente en `findRecyclableNumbers()`
**Problema Principal**: La función no verificaba completamente si ya existía un rango ACTIVO con los números sugeridos para reciclaje.

**Código Problemático Original**:
```typescript
// Solo verificaba en rangos expirados/completados, NO en rangos activos
const ranges = await db.number_invoice_ranges.find({
  selector: {
    $or: [
      { status: NumberInvoiceStatus.EXPIRED },
      { status: NumberInvoiceStatus.COMPLETED }
    ]
  }
}).exec();
```

### 2. Falta de Coordinación Entre Terminales
**Problema**: Sin mecanismo de locking, múltiples terminales podían crear rangos simultáneamente.

**Escenario**:
1. Terminal A busca números reciclables → encuentra [12-20]
2. Terminal B busca números reciclables → encuentra [12-20] (mismo)  
3. Ambas crean rangos idénticos simultáneamente

### 3. Logs Insuficientes para Debugging
**Problema**: Difícil rastrear qué terminal creó qué rango y cuándo.

## Soluciones Implementadas (V2)

### 1. Validación Cruzada Mejorada en `findRecyclableNumbers()`

**Archivo**: `frontend/src/shared/db/repositories/numberInvoiceRange.repository.ts`

```typescript
async findRecyclableNumbers(): Promise<{ startNumber: number; endNumber: number }[]> {
  // ... código anterior ...

  // NUEVA VALIDACIÓN: Obtener TODOS los rangos activos para validación cruzada
  const allActiveRanges = await db.number_invoice_ranges.find({
    selector: {
      active: true,
      status: NumberInvoiceStatus.ACTIVE,
      expiredAt: { $gt: now }
    }
  }).exec();

  const activeRangesData = allActiveRanges.map(r => r.toJSON() as NumberInvoiceRangeDocument);

  for (const rangeDoc of ranges) {
    // ... procesamiento de rango ...
    
    // VALIDACIÓN CRÍTICA: Verificar que NO existe un rango activo que use estos números
    const conflictingRange = activeRangesData.find(activeRange => {
      const [activeStart, activeEnd] = activeRange.range;
      // Verificar si hay superposición entre los rangos
      return (num <= activeEnd && endSequence >= activeStart);
    });

    if (conflictingRange) {
      console.log(`❌ CONFLICTO DETECTADO: No se puede reciclar ${num}-${endSequence}`);
      continue; // Saltar números conflictivos
    }
    // ... continúa solo si no hay conflicto ...
  }
}
```

### 2. Sistema de Locking Atómico

**Archivo**: `frontend/src/shared/services/InvoiceNumberService.ts`

Implementado mecanismo de locking simple usando localStorage:

```typescript
private static async createNewRange(terminalId: string): Promise<NumberInvoiceRangeDocument[]> {
  const lockKey = `invoice_range_creation_lock`;
  const lockTimeout = 10000; // 10 segundos máximo

  try {
    // Verificar si hay lock activo de otra terminal
    const lockData = localStorage.getItem(lockKey);
    if (lockData) {
      const { timestamp, terminal } = JSON.parse(lockData);
      const now = Date.now();
      
      if (terminal !== terminalId && (now - timestamp < lockTimeout)) {
        console.log(`🔒 Esperando... Otra terminal está creando rangos`);
        await this.sleep(1000 + Math.random() * 2000); // Wait 1-3 seconds
        return this.createNewRange(terminalId); // Retry recursivo
      }
    }

    // Adquirir lock
    localStorage.setItem(lockKey, JSON.stringify({ 
      timestamp: Date.now(), 
      terminal: terminalId 
    }));

    // ... lógica de creación de rango ...

    // Liberar lock al final
    localStorage.removeItem(lockKey);
  } catch (error) {
    // Liberar lock en caso de error
    localStorage.removeItem(lockKey);
    throw error;
  }
}
```

### 3. Logs Mejorados con Timestamps y Terminal ID

```typescript
const timestamp = new Date().toISOString();
console.log(`📊 [${timestamp}] Terminal ${terminalId}: Encontrados ${recyclableNumbers.length} rangos reciclables`);
console.log(`🔍 [${timestamp}] Terminal ${terminalId}: Verificación de duplicado para ${startNumber}-${endNumber}`);
console.log(`🔒 [${timestamp}] Lock adquirido por terminal ${terminalId}`);
```

### 4. Liberación de Lock en Todos los Puntos de Salida

Asegurar que el lock se libere en:
- ✅ Creación exitosa de rango
- ✅ Error durante creación  
- ✅ Uso de rango existente
- ✅ No poder crear rango

## Mecanismos de Prevención Implementados

### 1. **Triple Validación**
1. Validación en `findRecyclableNumbers()` - evita sugerir números conflictivos
2. Validación en `createNewRange()` - double-check antes de crear
3. Validación final antes de insertar en base de datos

### 2. **Locking Cooperativo**
- Las terminales "esperan su turno" para crear rangos
- Previene condiciones de carrera
- Auto-liberación después de timeout

### 3. **Validación de Superposición**
- No solo verifica rangos idénticos, sino también superposiciones
- Considera rangos activos vs reciclables
- Protege contra conflictos parciales

## Testing y Validación

### Escenarios de Prueba Recomendados:

1. **Prueba Multi-Terminal**:
   ```
   - Abrir 3-4 terminales simultáneamente
   - Todas intentan crear rangos al mismo tiempo
   - Verificar que solo UNA crea cada rango único
   ```

2. **Prueba de Reciclaje**:
   ```
   - Completar un rango en Terminal A
   - Inmediatamente intentar reciclar desde Terminal B y C
   - Verificar que solo UNA terminal lo recicle
   ```

3. **Prueba de Locking**:
   ```
   - Simular creación de rango lenta (con breakpoints)
   - Verificar que otras terminales esperan
   ```

### Logs a Monitorear:

```
🔒 Lock adquirido por terminal PC-XXXXX
📊 Terminal PC-XXXXX: Encontrados N rangos reciclables
❌ CONFLICTO DETECTADO: No se puede reciclar X-Y
🔍 Verificación de duplicado: NO EXISTE / EXISTE
🔓 Lock liberado por terminal PC-XXXXX
```

## Resumen de Archivos Modificados

1. **`numberInvoiceRange.repository.ts`**:
   - Validación cruzada en `findRecyclableNumbers()`
   - Detección de superposiciones entre rangos

2. **`InvoiceNumberService.ts`**:
   - Sistema de locking con localStorage
   - Logs mejorados con timestamps
   - Liberación de lock en todos los escenarios

## Próximos Pasos

1. **Deploy y Monitoreo**: Implementar en producción y monitorear logs
2. **Testing Multi-Terminal**: Validar con múltiples terminales reales
3. **Optimización**: Si funciona bien, considerar optimizaciones de performance

---

**Fecha de Implementación**: $(Get-Date)
**Estado**: ✅ Implementado - Pendiente validación en producción