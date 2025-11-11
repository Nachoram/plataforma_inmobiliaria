# Esquema de Base de Datos - Plataforma Inmobiliaria

## Resumen Ejecutivo

Esta documentación describe el esquema simplificado y optimizado de la base de datos de la plataforma inmobiliaria después de la auditoría completa realizada el 29 de octubre de 2025.

**Estado actual**: 19 tablas activas, eliminadas 9 tablas legacy y múltiples columnas obsoletas.

## Arquitectura General

### Principios de Diseño
- **Normalización 3NF**: Estructura relacional optimizada
- **Seguridad RLS**: Row Level Security en todas las tablas
- **Integridad referencial**: Foreign keys consistentes
- **Nomenclatura consistente**: snake_case para columnas, plural para tablas

### Tecnologías
- **Base de datos**: PostgreSQL con Supabase
- **Autenticación**: Supabase Auth integrado
- **Storage**: Supabase Storage para archivos
- **Tipos**: Enums personalizados para integridad de datos

## Tablas del Sistema

### 1. `profiles` - Perfiles de Usuario
**Propósito**: Información extendida de usuarios autenticados
**Relaciones**: Referenciada por properties.owner_id, applications.applicant_id, etc.

| Columna | Tipo | Descripción | Requerido |
|---------|------|-------------|-----------|
| id | uuid | FK → auth.users.id | ✅ |
| first_name | text | Nombre | ✅ |
| paternal_last_name | text | Apellido paterno | ✅ |
| maternal_last_name | text | Apellido materno | ❌ |
| rut | varchar(12) | RUT chileno (único) | ✅ |
| email | varchar(255) | Email (único) | ✅ |
| phone | varchar(20) | Teléfono | ❌ |
| profession | text | Profesión | ❌ |
| marital_status | marital_status_enum | Estado civil | ✅ |
| property_regime | property_regime_enum | Régimen patrimonial | ❌ |
| address_street | text | Calle | ❌ |
| address_number | varchar(10) | Número | ❌ |
| address_department | varchar(10) | Departamento | ❌ |
| address_commune | text | Comuna | ❌ |
| address_region | text | Región | ❌ |
| monthly_income_clp | bigint | Ingreso mensual | ❌ |
| nationality | text | Nacionalidad | ❌ |
| date_of_birth | date | Fecha nacimiento | ❌ |
| job_seniority | text | Antigüedad laboral | ❌ |
| created_at | timestamptz | Fecha creación | ✅ |

### 2. `properties` - Propiedades Inmobiliarias
**Propósito**: Propiedades publicadas en la plataforma
**Relaciones**: Referencia profiles.id, property_type_characteristics.id

| Columna | Tipo | Descripción | Requerido |
|---------|------|-------------|-----------|
| id | uuid | PK | ✅ |
| owner_id | uuid | FK → profiles.id | ✅ |
| status | property_status_enum | Estado propiedad | ✅ |
| listing_type | listing_type_enum | Tipo publicación | ✅ |
| address_street | text | Calle | ✅ |
| address_number | varchar(10) | Número | ✅ |
| address_department | varchar(10) | Departamento | ❌ |
| address_commune | text | Comuna | ✅ |
| address_region | text | Región | ✅ |
| price_clp | bigint | Precio en CLP | ✅ |
| common_expenses_clp | integer | Gastos comunes | ❌ |
| bedrooms | integer | Dormitorios | ✅ |
| bathrooms | integer | Baños | ✅ |
| description | text | Descripción | ❌ |
| created_at | timestamptz | Fecha creación | ✅ |
| is_visible | boolean | Visible en listado | ✅ |
| is_featured | boolean | Destacada | ✅ |
| metros_utiles | numeric(8,2) | Metros útiles | ❌ |
| metros_totales | numeric(8,2) | Metros totales | ❌ |
| tiene_terraza | boolean | Tiene terraza | ✅ |
| ano_construccion | integer | Año construcción | ❌ |
| tiene_sala_estar | boolean | Tiene sala estar | ✅ |
| sistema_agua_caliente | tipo_agua_caliente | Sistema agua | ❌ |
| tipo_cocina | tipo_cocina | Tipo cocina | ❌ |
| asesor_id | uuid | FK → profiles.id | ❌ |
| estacionamientos | integer | Número estacionamientos | ✅ |
| tipo_propiedad | tipo_propiedad_enum | Tipo propiedad | ✅ |
| storage_number | varchar(50) | Número bodega | ❌ |
| parking_location | varchar(100) | Ubicación estacionamiento | ❌ |
| parcela_number | varchar(30) | Número parcela | ❌ |
| property_type_characteristics_id | uuid | FK → property_type_characteristics.id | ❌ |

