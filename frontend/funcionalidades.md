# 🏥 FarmaApp - Funcionalidades del Sistema

## 📋 Descripción General

FarmaApp es un sistema integral de gestión farmacéutica que permite administrar todos los aspectos operativos de una farmacia, desde el inventario hasta las ventas y reportes financieros.

---

## 🔐 Gestión de Usuarios y Autenticación

### Autenticación y Seguridad
- **Inicio de sesión seguro**: Sistema de autenticación con JWT tokens
- **Gestión de contraseñas**: Encriptación SHA256 para contraseñas
- **Cierre de sesión**: Funcionalidad para cerrar sesión de forma segura
- **Persistencia de sesión**: Mantenimiento de sesión activa

### Roles de Usuario
- **Administrador**: Acceso completo a todas las funcionalidades del sistema
- **Cajero**: Acceso limitado a ventas, clientes y dashboard
- **Control de permisos**: Restricción de acceso basado en roles

### Gestión de Usuarios (Solo Administrador)
- **Crear usuarios**: Registro de nuevos usuarios con roles específicos
- **Editar usuarios**: Modificación de información de usuarios existentes
- **Eliminar usuarios**: Eliminación permanente de usuarios del sistema
- **Búsqueda de usuarios**: Filtrado por nombre, email o rol
- **Activar/desactivar usuarios**: Control del estado de los usuarios
- **Paginación de usuarios**: Navegación eficiente de grandes listas

---

## 📦 Gestión de Inventario de Medicamentos

### Catálogo de Medicamentos
- **Registro completo**: Nombre comercial, genérico, concentración, presentación
- **Información del fabricante**: Gestión de fabricantes y proveedores
- **Categorización**: Organización por categorías farmacéuticas
- **Código de barras**: Registro y manejo de códigos de barras
- **Formas farmacéuticas**: Tabletas, cápsulas, jarabes, etc.
- **Principios activos**: Gestión de ingredientes activos

### Búsqueda y Filtros
- **Búsqueda avanzada**: Por nombre, categoría, fabricante o código de barras
- **Filtros múltiples**: Combinación de criterios de búsqueda
- **Ordenamiento**: Por nombre, stock, fecha de vencimiento
- **Vista responsiva**: Adaptación a dispositivos móviles y desktop

### Estados de Stock
- **Seguimiento en tiempo real**: Actualización automática de inventario
- **Alertas de stock bajo**: Notificaciones cuando el stock está por agotarse
- **Medicamentos sin stock**: Identificación de productos agotados
- **Control de sobrestock**: Detección de exceso de inventario

---

## 📋 Gestión de Lotes de Medicamentos

### Información de Lotes
- **Identificación única**: Código de lote personalizado
- **Fechas críticas**: Fecha de compra, vencimiento y registro
- **Precios**: Precio de compra y venta con cálculo de margen
- **Cantidades**: Stock actual y movimientos
- **Proveedores**: Registro del proveedor de cada lote

### Control de Vencimientos
- **Alertas tempranas**: Notificaciones de lotes próximos a vencer (30 días)
- **Lotes vencidos**: Identificación y manejo de productos vencidos
- **Ordenamiento FIFO**: Priorización de lotes por fecha de vencimiento
- **Reportes de vencimiento**: Informes detallados de expiración

### Gestión de Compras
- **Registro de compras**: Ingreso de nuevos lotes al inventario
- **Actualización de precios**: Modificación de precios por lote
- **Edición de lotes**: Actualización de información de lotes existentes
- **Eliminación de lotes**: Remoción de lotes del sistema
- **Búsqueda de lotes**: Filtrado por medicamento, proveedor o fecha

---

## 💰 Sistema de Ventas

### Procesamiento de Ventas
- **Carrito de compras**: Agregado de múltiples medicamentos
- **Cálculo automático**: Totales, subtotales y descuentos
- **Gestión de stock**: Descuento automático del inventario
- **Validación de stock**: Verificación de disponibilidad en tiempo real
- **Lógica FIFO**: Uso automático de lotes más próximos a vencer

### Información de Ventas
- **Datos del cliente**: Selección de cliente frecuente o venta general
- **Información del médico**: Registro opcional del médico prescriptor
- **Métodos de pago**: Efectivo, tarjeta, transferencia
- **Descuentos**: Aplicación de descuentos por producto o cliente
- **Historial de ventas**: Registro completo de todas las transacciones

### Funcionalidades Avanzadas
- **Búsqueda inteligente**: Localización rápida de medicamentos
- **Información detallada**: Detalles completos de cada medicamento
- **Alertas de stock**: Notificaciones durante la venta
- **Confirmación de venta**: Validación antes de procesar
- **Impresión de tickets**: Generación de comprobantes de venta

---

## 👥 Gestión de Clientes

### Clientes Frecuentes
- **Registro completo**: Nombre, email, teléfono, dirección
- **Número de NIT**: Registro para facturación
- **Puntos de fidelidad**: Sistema de lealtad con niveles (bronce, plata, oro, platino)
- **Historial de compras**: Seguimiento de transacciones pasadas
- **Información de contacto**: Datos para comunicación

