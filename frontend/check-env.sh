#!/bin/bash

# Script para mostrar la configuración de entorno actual
echo "🔍 VERIFICACIÓN DE CONFIGURACIÓN DE ENTORNO"
echo "============================================="

# Detectar el puerto del servidor de desarrollo
PORT=$(ps aux | grep "vite" | grep -v grep | grep -o "localhost:[0-9]*" | head -1 | cut -d: -f2)

if [ -n "$PORT" ]; then
    echo "✅ Servidor de desarrollo ejecutándose en puerto: $PORT"
    echo "🌐 URL: http://localhost:$PORT"
else
    echo "❌ No se detectó servidor de desarrollo ejecutándose"
fi

echo ""
echo "📁 Archivos .env disponibles:"
ls -la .env* 2>/dev/null | while read line; do
    echo "   $line"
done

echo ""
echo "🔧 Configuración que se cargará según modo:"
echo ""

# Mostrar contenido relevante de cada archivo
echo "📝 .env (base):"
grep "VITE_APP_MODE\|VITE_JWT_SECRET" .env 2>/dev/null | sed 's/^/   /' || echo "   (archivo no encontrado)"

echo ""
echo "🛠️  .env.development (desarrollo):"
grep "VITE_APP_MODE\|VITE_JWT_SECRET\|VITE_DEBUG" .env.development 2>/dev/null | sed 's/^/   /' || echo "   (archivo no encontrado)"

echo ""
echo "🚀 .env.production (producción):"
grep "VITE_APP_MODE\|VITE_JWT_SECRET\|VITE_DEBUG" .env.production 2>/dev/null | sed 's/^/   /' || echo "   (archivo no encontrado)"

echo ""
echo "🏠 .env.local (local personal):"
grep "VITE_APP_MODE\|VITE_JWT_SECRET\|VITE_DEBUG" .env.local 2>/dev/null | sed 's/^/   /' || echo "   (archivo no encontrado)"

echo ""
echo "📋 Comandos disponibles:"
echo "   npm run dev          - Desarrollo normal"
echo "   npm run dev:local    - Desarrollo forzando modo local"
echo "   npm run dev:production - Desarrollo con config de producción"
echo "   npm run build        - Build de producción"
echo "   npm run build:local  - Build con config de desarrollo"

echo ""
echo "💡 Para ver la configuración cargada en tiempo real:"
echo "   Abre http://localhost:$PORT en el navegador y revisa la consola"
