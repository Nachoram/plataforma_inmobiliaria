# Sistema de Propietarios Múltiples y Personería Jurídica

## Resumen Ejecutivo

Este documento describe la implementación completa del sistema de múltiples propietarios con soporte para personería jurídica condicional en el formulario de publicación de propiedades (RentalPublicationForm).

## Arquitectura del Sistema

### Modelo de Datos

#### Tabla `rental_owners` - Propietarios de Propiedades de Arriendo
```sql
CREATE TABLE rental_owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  owner_type VARCHAR(20) DEFAULT 'natural' CHECK (owner_type IN ('natural', 'juridica')),

  -- Campos comunes para ambos tipos
  address_street text,
  address_number varchar(10),
  address_department varchar(10),
  address_commune text,
  address_region text,
  phone varchar(20),
  email varchar(255),

  -- Campos para persona natural
  first_name text,
  paternal_last_name text,
  maternal_last_name text,
  rut varchar(12),
  marital_status marital_status_enum DEFAULT 'soltero',
  property_regime property_regime_enum,

  -- Campos para persona jurídica
  company_name text,
  company_rut varchar(12),
  company_business text,
  company_email varchar(255),
  company_phone varchar(20),

  -- Campos del representante legal (persona jurídica)
  representative_first_name text,
  representative_paternal_last_name text,
  representative_maternal_last_name text,
  representative_rut varchar(12),
  representative_email varchar(255),
  representative_phone varchar(20),

  -- Campos de personería jurídica (condicionales)
  constitution_type constitution_type_enum, -- 'empresa_en_un_dia' | 'tradicional'
  constitution_date DATE,
  cve_code VARCHAR(50), -- Solo para 'empresa_en_un_dia'
  notary_name VARCHAR(255), -- Solo para 'tradicional'
  repertory_number VARCHAR(50), -- Solo para 'tradicional'

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### Tabla `property_rental_owners` - Relación Muchos a Muchos
```sql
CREATE TABLE property_rental_owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  rental_owner_id uuid NOT NULL REFERENCES rental_owners(id) ON DELETE CASCADE,
  ownership_percentage NUMERIC(5,2) DEFAULT NULL CHECK (ownership_percentage IS NULL OR (ownership_percentage >= 0 AND ownership_percentage <= 100)),
  is_primary_owner BOOLEAN DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT unique_property_rental_owner UNIQUE (property_id, rental_owner_id)
);
```

## Lógica de Personería Jurídica Condicional

### Flujo de Campos Condicionales

#### 1. Selección de Tipo de Propietario
- **Persona Natural**: Campos estándar de individuo
- **Persona Jurídica**: Activa sección de personería jurídica

#### 2. Selección de Tipo de Constitución (Solo Persona Jurídica)
**Pregunta principal:**
> "¿La persona jurídica está constituida por Empresa en un Día / Tradicional?"

- **Empresa en un Día**:
  - `constitution_type = 'empresa_en_un_dia'`
  - Campos requeridos:
    - `constitution_date` (fecha de constitución)
    - `cve_code` (Código de Verificación Empresa)

- **Tradicional**:
  - `constitution_type = 'tradicional'`
  - Campos requeridos:
    - `constitution_date` (fecha de constitución - notaría)
    - `notary_name` (notaría)
    - `repertory_number` (número de repertorio)

### Validaciones de Personería Jurídica

#### Validaciones por Tipo de Constitución
```typescript
// Para Empresa en un Día
if (constitution_type === 'empresa_en_un_dia') {
  // cve_code es requerido
  // notary_name y repertory_number deben ser NULL
}

