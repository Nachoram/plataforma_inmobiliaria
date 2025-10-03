# Guía: N8N Insertando HTML Directamente a Supabase

## Arquitectura Simplificada

```
N8N Workflow
  ↓ (genera HTML)
  ↓
Supabase Insert (nodo de N8N)
  ↓
rental_contracts table
  ├── contract_html (tu HTML aquí)
  ├── contract_format = 'html'
  └── application_id (relación con aplicación)
  ↓
Frontend lee y muestra
```

## Configuración en N8N

### Opción 1: Nodo Supabase (Recomendado)

#### Paso 1: Agregar Nodo Supabase

1. En tu workflow, agregar nodo: **Supabase**
2. Configurar credenciales:
   - **Supabase URL**: Tu URL de proyecto (ej: `https://abc123.supabase.co`)
   - **Service Role Key**: Desde Supabase Dashboard → Settings → API → service_role key

#### Paso 2: Configurar Operación

**Operation**: `Insert`
**Table**: `rental_contracts`

#### Paso 3: Mapear Campos

```json
{
  "application_id": "{{$json.application_id}}",
  "contract_html": "{{$json.html}}",
  "contract_format": "html",
  "status": "draft",
  "created_by": "{{$json.user_id}}",
  "contract_content": null
}
```

**Campos Obligatorios**:
- ✅ `application_id` - UUID de la aplicación aprobada
- ✅ `contract_html` - Tu HTML completo
- ✅ `contract_format` - Siempre 'html'
- ✅ `status` - 'draft', 'approved', etc.

**Campos Opcionales**:
- `created_by` - UUID del usuario que crea
- `contract_content` - Puede ser null si usas HTML
- `notes` - Notas adicionales

#### Ejemplo Visual en N8N:

```
┌─────────────────────────────────────┐
│  Nodo: Supabase                     │
├─────────────────────────────────────┤
│  Resource: Table Row                │
│  Operation: Insert                  │
│  Table: rental_contracts            │
│                                     │
│  Fields:                            │
│  ┌───────────────────────────────┐ │
│  │ application_id               │ │
│  │ {{$json.application_id}}     │ │
│  ├───────────────────────────────┤ │
│  │ contract_html                │ │
│  │ {{$node["HTML"].json.html}}  │ │
│  ├───────────────────────────────┤ │
│  │ contract_format              │ │
│  │ html                         │ │
│  ├───────────────────────────────┤ │
│  │ status                       │ │
│  │ draft                        │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Opción 2: HTTP Request (Manual)

Si prefieres usar HTTP Request directamente:

```json
{
  "method": "POST",
  "url": "https://tu-proyecto.supabase.co/rest/v1/rental_contracts",
  "headers": {
    "apikey": "tu-service-role-key",
    "Authorization": "Bearer tu-service-role-key",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
  },
  "body": {
    "application_id": "{{$json.application_id}}",
    "contract_html": "{{$json.html}}",
    "contract_format": "html",
    "status": "draft",
    "created_by": "{{$json.user_id}}"
  }
}
```

## Workflow Completo Recomendado

### Estructura del Workflow

```
1. Trigger (Manual/Webhook/Schedule)
   ↓
2. Get Application Data
   - Nodo: Supabase → Select
   - Table: applications
   - Filters: id = {{$json.application_id}}
   ↓
3. Get Related Data
   - Properties
   - Profiles (owner, tenant)
   - Guarantors
   ↓
4. Generate HTML
   - Nodo: Code/Function
   - Genera el HTML completo
   ↓
5. Insert Contract
   - Nodo: Supabase → Insert
   - Table: rental_contracts
   ↓
6. (Opcional) Update Application
   - Marcar que ya tiene contrato
```

### Nodo 2: Get Application Data

**Nodo**: Supabase
**Operation**: Select
**Table**: applications

```json
{
  "select": "*,properties(*,profiles!properties_owner_id_fkey(*)),guarantors(profiles(*))",
  "filters": {
    "id": "eq.{{$json.application_id}}"
  }
}
```

### Nodo 4: Generate HTML

**Nodo**: Code (JavaScript)

```javascript
// N8N Function Node - Generate Contract HTML
const application = items[0].json;
const property = application.properties;
const owner = property.profiles;

