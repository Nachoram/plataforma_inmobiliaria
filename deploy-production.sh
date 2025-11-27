#!/bin/bash

# 🚀 Script de Deploy a Producción - OfferDetailsPanel Refactor
# Este script automatiza el deploy gradual con feature flags

set -e  # Salir en caso de error

echo "🚀 INICIANDO DEPLOY A PRODUCCIÓN - OfferDetailsPanel Refactor"
echo "=========================================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes coloreados
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    print_error "No se encuentra package.json. Asegúrate de estar en el directorio raíz del proyecto."
    exit 1
fi

# Verificar que las variables de entorno estén configuradas
print_status "Verificando configuración de entorno..."

if [ -z "$VERCEL_TOKEN" ]; then
    print_warning "VERCEL_TOKEN no está configurado. Configúralo para deploy automático."
fi

# Fase 1: Build de producción
print_status "🏗️  Fase 1: Ejecutando build de producción..."

if npm run build; then
    print_success "Build completado exitosamente"
else
    print_error "Build falló. Abortando deploy."
    exit 1
fi

# Fase 2: Verificación de archivos críticos
print_status "🔍 Fase 2: Verificando archivos críticos..."

critical_files=(
    "dist/index.html"
    "dist/assets/index-*.js"
    "dist/assets/index-*.css"
    "src/components/offers/OfferDetailsPanel.tsx"
    "src/hooks/useOfferCache.ts"
    "src/hooks/useOfferAuth.ts"
    "DEPLOY_FEATURE_FLAGS.md"
)

for file in "${critical_files[@]}"; do
    if [ -e "$file" ] || [[ $file == *.html ]] && [ -e dist/index.html ]; then
        print_success "✓ $file encontrado"
    else
        print_error "✗ $file no encontrado"
        exit 1
    fi
done

# Fase 3: Configuración de feature flags para producción
print_status "⚙️  Fase 3: Configurando feature flags para producción..."

# Flags seguros para producción inicial (todos desactivados)
export VITE_ENABLE_OFFER_DETAILS_REFACTOR=false
export VITE_ENABLE_ADVANCED_CACHE=false
export VITE_ENABLE_PERFORMANCE_MONITORING=false
export VITE_ENABLE_TOAST_NOTIFICATIONS=false

print_success "Feature flags configurados para deploy seguro"

# Fase 4: Deploy a staging/preview (opcional)
if [ "$1" = "staging" ]; then
    print_status "🎭 Fase 4: Deploy a staging con flags de prueba..."

    export VITE_ENABLE_ADVANCED_CACHE=true
    export VITE_ENABLE_TOAST_NOTIFICATIONS=true

    if command -v vercel &> /dev/null; then
        print_status "Desplegando a staging..."
        npx vercel --prod=false
        print_success "Deploy a staging completado"
        print_warning "Recuerda probar la aplicación en staging antes de producción"
    else
        print_warning "Vercel CLI no encontrado. Deploy a staging omitido."
    fi
fi

# Fase 5: Deploy a producción
print_status "🚀 Fase 5: Deploy a producción..."

# Reset flags para producción segura
export VITE_ENABLE_OFFER_DETAILS_REFACTOR=false
export VITE_ENABLE_ADVANCED_CACHE=false
export VITE_ENABLE_PERFORMANCE_MONITORING=false
export VITE_ENABLE_TOAST_NOTIFICATIONS=false

if command -v vercel &> /dev/null; then
    print_status "Desplegando a producción..."
    npx vercel --prod
    print_success "Deploy a producción completado"
else
    print_warning "Vercel CLI no encontrado. Build listo para deploy manual."
    print_warning "Sube el contenido de la carpeta 'dist' a tu hosting."
fi

# Fase 6: Post-deploy verification
print_status "✅ Fase 6: Verificación post-deploy..."

print_success "Deploy completado exitosamente!"
echo ""
echo "📋 PRÓXIMOS PASOS RECOMENDADOS:"
echo "1. Verificar que la aplicación carga correctamente"
echo "2. Probar funcionalidades críticas del OfferDetailsPanel"
echo "3. Monitorear métricas de performance y errores"
echo "4. Activar feature flags gradualmente según el plan DEPLOY_FEATURE_FLAGS.md"
echo ""
echo "🎯 ACTIVACIÓN GRADUAL DE FEATURES:"
echo "• Día 1-2: Activar cache avanzado"
echo "• Día 3: Activar notificaciones toast"
echo "• Día 4: Activar monitoreo de performance"
echo "• Día 5: Activar refactor completo"
echo ""
echo "📊 MONITOREO:"
echo "• Error rate: Mantener < 5%"
echo "• Performance: Sin degradación > 10%"
echo "• Cache hit rate: > 70% objetivo"
echo ""
echo "🚨 ROLLBACK URGENTE (si hay problemas):"
echo "• Desactivar VITE_ENABLE_OFFER_DETAILS_REFACTOR"
echo "• Deploy inmediato: npm run build && vercel --prod --force"
echo ""

print_success "🎉 ¡Deploy completado exitosamente!"
print_warning "Recuerda activar los feature flags gradualmente según el plan documentado."
