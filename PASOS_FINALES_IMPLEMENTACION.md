# 🚀 Pasos Finales para Implementar el Sistema

## Estado Actual

✅ **Todo el código está listo**:
- Base de datos: Migración creada
- Backend: Webhook actualizado
- Frontend: Componentes listos
- Documentación: Completa

## Checklist de Implementación

### 1. Base de Datos (5 minutos)

```bash
# Opción A: Usando Supabase CLI
supabase db push

# Opción B: SQL directo
psql -U postgres -d tu_base_datos \
  -f supabase/migrations/20251003190000_add_contract_html_column.sql
```

**Verificar**:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'rental_contracts' 
  AND column_name IN ('contract_html', 'contract_format', 'contract_number');
```

### 2. Edge Function (5 minutos)

```bash
# Desplegar función actualizada
supabase functions deploy receive-contract-webhook

# Configurar secret
supabase secrets set WEBHOOK_SECRET=tu-secret-seguro-aqui
```

**Verificar**:
- Ir a Supabase Dashboard → Edge Functions
- Verificar que `receive-contract-webhook` existe y está actualizada
- Verificar que `WEBHOOK_SECRET` está configurado en Secrets

### 3. Frontend (2 minutos)

```bash
# Instalar dependencias (si faltan)
npm install

# Compilar
npm run build

# O correr en desarrollo
npm run dev
```

**Verificar**:
- No hay errores de TypeScript
- La aplicación se compila correctamente
- El componente `HTMLContractViewer` se importa sin errores

### 4. Agregar Ruta de Visualización (si falta) (1 minuto)

Verificar en `src/components/AppContent.tsx` que existe:

```typescript
<Route path="/contract/:id" element={
  <ProtectedRoute>
    <Layout>
      <ContractViewerPage />
    </Layout>
  </ProtectedRoute>
} />
```

Si no existe, agregar después de las otras rutas de contratos.

### 5. Testing Local (10 minutos)

#### Test 1: Insertar Contrato de Prueba

```bash
node test_insert_html_contract.js
```

**Resultado esperado**:
```
✅ Contrato insertado exitosamente!
   ID: abc123...
   Número: CTR-20251003-000001
```

#### Test 2: Visualizar en el Frontend

```bash
npm run dev
# Abrir: http://localhost:5173/contract/[el-id-del-paso-anterior]
```

**Debería mostrar**:
- Contrato HTML formateado
- Controles de zoom funcionando
- Botones de imprimir y descargar

#### Test 3: Probar Webhook (opcional)

```bash
curl -X POST http://localhost:54321/functions/v1/receive-contract-webhook \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: tu-secret" \
  -d @test_webhook_payload.json
```

### 6. Configurar N8N (15 minutos)

#### Paso A: Crear Nodo HTTP Request

En tu workflow de N8N:

1. **Agregar nodo**: HTTP Request
2. **Configurar**:
   - Method: `POST`
   - URL: `https://tu-proyecto.supabase.co/functions/v1/receive-contract-webhook`

3. **Headers**:
   ```
   Content-Type: application/json
   x-webhook-secret: [tu-secret-configurado-en-supabase]
   ```

4. **Body** (JSON):
   ```json
   {
     "html": "{{$node['GenerateHTML'].json.html}}",
     "applicationId": "{{$json.application_id}}",
     "userId": "{{$json.user_id}}",
     "propertyId": "{{$json.property_id}}",
     "workflowId": "contrato_arriendo"
   }
   ```

#### Paso B: Crear Nodo de Generación HTML

Antes del HTTP Request, agregar un nodo "Code" o "Function":

