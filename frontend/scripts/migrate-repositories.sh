#!/bin/bash

# Script para migrar todos los repositorios a usar BaseRepository
# y las funciones de sincronización con prioridad

REPO_DIR="/home/mauricio/Documentos/JOB/FarmaApp/POCS/MonoRepoApp/frontend/src/shared/db/repositories"

echo "🔄 Migrando repositorios a BaseRepository..."

# Lista de repositorios a migrar (excluyendo los que ya migramos)
repositories=(
    "activeIngredient.repository.ts"
    "category.repository.ts" 
    "client.repository.ts"
    "dailyCashClosure.repository.ts"
    "genericName.repository.ts"
    "manufacturer.repository.ts"
    "medic.repository.ts"
    "medicationBatch.repository.ts"
    "pharmaceuticalForm.repository.ts"
    "sale.repository.ts"
    "user.repository.ts"
)

for repo in "${repositories[@]}"; do
    if [ -f "$REPO_DIR/$repo" ]; then
        echo "📝 Procesando $repo..."
        
        # Backup del archivo original
        cp "$REPO_DIR/$repo" "$REPO_DIR/$repo.backup"
        
        # Agregar import de BaseRepository (solo si no existe)
        if ! grep -q "import.*BaseRepository" "$REPO_DIR/$repo"; then
            sed -i '/import.*RxCollection/a import { BaseRepository } from '\''./BaseRepository'\'';' "$REPO_DIR/$repo"
        fi
        
        echo "✅ $repo procesado"
    else
        echo "⚠️  $repo no encontrado"
    fi
done

echo "✅ Migración completada!"
echo ""
echo "🔍 Pasos siguientes:"
echo "1. Revisar cada repositorio y cambiar 'implements' por 'extends BaseRepository<TuTipo>'"
echo "2. Cambiar métodos create(), update(), delete() para usar:"
echo "   - this.createWithPriority(data)"
echo "   - this.updateWithPriority(id, data)" 
echo "   - this.deleteWithPriority(id)"
echo "3. Cambiar getCollection() de private a protected"
echo ""
echo "💡 Ejemplo para Client repository:"
echo "   export class LocalClientDB extends BaseRepository<Client> implements IClientRepository {"
echo "   protected async getCollection() { ... }"
echo "   async create(data) { return await this.createWithPriority(data); }"