### 3. `applications` - Postulaciones de Arriendo
**Propósito**: Solicitudes de arriendo de propiedades
**Relaciones**: Referencia properties.id, profiles.id, guarantors.id

| Columna | Tipo | Descripción | Requerido |
|---------|------|-------------|-----------|
| id | uuid | PK | ✅ |
| property_id | uuid | FK → properties.id | ✅ |
| applicant_id | uuid | FK → profiles.id | ✅ |
| guarantor_id | uuid | FK → guarantors.id | ❌ |
| status | application_status_enum | Estado postulación | ✅ |
| message | text | Mensaje postulación | ❌ |
| created_at | timestamptz | Fecha creación | ✅ |
| updated_at | timestamptz | Fecha actualización | ✅ |
| approved_by | uuid | FK → profiles.id | ❌ |
| approved_at | timestamptz | Fecha aprobación | ❌ |
| priority | integer | Prioridad | ✅ |
| internal_notes | text | Notas internas | ❌ |
| responded_at | timestamptz | Fecha respuesta | ❌ |
| application_characteristic_id | uuid | ID característico | ✅ |
| guarantor_characteristic_id | uuid | ID aval | ❌ |

**Campos snapshot (preservan datos históricos):**
- snapshot_applicant_profession
- snapshot_applicant_monthly_income_clp
- snapshot_applicant_age
- snapshot_applicant_nationality
- snapshot_applicant_marital_status
- snapshot_applicant_address_* (street, number, department, commune, region)

### 4. `guarantors` - Avales/Garantes
**Propósito**: Información de garantes para postulaciones
**Relaciones**: Referenciada por applications.guarantor_id

| Columna | Tipo | Descripción | Requerido |
|---------|------|-------------|-----------|
| id | uuid | PK | ✅ |
| full_name | text | Nombre completo | ✅ |
| rut | varchar(12) | RUT (único) | ✅ |
| profession | text | Profesión | ✅ |
| company | text | Empresa | ❌ |
| monthly_income | numeric | Ingreso mensual | ✅ |
| work_seniority_years | integer | Antigüedad laboral | ✅ |
| contact_email | text | Email contacto | ✅ |
| contact_phone | text | Teléfono contacto | ❌ |
| address_street | text | Calle | ❌ |
| address_number | varchar(10) | Número | ❌ |
| address_department | varchar(10) | Departamento | ❌ |
| address_commune | text | Comuna | ❌ |
| address_region | text | Región | ❌ |
| created_at | timestamptz | Fecha creación | ✅ |
| updated_at | timestamptz | Fecha actualización | ✅ |
| created_by | uuid | FK → auth.users.id | ✅ |

### 5. `offers` - Ofertas de Compra
**Propósito**: Ofertas de compra para propiedades
**Relaciones**: Referencia properties.id, profiles.id

| Columna | Tipo | Descripción | Requerido |
|---------|------|-------------|-----------|
| id | uuid | PK | ✅ |
| property_id | uuid | FK → properties.id | ✅ |
| offerer_id | uuid | FK → profiles.id | ✅ |
| offer_amount_clp | bigint | Monto oferta | ✅ |
| status | offer_status_enum | Estado oferta | ✅ |
| message | text | Mensaje oferta | ❌ |
| created_at | timestamptz | Fecha creación | ✅ |
| financing_type | text | Tipo financiamiento | ✅ |
| selected_services | text[] | Servicios seleccionados | ✅ |
| services_total_cost | numeric | Costo servicios | ✅ |
| buyer_info | jsonb | Información comprador | ✅ |
| payment_status | text | Estado pago | ✅ |
| expires_at | timestamptz | Fecha expiración | ❌ |
| special_conditions | text | Condiciones especiales | ❌ |

