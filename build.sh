#!/bin/bash

# Script para build y distribución de FarmaApp

echo "🏗️  FARMAAPP BUILD SCRIPT"
echo "========================"

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para mostrar el paso actual
show_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

# Función para mostrar éxito
show_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Función para mostrar error
show_error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Limpiar builds anteriores
show_step "Limpiando builds anteriores..."
npm run clean
show_success "Limpieza completada"

# Instalar dependencias
show_step "Verificando dependencias..."
npm run install:all
show_success "Dependencias verificadas"

# Build del frontend
show_step "Construyendo frontend..."
npm run build:frontend || show_error "Error en build del frontend"
show_success "Frontend construido exitosamente"

# Generar ejecutables
show_step "Generando ejecutables para Windows..."
npm run package:win || show_error "Error generando ejecutables"
show_success "Ejecutables generados exitosamente"

# Mostrar resumen
echo ""
echo -e "${YELLOW}🎉 BUILD COMPLETADO EXITOSAMENTE${NC}"
echo "=================================="
echo ""
echo "📁 Archivos generados en: release/"
echo ""
ls -lh release/*.exe | while read line; do
    filename=$(echo $line | awk '{print $9}')
    size=$(echo $line | awk '{print $5}')
    echo -e "  📦 ${GREEN}$filename${NC} (${size})"
done
echo ""
echo -e "${BLUE}💡 Archivos principales:${NC}"
echo -e "  🚀 ${GREEN}FarmaApp-1.0.0-x64.exe${NC} - Versión portable 64 bits"
echo -e "  📦 ${GREEN}FarmaApp-1.0.0.exe${NC} - Instalador completo"
echo ""
echo -e "${YELLOW}🔧 Para desarrollo:${NC}"
echo "  npm run dev:frontend  # Frontend en desarrollo"
echo "  npm run dev:electron  # Electron en desarrollo"
echo "  npm run dev           # Todo junto"
echo ""
