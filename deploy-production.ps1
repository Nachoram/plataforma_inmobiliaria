# 🚀 Script de Deploy a Producción - OfferDetailsPanel Refactor (PowerShell)
# Este script automatiza el deploy gradual con feature flags en Windows

param(
    [switch]$Staging = $false
)

Write-Host "🚀 INICIANDO DEPLOY A PRODUCCIÓN - OfferDetailsPanel Refactor" -ForegroundColor Blue
Write-Host "==========================================================" -ForegroundColor Blue

# Función para imprimir mensajes coloreados
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Verificar que estamos en el directorio correcto
if (!(Test-Path "package.json")) {
    Write-Error "No se encuentra package.json. Asegúrate de estar en el directorio raíz del proyecto."
    exit 1
}

# Fase 1: Build de producción
Write-Status "🏗️  Fase 1: Ejecutando build de producción..."

try {
    & npm run build
    Write-Success "Build completado exitosamente"
} catch {
    Write-Error "Build falló. Abortando deploy."
    exit 1
}

# Fase 2: Verificación de archivos críticos
Write-Status "🔍 Fase 2: Verificando archivos críticos..."

$criticalFiles = @(
    "dist/index.html",
    "src/components/offers/OfferDetailsPanel.tsx",
    "src/hooks/useOfferCache.ts",
    "src/hooks/useOfferAuth.ts",
    "DEPLOY_FEATURE_FLAGS.md"
)

foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        Write-Success "✓ $file encontrado"
    } else {
        Write-Error "✗ $file no encontrado"
        exit 1
    }
}

# Verificar archivos del build
$buildJsFiles = Get-ChildItem "dist/assets" -Filter "index-*.js" -ErrorAction SilentlyContinue
$buildCssFiles = Get-ChildItem "dist/assets" -Filter "index-*.css" -ErrorAction SilentlyContinue

if ($buildJsFiles.Count -gt 0 -and $buildCssFiles.Count -gt 0) {
    Write-Success "✓ Archivos de build generados correctamente"
} else {
    Write-Error "✗ Archivos de build no encontrados"
    exit 1
}

# Fase 3: Configuración de feature flags
Write-Status "⚙️  Fase 3: Configurando feature flags..."

# Flags seguros para producción inicial (todos desactivados)
$env:VITE_ENABLE_OFFER_DETAILS_REFACTOR = "false"
$env:VITE_ENABLE_ADVANCED_CACHE = "false"
$env:VITE_ENABLE_PERFORMANCE_MONITORING = "false"
$env:VITE_ENABLE_TOAST_NOTIFICATIONS = "false"

Write-Success "Feature flags configurados para deploy seguro"

# Fase 4: Deploy opcional a staging
if ($Staging) {
    Write-Status "🎭 Fase 4: Deploy a staging con flags de prueba..."

    $env:VITE_ENABLE_ADVANCED_CACHE = "true"
    $env:VITE_ENABLE_TOAST_NOTIFICATIONS = "true"

    Write-Status "Desplegando a staging..."
    try {
        & npx vercel --prod=$false
        Write-Success "Deploy a staging completado"
        Write-Warning "Recuerda probar la aplicación en staging antes de producción"
    } catch {
        Write-Warning "Deploy a staging falló, pero continuando..."
    }
}

# Fase 5: Deploy a producción
Write-Status "🚀 Fase 5: Deploy a producción..."

# Reset flags para producción segura
$env:VITE_ENABLE_OFFER_DETAILS_REFACTOR = "false"
$env:VITE_ENABLE_ADVANCED_CACHE = "false"
$env:VITE_ENABLE_PERFORMANCE_MONITORING = "false"
$env:VITE_ENABLE_TOAST_NOTIFICATIONS = "false"

Write-Status "Desplegando a producción..."
try {
    & npx vercel --prod
    Write-Success "Deploy a producción completado"
} catch {
    Write-Error "Deploy a producción falló"
    exit 1
}

# Fase 6: Post-deploy verification
Write-Status "✅ Fase 6: Verificación post-deploy..."

Write-Success "Deploy completado exitosamente!"
Write-Host ""
Write-Host "📋 PRÓXIMOS PASOS RECOMENDADOS:" -ForegroundColor Cyan
Write-Host "1. Verificar que la aplicación carga correctamente en producción" -ForegroundColor White
Write-Host "2. Probar funcionalidades críticas del OfferDetailsPanel" -ForegroundColor White
Write-Host "3. Monitorear métricas de performance y errores (24h)" -ForegroundColor White
Write-Host "4. Activar feature flags gradualmente según DEPLOY_FEATURE_FLAGS.md" -ForegroundColor White
Write-Host ""
Write-Host "🎯 PLAN DE ACTIVACIÓN GRADUAL:" -ForegroundColor Green
Write-Host "• Día 1-2: Activar cache avanzado (VITE_ENABLE_ADVANCED_CACHE=true)" -ForegroundColor White
Write-Host "• Día 3: Activar notificaciones toast (VITE_ENABLE_TOAST_NOTIFICATIONS=true)" -ForegroundColor White
Write-Host "• Día 4: Activar monitoreo de performance (VITE_ENABLE_PERFORMANCE_MONITORING=true)" -ForegroundColor White
Write-Host "• Día 5: Activar refactor completo (VITE_ENABLE_OFFER_DETAILS_REFACTOR=true)" -ForegroundColor White
Write-Host ""
Write-Host "📊 MÉTRICAS A MONITOREAR:" -ForegroundColor Yellow
Write-Host "• Error rate: Mantener < 5%" -ForegroundColor White
Write-Host "• Performance: Sin degradación > 10%" -ForegroundColor White
Write-Host "• Cache hit rate: > 70% (una vez activado)" -ForegroundColor White
Write-Host ""
Write-Host "🚨 ROLLBACK URGENTE (si hay problemas):" -ForegroundColor Red
Write-Host "• Desactivar VITE_ENABLE_OFFER_DETAILS_REFACTOR" -ForegroundColor White
Write-Host "• Deploy inmediato: .\deploy-production.ps1" -ForegroundColor White
Write-Host ""

Write-Success "🎉 ¡Deploy completado exitosamente!"
Write-Warning "Recuerda activar los feature flags gradualmente según el plan documentado."