// Datos del arrendatario (desde snapshot)
const tenant = {
  name: `${application.snapshot_applicant_first_name} ${application.snapshot_applicant_paternal_last_name}`,
  rut: application.snapshot_applicant_rut,
  email: application.snapshot_applicant_email
};

// Datos del aval (si existe)
const guarantor = application.guarantors?.[0]?.profiles || null;

// Dirección completa
const fullAddress = `${property.address_street} ${property.address_number}${property.address_department ? `, ${property.address_department}` : ''}, ${property.address_commune}`;

// Generar HTML
const html = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Contrato de Arrendamiento</title>
    <style>
        body { font-family: 'Times New Roman', Times, serif; margin: 50px; font-size: 12pt; }
        h1 { text-align: center; font-size: 14pt; font-weight: bold; }
        h2 { text-align: left; font-size: 12pt; text-decoration: underline; margin-top: 20px; }
        p { text-align: justify; line-height: 1.6; margin-bottom: 1.2em; }
        strong { font-weight: bold; }
        .signature-block { margin-top: 60px; page-break-inside: avoid; }
        .signature-line { margin-top: 70px; border-top: 1px solid black; width: 250px; margin-left: auto; margin-right: auto; }
        .signature-title { text-align: center; margin-top: 10px; }
    </style>
</head>
<body>
    <h1>CONTRATO DE ARRENDAMIENTO</h1>
    
    <p>En Santiago de Chile, a ${new Date().toLocaleDateString('es-CL', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    })}, entre <strong>${owner.first_name} ${owner.paternal_last_name} ${owner.maternal_last_name || ''}</strong>, cédula de identidad N° <strong>${owner.rut}</strong>, en adelante "el Arrendador"; y <strong>${tenant.name}</strong>, cédula de identidad N° <strong>${tenant.rut}</strong>, en adelante "el Arrendatario", se ha convenido en el siguiente contrato de arrendamiento:</p>

    <h2>PRIMERO: PROPIEDAD ARRENDADA</h2>
    <p>El Arrendador da en arrendamiento al Arrendatario el inmueble ubicado en <strong>${fullAddress}</strong>. Se deja constancia que la propiedad se arrienda con sus servicios de luz, agua, gas y gastos comunes al día.</p>
    
    <h2>SEGUNDO: RENTA DE ARRENDAMIENTO</h2>
    <p>La renta mensual de arrendamiento será la suma de <strong>$${property.price_clp?.toLocaleString('es-CL')}</strong>. El Arrendatario se obliga a pagar dicha renta por mesadas anticipadas, dentro de los primeros cinco días de cada mes, mediante transferencia electrónica a la cuenta que el Arrendador indique.</p>
    
    <h2>TERCERO: DURACIÓN DEL CONTRATO</h2>
    <p>El presente contrato de arrendamiento tendrá una duración de <strong>12 meses</strong>. Este contrato se renovará tácita y sucesivamente por períodos iguales si ninguna de las partes manifestare su voluntad de ponerle término mediante carta certificada con una anticipación de a lo menos 60 días al vencimiento del período respectivo.</p>
    
    <h2>CUARTO: GARANTÍA</h2>
    <p>A fin de garantizar la conservación de la propiedad, el Arrendatario entrega en este acto al Arrendador a título de garantía la suma de <strong>$${property.price_clp?.toLocaleString('es-CL')}</strong>, equivalente a un mes de renta, la cual será devuelta dentro de los 30 días siguientes a la restitución del inmueble, una vez verificado el estado del mismo y el pago total de las cuentas de servicios y gastos.</p>
    
    <h2>QUINTO: OBLIGACIONES DEL ARRENDADOR</h2>
    <p>EL ARRENDADOR debe entregar la propiedad en buenas condiciones de habitación y uso. En caso de que se produzca algún desperfecto de naturaleza diferente a los que corresponde reparar a EL ARRENDATARIO, EL ARRENDADOR queda obligado a efectuarlos.</p>
    
    <h2>SEXTO: OBLIGACIONES DEL ARRENDATARIO</h2>
    <p>El Arrendatario se obliga a restituir la propiedad al término del contrato en el mismo estado en que la recibió, considerándose el desgaste natural por uso legítimo. Será de su cargo el pago de los servicios de energía eléctrica, gas, agua, y gastos comunes.</p>
    
    ${guarantor ? `
    <h2>SÉPTIMO: CODEUDOR SOLIDARIO (AVAL)</h2>
    <p>Comparece como codeudor solidario de todas las obligaciones del Arrendatario, <strong>${guarantor.first_name} ${guarantor.paternal_last_name}</strong>, cédula de identidad N° <strong>${guarantor.rut}</strong>, quien se obliga como fiador y codeudor solidario.</p>
    ` : ''}

    <div class="signature-block">
        <div class="signature-line"></div>
        <div class="signature-title">
            <strong>${owner.first_name} ${owner.paternal_last_name}</strong><br>
            C.I. ${owner.rut}<br>
            ARRENDADOR
        </div>
    </div>
    
    <div class="signature-block">
        <div class="signature-line"></div>
        <div class="signature-title">
            <strong>${tenant.name}</strong><br>
            C.I. ${tenant.rut}<br>
            ARRENDATARIO
        </div>
    </div>
    
    ${guarantor ? `
    <div class="signature-block">
        <div class="signature-line"></div>
        <div class="signature-title">
            <strong>${guarantor.first_name} ${guarantor.paternal_last_name}</strong><br>
            C.I. ${guarantor.rut}<br>
            CODEUDOR SOLIDARIO
        </div>
    </div>
    ` : ''}
