@echo off
REM ============================================
REM Script para crear archivo .env automáticamente
REM Resuelve el problema del webhook de contratos
REM ============================================

echo Creando archivo .env con configuración de webhooks...

REM Crear el archivo .env con la configuración correcta
(
echo # ======================================
echo # CONFIGURACIÓN DE VARIABLES DE ENTORNO
echo # ======================================
echo # Archivo generado automáticamente por create-env.bat
echo # Fecha: 29 de octubre de 2025
echo.
echo # ======================================
echo # SUPABASE CONFIGURATION
echo # ======================================
echo VITE_SUPABASE_URL=https://phnkervuiijqmapgswkc.supabase.co
echo VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w
echo.
echo # ======================================
echo # WEBHOOK CONFIGURATION
echo # ======================================
echo.
echo # Railway Webhook - Notificaciones de aplicaciones, ofertas, etc.
echo # Este webhook ya envía parámetros planos (refactorizado)
echo VITE_RAILWAY_WEBHOOK_URL=https://primary-production-bafdc.up.railway.app/webhook/8e33ac40-acdd-4baf-a0dc-c2b7f0b886eb
echo.
echo # N8N Contract Webhook - Generación de contratos PDF
echo # ✅ CONFIGURADO: Usando el mismo webhook de Railway para contratos
echo # ⚠️ IMPORTANTE: Esta variable es REQUERIDA para generar contratos
echo VITE_N8N_CONTRACT_WEBHOOK_URL=https://primary-production-bafdc.up.railway.app/webhook/8e33ac40-acdd-4baf-a0dc-c2b7f0b886eb
echo.
echo # Webhook Secret - Opcional, para autenticación adicional
echo # VITE_WEBHOOK_SECRET=tu-secret-aqui
echo.
echo # ======================================
echo # NOTAS
echo # ======================================
echo # - El webhook de contratos ahora apunta al mismo endpoint de Railway
echo # - Reinicia el servidor de desarrollo después de crear este archivo
echo # - Para desarrollo: npm run dev
echo # ======================================
) > .env

echo ✅ Archivo .env creado exitosamente!
echo.
echo 📋 Próximos pasos:
echo 1. Reinicia tu servidor de desarrollo (npm run dev)
echo 2. Intenta generar un contrato nuevamente
echo 3. Si no funciona, verifica que el webhook de Railway esté configurado para manejar contratos
echo.
echo 🔍 Verificación: Abre la consola del navegador y ejecuta:
echo console.log('Contract Webhook:', import.meta.env.VITE_N8N_CONTRACT_WEBHOOK_URL);
echo.
echo Deberías ver: https://primary-production-bafdc.up.railway.app/webhook/8e33ac40-acdd-4baf-a0dc-c2b7f0b886eb
echo.
pause
