# 📋 Estructura Real de la Tabla `properties`

## ✅ **Columnas Existentes**

La tabla `properties` tiene estas columnas:

```sql
CREATE TABLE properties (
  id uuid PRIMARY KEY,
  owner_id uuid REFERENCES profiles(id),
  status property_status_enum DEFAULT 'disponible',
  listing_type listing_type_enum NOT NULL,
  address_street text NOT NULL,           -- ✅ Calle
  address_number varchar(10) NOT NULL,    -- ✅ Número
  address_department varchar(10),         -- ✅ Depto (opcional)
  address_commune text NOT NULL,          -- ✅ Comuna
  address_region text NOT NULL,           -- ✅ Región
  price_clp bigint NOT NULL,
  common_expenses_clp integer,
  bedrooms integer NOT NULL DEFAULT 0,
  bathrooms integer NOT NULL DEFAULT 0,
  surface_m2 integer,
  description text,
  created_at timestamptz DEFAULT now()
);
```

---

## ❌ **Columnas que NO existen**

- ❌ `title` - No existe, usa `address_street` en su lugar
- ❌ `name` - No existe
- ❌ `address` - No existe como columna única, está dividida en múltiples campos

---

## 🔧 **Cómo construir un "título" de propiedad**

### **Opción 1: Dirección simple**
```sql
CONCAT(p.address_street, ' ', p.address_number)
-- Resultado: "Av. Providencia 1234"
```

### **Opción 2: Dirección con departamento**
```sql
CASE 
  WHEN p.address_department IS NOT NULL 
  THEN CONCAT(p.address_street, ' ', p.address_number, ' Depto ', p.address_department)
  ELSE CONCAT(p.address_street, ' ', p.address_number)
END
-- Resultado: "Av. Providencia 1234 Depto 501"
```

### **Opción 3: Dirección completa**
```sql
CONCAT(
  p.address_street, ' ', 
  p.address_number,
  COALESCE(' Depto ' || p.address_department, ''),
  ', ', p.address_commune
)
-- Resultado: "Av. Providencia 1234 Depto 501, Providencia"
```

### **Opción 4: Con región**
```sql
CONCAT(
  p.address_street, ' ', 
  p.address_number,
  ', ', p.address_commune,
  ', ', p.address_region
)
-- Resultado: "Av. Providencia 1234, Providencia, Región Metropolitana"
```

---

## 📊 **Ejemplos de uso en consultas**

### **En SELECT simple:**
```sql
SELECT 
  id,
  CONCAT(address_street, ' ', address_number) as direccion,
  price_clp,
  bedrooms,
  bathrooms
FROM properties
WHERE status = 'disponible';
```

### **En JOIN con contratos:**
```sql
SELECT 
  rc.id as contract_id,
  CONCAT(p.address_street, ' ', p.address_number, ', ', p.address_commune) as propiedad,
  rc.status
FROM rental_contracts rc
JOIN applications a ON a.id = rc.application_id
JOIN properties p ON p.id = a.property_id;
```

### **En búsquedas:**
```sql
SELECT *
FROM properties
WHERE 
  address_street ILIKE '%providencia%' OR
  address_commune ILIKE '%providencia%';
```

---

## 🎯 **Campos más usados**

| Campo | Uso | Ejemplo |
|-------|-----|---------|
| `address_street` | Calle/Avenida | "Av. Providencia" |
| `address_number` | Número | "1234" |
| `address_department` | Depto (opcional) | "501" o `NULL` |
| `address_commune` | Comuna | "Providencia" |
| `address_region` | Región | "Región Metropolitana" |
| `description` | Descripción larga | "Hermoso departamento..." |

---

## ✅ **Scripts Corregidos**

Los siguientes scripts ya fueron actualizados para usar la estructura correcta:

- ✅ `DIAGNOSTICO_EDICION_CONTRATOS.sql`
- ✅ `FIX_EDICION_CONTRATOS_AUTO.sql`
- ✅ `FIX_RLS_CORRECTO.sql` (no usaba `title`)

---

## 🚨 **Error común a evitar**

### ❌ **Incorrecto:**
```sql
SELECT p.title FROM properties p;
-- ERROR: column p.title does not exist
```

### ✅ **Correcto:**
```sql
SELECT CONCAT(p.address_street, ' ', p.address_number) as title 
FROM properties p;
```

---

## 📝 **Nota para el Frontend**

Si en el frontend necesitas un "título" de propiedad para mostrar:

```typescript
// En lugar de: property.title
const propertyTitle = `${property.address_street} ${property.address_number}`;

// O con comuna:
const propertyTitle = `${property.address_street} ${property.address_number}, ${property.address_commune}`;

// O completo:
const propertyTitle = property.address_department
  ? `${property.address_street} ${property.address_number} Depto ${property.address_department}, ${property.address_commune}`
  : `${property.address_street} ${property.address_number}, ${property.address_commune}`;
```

---

**Fecha:** 3 de octubre, 2025  
**Estado:** ✅ Documentado