// Para Tradicional
if (constitution_type === 'tradicional') {
  // notary_name y repertory_number son requeridos
  // cve_code debe ser NULL
}
```

#### Validaciones Generales para Personas Jurídicas
- `constitution_type` es requerido
- `constitution_date` siempre es requerido cuando `owner_type = 'juridica'`

## Interfaz de Usuario - RentalPublicationForm

### Gestión Dinámica de Propietarios

#### Funcionalidades Implementadas
- **Agregar Propietario**: Máximo 5 propietarios por propiedad
- **Eliminar Propietario**: Mínimo 1 propietario requerido
- **Validación en Tiempo Real**: Campos requeridos y formatos
- **Validación de Duplicados**: RUT y email únicos entre propietarios

#### Campos de Propietario

##### Campos Comunes (Ambos Tipos)
- Tipo de Propietario (Natural/Jurídica)
- Calle, Número, Comuna, Región
- Email y Teléfono

##### Campos Persona Natural
- Nombres, Apellido Paterno, Apellido Materno
- RUT
- Estado Civil (Soltero/Casado/Divorciado/Viudo)
- Régimen Patrimonial (solo si casado)

##### Campos Persona Jurídica
- Razón Social
- RUT Empresa
- Giro de la Empresa
- Email Empresa, Teléfono Empresa

##### Campos Representante Legal (Persona Jurídica)
- Nombres, Apellidos del Representante
- RUT del Representante
- Email y Teléfono del Representante

##### Campos de Personería Jurídica (Condicionales)
- Tipo de Constitución
- Fecha de Constitución
- CVE (solo Empresa en un Día)
- Notaría (solo Tradicional)
- Número de Repertorio (solo Tradicional)

##### Campos de Propiedad (Opcional)
- Porcentaje de Propiedad (0-100%)
- Si todos los propietarios tienen porcentaje, debe sumar 100%

### Validaciones Frontend

#### Validaciones por Campo
```typescript
// Validaciones de persona jurídica
if (owner.owner_type === 'juridica') {
  // Constitución requerida
  if (!owner.constitution_type) {
    errors.constitution_type = 'Tipo de constitución requerido';
  }

  // Fecha de constitución siempre requerida
  if (!owner.constitution_date) {
    errors.constitution_date = 'Fecha de constitución requerida';
  }

  // Campos condicionales según constitución
  if (owner.constitution_type === 'empresa_en_un_dia' && !owner.cve_code) {
    errors.cve_code = 'CVE requerido para Empresa en un Día';
  }

  if (owner.constitution_type === 'tradicional') {
    if (!owner.notary_name) errors.notary_name = 'Notaría requerida';
    if (!owner.repertory_number) errors.repertory_number = 'N° repertorio requerido';
  }
}

// Validación de porcentajes
if (ownersWithPercentage.length === owners.length && owners.length > 1) {
  const total = ownersWithPercentage.reduce((sum, owner) =>
    sum + parseFloat(owner.ownership_percentage), 0
  );
  if (Math.abs(total - 100) > 0.01) {
    errors.total_percentage = `Porcentajes deben sumar 100%. Actual: ${total}%`;
  }
}

// Validación de duplicados
owners.forEach((owner, index) => {
  const rut = owner.owner_type === 'natural' ? owner.owner_rut : owner.owner_company_rut;
  const email = owner.owner_type === 'natural' ? owner.owner_email : owner.owner_company_email;

  // Verificar duplicados de RUT y email
});
```

## API Backend

### Endpoints y Operaciones

#### Creación de Propiedad con Múltiples Propietarios
```typescript
// Para cada propietario
const ownerData = {
  property_id: propertyId,
  owner_type: owner.owner_type,
  // ... campos según tipo
};

const { data: ownerResult } = await supabase
  .from('rental_owners')
  .insert(ownerData)
  .select()
  .single();

// Crear relación
const relationshipData = {
  property_id: propertyId,
  rental_owner_id: ownerResult.id,
  ownership_percentage: owner.ownership_percentage,
  is_primary_owner: owners.length === 1
};

await supabase
  .from('property_rental_owners')
  .insert(relationshipData);
```

#### Edición de Propiedad
```typescript
// Eliminar relaciones existentes
await supabase
  .from('property_rental_owners')
  .delete()
  .eq('property_id', propertyId);

// Eliminar propietarios existentes
await supabase
  .from('rental_owners')
  .delete()
  .eq('property_id', propertyId);