### 6. `documents` - Documentos del Sistema
**Propósito**: Gestión centralizada de documentos
**Relaciones**: Referencia profiles.id

| Columna | Tipo | Descripción | Requerido |
|---------|------|-------------|-----------|
| id | uuid | PK | ✅ |
| uploader_id | uuid | FK → profiles.id | ✅ |
| related_entity_id | uuid | ID entidad relacionada | ✅ |
| related_entity_type | document_entity_type_enum | Tipo entidad | ✅ |
| document_type | text | Tipo documento | ✅ |
| storage_path | text | Ruta en storage | ✅ |
| file_name | text | Nombre archivo | ✅ |
| created_at | timestamptz | Fecha creación | ✅ |
| applicant_document_type_code | text | Código tipo documento | ❌ |
| processing_status | text | Estado procesamiento | ✅ |
| processing_attempts | integer | Intentos procesamiento | ✅ |
| last_processed_at | timestamptz | Último procesamiento | ❌ |
| ocr_text | text | Texto OCR | ❌ |
| metadata | jsonb | Metadatos | ✅ |

### 7. `property_images` - Imágenes de Propiedades
**Propósito**: Imágenes asociadas a propiedades
**Relaciones**: Referencia properties.id

| Columna | Tipo | Descripción | Requerido |
|---------|------|-------------|-----------|
| id | uuid | PK | ✅ |
| property_id | uuid | FK → properties.id | ✅ |
| image_url | text | URL imagen | ✅ |
| storage_path | text | Ruta storage | ✅ |
| created_at | timestamptz | Fecha creación | ✅ |

### 8. `rental_contract_conditions` - Condiciones de Contrato Arriendo
**Propósito**: Condiciones específicas para contratos de arriendo
**Relaciones**: Referencia applications.id (indirectamente)

| Columna | Tipo | Descripción | Requerido |
|---------|------|-------------|-----------|
| id | uuid | PK | ✅ |
| application_id | uuid | FK → applications.id | ❌ |
| contract_start_date | date | Fecha inicio | ❌ |
| contract_end_date | date | Fecha término | ❌ |
| monthly_rent | numeric(12,2) | Renta mensual | ❌ |
| warranty_amount | numeric(12,2) | Monto garantía | ❌ |
| payment_day | integer | Día pago | ✅ |
| special_conditions_house | text | Condiciones especiales | ❌ |
| dicom_clause | boolean | Cláusula DICOM | ✅ |
| notification_email | text | Email notificaciones | ❌ |
| payment_conditions | text | Condiciones pago | ❌ |
| bank_name | text | Nombre banco | ❌ |
| account_type | text | Tipo cuenta | ❌ |
| account_number | text | Número cuenta | ❌ |
| account_holder_name | text | Nombre titular | ❌ |
| account_holder_rut | text | RUT titular | ❌ |
| broker_name | varchar(120) | Nombre corredor | ✅ |
| broker_rut | varchar(20) | RUT corredor | ✅ |
| final_rent_price | numeric(12,2) | Precio final renta | ✅ |
| brokerage_commission | numeric(12,2) | Comisión corretaje | ❌ |
| guarantee_amount | numeric(12,2) | Monto garantía | ❌ |
| payment_method | varchar(50) | Método pago | ✅ |
| created_by | uuid | FK → auth.users.id | ❌ |
| contract_conditions_characteristic_id | uuid | ID característico | ❌ |

### 9. `rental_contracts` - Contratos de Arriendo
**Propósito**: Contratos de arriendo generados
**Relaciones**: Referencia applications.id

| Columna | Tipo | Descripción | Requerido |
|---------|------|-------------|-----------|
| id | uuid | PK | ✅ |
| application_id | uuid | FK → applications.id | ✅ |
| contract_html | text | HTML contrato | ❌ |
| contract_format | varchar(20) | Formato contrato | ✅ |
| contract_number | varchar(50) | Número contrato | ❌ |
| has_auto_renewal_clause | boolean | Incluye cláusula renovación automática | ✅ |
| created_at | timestamptz | Fecha creación | ✅ |
| updated_at | timestamptz | Fecha actualización | ❌ |

### 10. `property_type_characteristics` - Características de Tipos de Propiedad
**Propósito**: Metadatos de tipos de propiedad para contratos