</body>
</html>`;

// Retornar HTML y datos para el siguiente nodo
return {
  json: {
    html: html,
    application_id: application.id,
    user_id: property.owner_id,
    property_id: property.id,
    generated_at: new Date().toISOString()
  }
};
```

### Nodo 5: Insert Contract

**Nodo**: Supabase
**Operation**: Insert
**Table**: `rental_contracts`

**Mapeo de Campos**:
```
application_id → {{$json.application_id}}
contract_html → {{$json.html}}
contract_format → html (fixed value)
status → draft (fixed value)
created_by → {{$json.user_id}}
```

## Visualización en el Frontend

Una vez insertado, el contrato estará disponible en:

```
https://tu-app.com/contract/[contract-id]
```

El `ContractViewer` detectará automáticamente que es formato HTML y usará `HTMLContractViewer`.

## Testing

### Test Manual en N8N

1. Ejecutar workflow manualmente
2. Ver output del nodo Supabase Insert
3. Copiar el `id` del contrato creado
4. Ir al frontend: `/contract/{id}`

### Verificar en Base de Datos

```sql
SELECT 
  id,
  contract_number,
  contract_format,
  LENGTH(contract_html) as html_length,
  status,
  created_at
FROM rental_contracts
ORDER BY created_at DESC
LIMIT 5;
```

## Permisos RLS

Las políticas RLS existentes en `rental_contracts` ya permiten:
- ✅ Propietarios ver contratos de sus propiedades
- ✅ Arrendatarios ver sus contratos
- ✅ Avales ver contratos donde son garantes

**IMPORTANTE**: Para insertar desde N8N, usa **Service Role Key** (no anon key), ya que bypasea RLS.

## Troubleshooting

### Error: "new row violates check constraint"

**Causa**: No cumple el constraint de tener `contract_content` O `contract_html`

**Solución**: Asegúrate de enviar `contract_html` con contenido válido

### Error: "contract_format must be in (json, html, hybrid)"

**Causa**: Valor de `contract_format` incorrecto

**Solución**: Usar exactamente `'html'` (minúsculas)

### HTML no se muestra en el frontend

**Verificar**:
1. Campo `contract_format` es 'html'
2. Campo `contract_html` tiene contenido
3. HTML es completo (DOCTYPE, head, body)

### Error de permisos al insertar

**Verificar**:
1. Usar **Service Role Key** en N8N (no anon key)
2. Verificar que la key está correcta en las credenciales

## Ventajas de Esta Arquitectura

✅ **Más Simple**: Sin Edge Functions intermedias
✅ **Más Rápido**: Inserción directa a la BD
✅ **Más Control**: N8N maneja todo el flujo
✅ **Menos Costos**: No usa función serverless extra
✅ **Debugging Fácil**: Ver datos directamente en N8N

## Próximos Pasos

1. ✅ Migración aplicada (YA HECHO)
2. ⏳ Configurar nodo Supabase en N8N
3. ⏳ Crear nodo de generación de HTML
4. ⏳ Probar inserción
5. ⏳ Verificar visualización en frontend

¿Necesitas ayuda configurando el nodo específico en N8N?