// Crear nuevos propietarios y relaciones
// ... (mismo código que creación)
```

### Políticas de Seguridad (RLS)

#### Políticas Implementadas
```sql
-- property_rental_owners policies
CREATE POLICY "Users can view property rental owners for their properties"
  ON property_rental_owners FOR SELECT
  TO authenticated
  USING (property_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Users can insert property rental owners for their properties"
  ON property_rental_owners FOR INSERT
  TO authenticated
  WITH CHECK (property_id IN (
    SELECT id FROM properties WHERE owner_id = auth.uid()
  ));
```

## Migración de Datos

### Estrategia de Migración
1. **Aplicar migración de campos legales** a `rental_owners`
2. **Crear tabla junction** `property_rental_owners`
3. **Migrar datos existentes** desde propiedades individuales
4. **Actualizar aplicaciones** y reportes para manejar múltiples propietarios

### Script de Migración
```sql
-- Agregar campos legales a rental_owners
ALTER TABLE rental_owners ADD COLUMN owner_type VARCHAR(20) DEFAULT 'natural';
ALTER TABLE rental_owners ADD COLUMN constitution_type constitution_type_enum;
-- ... otros campos

-- Crear tabla de relación
CREATE TABLE property_rental_owners (...);

-- Migrar datos existentes
INSERT INTO property_rental_owners (property_id, rental_owner_id, is_primary_owner)
SELECT property_id, id, true FROM rental_owners;
```

## Consideraciones de UX/UI

### Diseño Visual
- **Sección de Personería**: Fondo azul claro con borde azul
- **Campos Condicionales**: Aparecen/desaparecen según selecciones
- **Validación Visual**: Bordes rojos y mensajes de error
- **Botones de Acción**: Verde para agregar, rojo para eliminar

### Experiencia de Usuario
- **Guía Paso a Paso**: El formulario guía al usuario según selecciones
- **Validación Progresiva**: Errores se muestran a medida que se avanzan
- **Feedback Inmediato**: Mensajes de error específicos y útiles
- **Límite Visual**: Indicador claro de máximo 5 propietarios

## Testing y QA

### Casos de Prueba Requeridos

#### Validaciones de Personería
- ✅ Empresa en un Día requiere CVE
- ✅ Tradicional requiere Notaría y Repertorio
- ✅ Fecha de constitución siempre requerida para jurídicas
- ✅ Campos alternativos se ocultan correctamente

#### Gestión de Múltiples Propietarios
- ✅ Máximo 5 propietarios por propiedad
- ✅ Mínimo 1 propietario requerido
- ✅ RUT y email únicos entre propietarios
- ✅ Porcentajes opcionales pero válidos si proporcionados

#### Persistencia de Datos
- ✅ Creación de propiedades con múltiples propietarios
- ✅ Edición mantiene relaciones existentes
- ✅ Eliminación en cascada funciona correctamente

### Checklist de Calidad
- [ ] Campos condicionales funcionan correctamente
- [ ] Validaciones frontend y backend coinciden
- [ ] UI responsiva en diferentes dispositivos
- [ ] Mensajes de error claros y específicos
- [ ] Performance aceptable con 5 propietarios
- [ ] Compatibilidad con navegadores modernos

## Documentación para Desarrolladores

### Interface TypeScript
```typescript
interface Owner {
  id: string;
  owner_type: 'natural' | 'juridica';
  // ... campos según especificación
  constitution_type?: 'empresa_en_un_dia' | 'tradicional';
  constitution_date?: string;
  cve_code?: string;
  notary_name?: string;
  repertory_number?: string;
  ownership_percentage?: number;
}
```

### Funciones de Utilidad
```typescript
// Validar campos de personería
function validateLegalEntityFields(owner: Owner): ValidationErrors {
  // Implementación de validaciones condicionales
}

// Calcular total de porcentajes
function calculateOwnershipTotal(owners: Owner[]): number {
  return owners
    .filter(o => o.ownership_percentage)
    .reduce((sum, o) => sum + o.ownership_percentage!, 0);
}
```

## Próximos Pasos y Mantenimiento

### Mejoras Futuras
- **Búsqueda Avanzada**: Filtros por tipo de propietario
- **Notificaciones**: Alertas para vencimiento de personería
- **Integración**: Con servicios de verificación de RUT/CVE
- **Analytics**: Métricas de uso de personería jurídica

### Monitoreo
- **Logs de Errores**: Monitorear validaciones fallidas
- **Performance**: Tiempos de carga con múltiples propietarios
- **Uso**: Tipos de constitución más utilizados

---

**Fecha de Implementación**: Noviembre 2025
**Versión**: 2.0
**Estado**: ✅ Completado y Documentado



