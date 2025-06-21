# 🏥 Inicialización de Datos - FarmaApp

Este documento explica cómo cargar los datos iniciales comunes para la aplicación de farmacia.

## 📋 ¿Qué datos se cargan?

### 🧪 Ingredientes Activos (30 medicamentos comunes)
- **Analgésicos**: Paracetamol, Ibuprofeno, Ácido acetilsalicílico, Diclofenaco, Naproxeno
- **Antibióticos**: Amoxicilina, Azitromicina, Ciprofloxacino, Ampicilina, Cefalexina
- **Antihistamínicos**: Loratadina, Cetirizina, Difenhidramina
- **Antihipertensivos**: Enalapril, Losartán, Amlodipino, Metoprolol
- **Antidiabéticos**: Metformina, Glibenclamida, Insulina
- **Vitaminas**: Ácido ascórbico (Vit C), Colecalciferol (Vit D3), Ácido fólico, Complejo B
- **Otros**: Omeprazol, Simvastatina, Salbutamol, Dextrometorfano, Hidroclorotiazida, Captopril

### 🏷️ Categorías de Medicamentos (15 categorías)
- Analgésicos y Antiinflamatorios
- Antibióticos
- Antihistamínicos
- Antihipertensivos
- Antidiabéticos
- Vitaminas y Suplementos
- Gastrointestinales
- Respiratorios
- Cardiovasculares
- Dermatológicos
- Neurológicos
- Oftalmológicos
- Anticonceptivos
- Pediatría
- Geriatría

### 💊 Formas Farmacéuticas (15 formas)
- Tableta/Comprimido
- Cápsula
- Jarabe
- Suspensión
- Inyección/Ampolla
- Crema/Pomada
- Gel
- Gotas
- Aerosol/Spray/Inhalador
- Supositorio
- Parche transdérmico
- Polvo
- Solución
- Emulsión/Loción
- Ungüento

### 🏭 Fabricantes (10 laboratorios)
- Laboratorios Bago (Argentina)
- Genfar (Colombia)
- Tecnoquímicas (Colombia)
- Pfizer (Estados Unidos)
- Novartis (Suiza)
- Bayer (Alemania)
- Roche (Suiza)
- Johnson & Johnson (Estados Unidos)
- GSK (Reino Unido)
- Sanofi (Francia)

## 🚀 Métodos de Carga

### 1. Automático al Iniciar la Aplicación
Los datos se cargan automáticamente la primera vez que inicias la aplicación en cada sesión del navegador.

### 2. Comando Manual - Cargar Todos los Datos
```bash
npm run init-data:all
```

### 3. Comandos Específicos

#### Cargar solo datos de medicamentos
```bash
npm run init-data:medications
```

#### Cargar solo ingredientes activos
```bash
npm run init-data:ingredients
```

#### Cargar solo categorías
```bash
npm run init-data:categories
```

#### Cargar solo formas farmacéuticas
```bash
npm run init-data:forms
```

#### Cargar solo fabricantes
```bash
npm run init-data:manufacturers
```

#### Ver ayuda completa
```bash
npm run init-data help
```

## 🔧 Funcionamiento

### 🛡️ Protección contra Duplicados
- El sistema verifica automáticamente si los datos ya existen
- No se crearán duplicados si ya tienes datos cargados
- Muestra un resumen de cuántos elementos se crearon vs. cuántos ya existían

### 📊 Salida del Comando
```bash
🧪 Ingredientes activos: 25 creados, 5 ya existían
🏷️  Categorías: 15 creadas, 0 ya existían
💊 Formas farmacéuticas: 15 creadas, 0 ya existían
🏭 Fabricantes: 10 creados, 0 ya existían
✅ Datos de medicamentos inicializados correctamente
```

### 🗃️ Base de Datos
- **Modo Local**: Los datos se guardan en IndexedDB usando RxDB + Dexie
- **Modo Cloud**: Los datos se sincronizan con Firestore (cuando esté implementado)
- El modo se configura automáticamente según la variable `VITE_APP_MODE`

## ⚠️ Importante

- Los datos se crean con `createdBy: 'system'` para identificarlos como datos del sistema
- Se ejecuta solo una vez por sesión del navegador para evitar cargas innecesarias
- Si necesitas recargar los datos, cierra y abre el navegador, o usa los comandos manuales

## 🎯 Casos de Uso

### Primera vez usando la aplicación
1. Inicia la aplicación con `npm run dev`
2. Los datos se cargan automáticamente
3. ¡Listo para usar!

### Agregar datos adicionales más tarde
```bash
npm run init-data:medications
```

### Resetear datos (eliminar y volver a cargar)
1. Elimina los datos manualmente desde la aplicación
2. Ejecuta: `npm run init-data:medications`

---

¿Tienes preguntas? ¡Revisa la consola del navegador para ver el progreso de la carga de datos!
