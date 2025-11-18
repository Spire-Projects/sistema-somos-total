# Solución: ERR_BLOCKED_BY_CLIENT en Firestore

## Problema
```
POST https://firestore.googleapis.com/.../Write/channel?...
net::ERR_BLOCKED_BY_CLIENT
```

## Causas Comunes

### 1. Extensiones del Navegador (Más Común)
Extensiones que bloquean la petición:
- ❌ uBlock Origin
- ❌ AdBlock / AdBlock Plus
- ❌ Privacy Badger
- ❌ Ghostery
- ❌ DuckDuckGo Privacy Essentials
- ❌ Brave Shield (si usas Brave)

**Solución:**
1. Desactiva las extensiones de bloqueo temporalmente
2. O agrega `firestore.googleapis.com` a la whitelist
3. O prueba en modo incógnito sin extensiones

### 2. Configuración del Navegador
- ❌ Bloqueador de contenido integrado
- ❌ Configuración de privacidad muy estricta
- ❌ DNS personalizado que bloquea rastreadores

**Solución (Chrome):**
```
Settings → Privacy and Security → 
Site Settings → Content → 
Allow for firestore.googleapis.com
```

### 3. Firewall Corporativo
Si estás en una red corporativa, puede estar bloqueando WebSockets.

**Solución:**
- Usar red personal
- Contactar al administrador de red

### 4. Antivirus/Firewall Local
Algunos antivirus bloquean conexiones WebSocket.

**Solución:**
- Agregar excepción para tu app
- Temporalmente desactivar para probar

## Solución Rápida (Testing)

### Opción 1: Modo Incógnito
```bash
# Chrome
Ctrl + Shift + N (Windows/Linux)
Cmd + Shift + N (Mac)

# Firefox  
Ctrl + Shift + P (Windows/Linux)
Cmd + Shift + P (Mac)
```

### Opción 2: Desactivar Extensiones Temporalmente
```
Chrome: chrome://extensions/
Firefox: about:addons
```

### Opción 3: Probar en Otro Navegador
Si funciona en otro navegador = problema de extensiones/configuración

## Verificar que NO sea un Problema de Código

### 1. Verifica la consola
```javascript
// Busca estos mensajes
✅ "🔄 Iniciando todas las replicaciones..."
✅ "✅ Todas las replicaciones iniciadas"

// NO debe haber:
❌ "❌ Error en replicación de..."
❌ "Firebase config error"
```

### 2. Verifica Firestore en Firebase Console
1. Ir a https://console.firebase.google.com/
2. Seleccionar proyecto: `desarrollo-en-la-nube-3e769`
3. Firestore Database → Data
4. Verificar que las colecciones existan

### 3. Verifica las Reglas de Firestore
```javascript
// Reglas demasiado restrictivas pueden causar problemas
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Asegúrate de que permiten lectura/escritura
    match /{document=**} {
      allow read, write: if true; // Para desarrollo
    }
  }
}
```

## Fix Aplicado en el Código

He corregido `startReplications.ts`:

**Antes:**
- Faltaban `categories` y `currency`
- Nombre incorrecto: `purchasedBox` → `purchases`

**Después:**
```typescript
replicateCollection("users", collections.users);
replicateCollection("clients", collections.clients);
replicateCollection("categories", collections.categories);       // ✅ Agregado
replicateCollection("daily_cash_closures", collections.daily_cash_closures);
replicateCollection("sales", collections.sales);
replicateCollection("products", collections.products);
replicateCollection("purchases", collections.purchases);        // ✅ Corregido
replicateCollection("nits", collections.nits);
replicateCollection("number_invoice_ranges", collections.number_invoice_ranges);
replicateCollection("manufacturers", collections.manufacturers);
replicateCollection("currency", collections.currency);          // ✅ Agregado
```

## Pasos para Resolver

### 1. Primero: Verifica Extensiones
```bash
1. Abre DevTools (F12)
2. Ve a la pestaña Network
3. Filtra por "firestore"
4. Intenta replicar
5. Si ves "blocked:other" = extensión bloqueando
```

### 2. Segundo: Prueba en Incógnito
```bash
1. Abre ventana incógnita
2. Navega a tu app
3. Si funciona = confirma que es una extensión
```

### 3. Tercero: Identifica la Extensión
```bash
1. Desactiva todas las extensiones
2. Activa una por una hasta encontrar la culpable
3. Configura whitelist para firestore.googleapis.com
```

### 4. Cuarto: Verifica Firestore Rules
```bash
1. Firebase Console → Firestore → Rules
2. Temporalmente usa reglas permisivas para testing
3. Publica las reglas
```

## Configuración Recomendada para Desarrollo

### 1. Extensiones Permitidas
Agrega a whitelist de uBlock/AdBlock:
```
@@||firestore.googleapis.com^$domain=localhost
@@||firestore.googleapis.com^$domain=127.0.0.1
```

### 2. Brave Browser
```
Settings → Shields → 
Shield settings for localhost → 
Trackers & ads blocking: Disabled
```

### 3. Chrome DevTools Override
```
DevTools → Network → 
Disable cache ✓
Preserve log ✓
```

## Verificación Post-Fix

Después de aplicar el fix, verifica en consola:

```javascript
// Debes ver TODAS estas líneas:
🔄 Iniciando todas las replicaciones...
✅ Todas las replicaciones iniciadas

// En Firestore (Firebase Console) debes ver:
✅ categories
✅ clients
✅ currency
✅ daily_cash_closures
✅ manufacturers
✅ nits
✅ number_invoice_ranges
✅ products
✅ purchases
✅ sales
✅ users
```

## TL;DR

**Causa más probable:** Extensión de bloqueo de anuncios

**Solución rápida:**
1. Modo incógnito
2. O desactivar uBlock/AdBlock
3. O agregar firestore.googleapis.com a whitelist

**Fix de código:** Ya aplicado ✅
