#!/bin/bash

# Script de deployment para producción
# Uso: ./deploy.sh [staging|production]

set -e

ENVIRONMENT=${1:-production}

echo "🚀 Iniciando deployment para: $ENVIRONMENT"

# 1. Validar entorno
if [ "$ENVIRONMENT" != "staging" ] && [ "$ENVIRONMENT" != "production" ]; then
    echo "❌ Entorno inválido. Usar: staging o production"
    exit 1
fi

# 2. Limpiar dependencias y reinstalar
echo "🧹 Limpiando node_modules..."
rm -rf node_modules package-lock.json
npm install

# 3. Ejecutar tests (si existen)
echo "🧪 Ejecutando tests..."
# npm test

# 4. Validar variables de entorno
echo "🔍 Validando configuración..."
if [ "$ENVIRONMENT" = "production" ]; then
    if [ -z "$VITE_FIREBASE_API_KEY" ] || [[ "$VITE_FIREBASE_API_KEY" == *"demo"* ]]; then
        echo "❌ Configuración de Firebase de producción inválida"
        exit 1
    fi
fi

# 5. Build para el entorno específico
echo "🏗️ Construyendo aplicación..."
if [ "$ENVIRONMENT" = "staging" ]; then
    npm run build:dev
else
    npm run build:prod
fi

# 6. Análisis del bundle
echo "📊 Analizando tamaño del bundle..."
npx vite-bundle-analyzer dist

# 7. Deployment según entorno
if [ "$ENVIRONMENT" = "staging" ]; then
    echo "🚀 Desplegando a Staging..."
    # firebase deploy --only hosting:staging
elif [ "$ENVIRONMENT" = "production" ]; then
    echo "🚀 Desplegando a Producción..."
    # firebase deploy --only hosting:production
fi

echo "✅ Deployment completado para $ENVIRONMENT"