### Gestión de Clientes
- **Crear clientes**: Registro de nuevos clientes frecuentes
- **Editar información**: Actualización de datos de clientes
- **Eliminar clientes**: Remoción de clientes del sistema
- **Búsqueda de clientes**: Filtrado por nombre, email o NIT
- **Paginación**: Navegación eficiente de la base de clientes

### Sistema de Fidelización
- **Niveles de fidelidad**: Clasificación automática por puntos
- **Acumulación de puntos**: Cálculo automático por compras
- **Descuentos especiales**: Beneficios por nivel de fidelidad
- **Estadísticas de clientes**: Análisis de comportamiento de compra

---

## 📊 Reportes y Análisis

### Reportes de Ventas
- **Ventas por período**: Análisis de ventas por fecha
- **Productos más vendidos**: Top 10 de medicamentos por cantidad
- **Análisis de ingresos**: Cálculo de ingresos por producto
- **Ventas diarias**: Evolución de ventas día a día
- **Promedio de ventas**: Cálculos estadísticos de rendimiento

### Análisis de Métodos de Pago
- **Distribución por método**: Gráficos de torta con porcentajes
- **Análisis de transacciones**: Cantidad de operaciones por método
- **Comparación de montos**: Valores totales por método de pago
- **Tendencias de pago**: Evolución de preferencias de pago

### Reportes Visuales
- **Gráficos interactivos**: Visualización de datos con Chart.js
- **Filtros de fecha**: Selección de períodos específicos
- **Exportación de datos**: Preparación para exportar reportes
- **Comparativas**: Análisis de períodos anteriores

---

## 💼 Arqueo de Caja Diario

### Cierre de Caja
- **Conteo de efectivo**: Registro por denominación boliviana
- **Ingresos por QR**: Registro de pagos digitales
- **Cálculo automático**: Suma total de efectivo y QR
- **Notas del arqueo**: Observaciones del cierre diario
- **Validación diaria**: Prevención de duplicados por fecha

### Gestión de Denominaciones
- **Billetes bolivianos**: Bs 200, 100, 50, 20, 10, 5, 2, 1
- **Monedas bolivianas**: Bs 0.50, 0.20, 0.10
- **Cálculo automático**: Subtotal por denominación
- **Total consolidado**: Suma total de efectivo más QR

### Historial de Arqueos
- **Registro histórico**: Todos los arqueos realizados
- **Filtros por fecha**: Búsqueda de arqueos específicos
- **Paginación**: Navegación eficiente del historial
- **Información del usuario**: Registro de quién realizó el arqueo

---

## 📱 Dashboard y Estadísticas

### Panel Principal
- **Bienvenida personalizada**: Saludo con nombre del usuario
- **Información del usuario**: Datos del usuario actual
- **Accesos rápidos**: Enlaces a funcionalidades principales
- **Estado del sistema**: Información de conectividad

### Estadísticas Generales
- **Total de medicamentos**: Cantidad en catálogo
- **Total de lotes**: Cantidad de lotes registrados
- **Stock total**: Unidades disponibles
- **Alertas de vencimiento**: Lotes próximos a vencer
- **Métricas de ventas**: Resumen de rendimiento

### Navegación Rápida
- **Acceso directo**: Enlaces a módulos principales
- **Filtros por rol**: Funcionalidades según permisos
- **Búsqueda global**: Localización rápida de funciones
- **Responsive design**: Adaptación a todos los dispositivos

---

## 🔧 Funcionalidades Técnicas

### Gestión de Datos
- **Sincronización automática**: Actualización en tiempo real
- **Validación de datos**: Verificación de integridad
- **Backup automático**: Respaldo de información crítica
- **Paginación inteligente**: Carga eficiente de datos

### Interfaz de Usuario
- **Diseño responsive**: Adaptación móvil y desktop
- **Búsqueda con debounce**: Optimización de consultas
- **Componentes reutilizables**: Consistencia en la interfaz
- **Notificaciones**: Alerts y confirmaciones de acciones

### Seguridad y Permisos
- **Control de acceso**: Restricciones por rol
- **Validación de formularios**: Verificación de datos
- **Encriptación**: Protección de información sensible
- **Logs de actividad**: Registro de acciones del usuario

---

## 🎯 Flujo de Trabajo Principal

### Proceso de Venta Completo
1. **Búsqueda de medicamentos** en el catálogo
2. **Agregado al carrito** con validación de stock
3. **Selección de cliente** (frecuente o general)
4. **Aplicación de descuentos** por producto o cliente
5. **Selección de método de pago**
6. **Confirmación y procesamiento** de la venta
7. **Actualización automática** del inventario
8. **Generación de comprobante** de venta

### Gestión de Inventario
1. **Registro de medicamentos** en el catálogo
2. **Creación de lotes** con información completa
3. **Control de vencimientos** y alertas
4. **Seguimiento de stock** en tiempo real
5. **Reportes de inventario** y movimientos

### Administración Diaria
1. **Revisión del dashboard** con estadísticas
2. **Procesamiento de ventas** durante el día
3. **Gestión de clientes** y fidelización
4. **Arqueo de caja** al final del día
5. **Generación de reportes** para análisis

---

*Este sistema integral permite una gestión completa y eficiente de todos los aspectos operativos de una farmacia, proporcionando herramientas robustas para ventas, inventario, clientes y análisis financiero.*