| Columna | Tipo | Descripción | Requerido |
|---------|------|-------------|-----------|
| id | uuid | PK | ✅ |
| name | text | Nombre tipo | ✅ |
| description | text | Descripción | ❌ |
| created_at | timestamptz | Fecha creación | ✅ |
| updated_at | timestamptz | Fecha actualización | ✅ |

## Tablas de Soporte

### 11-19. Tablas Adicionales
- `contract_clauses` - Cláusulas de contrato
- `contract_conditions` - Condiciones contractuales
- `contract_signatures` - Firmas de contratos
- `property_owners` - Propietarios de propiedades
- `rental_owners` - Propietarios arrendadores
- `sale_owners` - Propietarios vendedores
- `rental_owner_characteristics` - Características propietarios arriendo
- `applicant_document_types` - Tipos de documento postulantes
- `applicant_document_content` - Contenido documentos postulantes

## Enums del Sistema

### Estados y Tipos
```sql
-- Estados de propiedad
CREATE TYPE property_status_enum AS ENUM (
    'disponible', 'activa', 'arrendada', 'vendida', 'pausada'
);

-- Tipos de publicación
CREATE TYPE listing_type_enum AS ENUM ('venta', 'arriendo');

-- Estados civiles
CREATE TYPE marital_status_enum AS ENUM (
    'soltero', 'casado', 'divorciado', 'viudo'
);

-- Regímenes patrimoniales
CREATE TYPE property_regime_enum AS ENUM (
    'sociedad conyugal', 'separación de bienes', 'participación en los gananciales'
);

-- Estados de aplicación
CREATE TYPE application_status_enum AS ENUM (
    'pendiente', 'aprobada', 'rechazada', 'info_solicitada'
);

-- Estados de oferta
CREATE TYPE offer_status_enum AS ENUM ('pendiente', 'aceptada', 'rechazada');

-- Tipos de entidad para documentos
CREATE TYPE document_entity_type_enum AS ENUM (
    'property_legal', 'application_applicant', 'application_guarantor'
);

-- Tipos de propiedad
CREATE TYPE tipo_propiedad_enum AS ENUM (
    'Casa', 'Departamento', 'Oficina', 'Local Comercial',
    'Estacionamiento', 'Bodega', 'Parcela'
);

-- Sistemas de agua caliente
CREATE TYPE tipo_agua_caliente AS ENUM (
    'Calefón', 'Termo Eléctrico', 'Caldera Central'
);

-- Tipos de cocina
CREATE TYPE tipo_cocina AS ENUM (
    'Cerrada', 'Americana', 'Integrada'
);
```

## Políticas de Seguridad (RLS)

Todas las tablas tienen Row Level Security habilitado con políticas que garantizan:
- Usuarios solo acceden a sus propios datos
- Propietarios ven aplicaciones/ofertas de sus propiedades
- Administradores tienen acceso según roles

## Índices Estratégicos

### Índices de Performance
- **Profiles**: rut, email, created_at
- **Properties**: owner_id, status, listing_type, address_commune, price_clp
- **Applications**: property_id, applicant_id, guarantor_id, status
- **Offers**: property_id, offerer_id, status

### Índices de Integridad
- **Foreign Keys**: Todos los FK tienen índices automáticos
- **Unique Constraints**: rut, email en profiles; rut en guarantors

## Consideraciones de Mantenimiento

### Backup Obligatorio
- Antes de cualquier cambio estructural, crear backup completo
- Mantener backups por al menos 30 días

### Migraciones
- Todas las migraciones son irreversibles sin backup
- Probar en staging antes de producción
- Documentar impacto de cada migración

### Monitoreo
- Alertas en uso de disco > 80%
- Monitoreo de queries lentas
- Logs de errores de aplicación

## Historial de Cambios

### v2.0 - 29 Octubre 2025
- ✅ Eliminadas 9 tablas legacy no utilizadas
- ✅ Removidas 15+ columnas obsoletas
- ✅ Optimizada estructura de datos
- ✅ Mejorada performance de queries
- ✅ Simplificada documentación

### v1.0 - Enero 2025
- Creación inicial del esquema
- Implementación de 28 tablas
- Configuración RLS completa
- Integración Supabase Storage