```javascript
// Nodo: Generate HTML
const applicationData = items[0].json;

const html = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Contrato de Arrendamiento</title>
    <style>
        body { font-family: 'Times New Roman', Times, serif; margin: 50px; font-size: 12pt; }
        h1 { text-align: center; font-size: 14pt; }
        h2 { text-align: left; font-size: 12pt; text-decoration: underline; }
        p { text-align: justify; line-height: 1.6; margin-bottom: 1.2em; }
        strong { font-weight: bold; }
        .signature-block { margin-top: 60px; page-break-inside: avoid; }
        .signature-line { margin-top: 70px; border-top: 1px solid black; width: 250px; }
        .signature-title { text-align: center; }
    </style>
</head>
<body>
    <h1>CONTRATO DE ARRENDAMIENTO</h1>
    
    <p>En ${applicationData.city}, a ${new Date().toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}, entre <strong>${applicationData.owner_name}</strong>, 
    cédula de identidad N° <strong>${applicationData.owner_rut}</strong>, 
    en adelante "el Arrendador"; y <strong>${applicationData.tenant_name}</strong>, 
    cédula de identidad N° <strong>${applicationData.tenant_rut}</strong>, 
    en adelante "el Arrendatario", se ha convenido en el siguiente contrato de arrendamiento:</p>

    <h2>PRIMERO: PROPIEDAD ARRENDADA</h2>
    <p>El Arrendador da en arrendamiento al Arrendatario el inmueble ubicado en 
       <strong>${applicationData.property_address}</strong>. 
       Se deja constancia que la propiedad se arrienda con sus servicios de luz, agua, gas y gastos comunes al día.</p>
    
    <h2>SEGUNDO: RENTA DE ARRENDAMIENTO</h2>
    <p>La renta mensual de arrendamiento será la suma de <strong>$${applicationData.monthly_rent}</strong>. 
       El Arrendatario se obliga a pagar dicha renta por mesadas anticipadas, 
       dentro de los primeros cinco días de cada mes.</p>
    
    <h2>TERCERO: DURACIÓN DEL CONTRATO</h2>
    <p>El presente contrato de arrendamiento tendrá una duración de <strong>${applicationData.lease_term_months} meses</strong>.</p>
    
    <h2>CUARTO: GARANTÍA</h2>
    <p>A fin de garantizar la conservación de la propiedad, el Arrendatario entrega en este acto al Arrendador 
       a título de garantía la suma de <strong>$${applicationData.guarantee_amount}</strong>.</p>
    
    ${applicationData.has_guarantor ? `
    <h2>QUINTO: CODEUDOR SOLIDARIO (AVAL)</h2>
    <p>Comparece como codeudor solidario de todas las obligaciones del Arrendatario, 
       <strong>${applicationData.guarantor_name}</strong>, 
       cédula de identidad N° <strong>${applicationData.guarantor_rut}</strong>.</p>
    ` : ''}

    <div class="signature-block">
        <div class="signature-title">
            <div class="signature-line"></div>
            <strong>${applicationData.owner_name}</strong><br>
            C.I. ${applicationData.owner_rut}<br>
            ARRENDADOR
        </div>
    </div>
    
    <div class="signature-block">
        <div class="signature-title">
            <div class="signature-line"></div>
            <strong>${applicationData.tenant_name}</strong><br>
            C.I. ${applicationData.tenant_rut}<br>
            ARRENDATARIO
        </div>
    </div>
    
    ${applicationData.has_guarantor ? `
    <div class="signature-block">
        <div class="signature-title">
            <div class="signature-line"></div>
            <strong>${applicationData.guarantor_name}</strong><br>
            C.I. ${applicationData.guarantor_rut}<br>
            CODEUDOR SOLIDARIO
        </div>
    </div>
    ` : ''}
</body>
</html>`;

return { html };
```

#### Paso C: Verificar Datos de Entrada

Asegurarse de que el workflow obtiene estos datos antes:
- `application_id` (UUID)
- `user_id` / `owner_id` (UUID)
- `property_id` (UUID)
- `owner_name`, `owner_rut`
- `tenant_name`, `tenant_rut`
- `property_address`
- `monthly_rent`
- `lease_term_months`
- `guarantee_amount`
- `guarantor_name`, `guarantor_rut` (opcionales)

### 7. Probar Flujo Completo (10 minutos)

1. **Desde N8N**:
   - Ejecutar workflow manualmente
   - Verificar que retorna success: true
   - Copiar `rentalContractId` de la respuesta

2. **En la Base de Datos**:
   ```sql
   SELECT 
     id, 
     contract_number, 
     contract_format,
     LENGTH(contract_html) as html_length,
     status
   FROM rental_contracts
   ORDER BY created_at DESC
   LIMIT 1;
   ```

3. **En el Frontend**:
   - Ir a `/contract/[el-id-obtenido]`
   - Verificar que se visualiza correctamente
   - Probar controles de zoom
   - Probar imprimir
   - Probar descargar

## Validación Final

### Checklist de Funcionamiento

- [ ] Migración aplicada sin errores
- [ ] Edge Function desplegada y con secret configurado
- [ ] Frontend compila sin errores de TypeScript
- [ ] Script de prueba inserta contrato correctamente
- [ ] Contrato de prueba se visualiza en `/contract/:id`
- [ ] N8N puede enviar HTML al webhook
- [ ] Webhook retorna success: true y rentalContractId
- [ ] Contrato desde N8N se visualiza en frontend
- [ ] Zoom funciona correctamente
- [ ] Imprimir funciona correctamente
- [ ] Descargar funciona correctamente

## Monitoreo y Debugging

### Logs a Revisar

1. **Edge Function Logs**:
   - Supabase Dashboard → Edge Functions → receive-contract-webhook → Logs
   - Buscar: ❌ errores o ✅ success

2. **Browser Console**:
   - Abrir DevTools (F12)
   - Ver errores de carga del iframe
   - Ver errores de red

3. **Base de Datos**:
   ```sql
   -- Ver contratos recientes
   SELECT * FROM rental_contracts 
   ORDER BY created_at DESC LIMIT 5;
   
   -- Ver logs de workflow_outputs
   SELECT * FROM workflow_outputs 
   ORDER BY created_at DESC LIMIT 5;
   ```

### Problemas Comunes y Soluciones

| Problema | Causa Probable | Solución |
|----------|---------------|----------|
| Webhook retorna 401 | Secret incorrecto | Verificar `x-webhook-secret` en headers |
| "contract_content cannot be null" | Migración no aplicada | Ejecutar migración SQL |
| Contrato no se visualiza | contract_format incorrecto | Debe ser 'html' o 'hybrid' |
| Iframe en blanco | HTML incompleto | Verificar DOCTYPE, head, body |
| Error al crear contract | applicationId inválido | Verificar que la aplicación existe |

## Siguientes Pasos Después de Implementar

1. **Integrar con Firma Electrónica**:
   - Usar el HTML generado para envío a firma
   - Actualizar `ContractApprovalWorkflow.tsx`

2. **Agregar Más Plantillas**:
   - Crear variaciones del contrato
   - Permitir selección de plantilla en N8N

3. **Versionado de Contratos**:
   - Guardar historial de cambios
   - Permitir comparación de versiones

4. **Export a PDF**:
   - Agregar Edge Function para convertir HTML → PDF
   - Usar puppeteer o similar

## Soporte

Si encuentras problemas:

1. Revisar documentación en `GUIA_INTEGRACION_N8N_HTML.md`
2. Verificar logs en Supabase Dashboard
3. Revisar payload enviado desde N8N
4. Consultar tabla `workflow_outputs` para debugging

## ¡Listo para Producción!

Una vez completado este checklist:
- ✅ El sistema está listo para recibir contratos desde N8N
- ✅ Los contratos se almacenan correctamente
- ✅ Los usuarios pueden visualizarlos en la plataforma
- ✅ Todos los controles funcionan (zoom, imprimir, descargar)

🎉 **¡Implementación completa!**

