# 🔍 Diagnóstico: Propiedades no aparecen en Mi Portafolio

## Pasos de Diagnóstico

### Paso 1: Verificar la consola del navegador

1. Abre las herramientas de desarrollador (F12)
2. Ve a la pestaña **Console**
3. Navega a "Mi Portafolio"
4. Busca errores en rojo o warnings

**¿Qué error ves?** Copia el mensaje de error completo.

---

### Paso 2: Verificar que la función RPC existe

Ejecuta esto en **Supabase SQL Editor**:

```sql
-- Verificar que la función existe
SELECT 
  routine_name, 
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_name = 'get_portfolio_with_postulations';
```

**Resultado esperado:** Debe aparecer una fila con la función.

---

### Paso 3: Probar la función directamente

Ejecuta esto en **Supabase SQL Editor** (reemplaza 'TU_USER_ID' con tu ID real):

```sql
-- Obtener tu user_id primero
SELECT id, email FROM auth.users LIMIT 5;

-- Luego prueba la función con tu user_id
SELECT * FROM get_portfolio_with_postulations('TU_USER_ID_AQUI');
```

**¿Devuelve resultados?**

---

### Paso 4: Verificar que tienes propiedades

```sql
-- Ver tus propiedades directamente
SELECT 
  id,
  owner_id,
  address_street,
  status,
  created_at
FROM properties
WHERE owner_id = 'TU_USER_ID_AQUI'
ORDER BY created_at DESC;
```

**¿Tienes propiedades?**

---

## Problemas Comunes y Soluciones

### Problema 1: Error de tipo de datos

**Síntoma:** Error que menciona "json" o "type conversion"

**Solución:** La función podría tener un problema con los tipos. Ejecuta esta versión corregida:

```sql
-- VERSIÓN CORREGIDA DE LA FUNCIÓN
CREATE OR REPLACE FUNCTION get_portfolio_with_postulations(user_id_param uuid)
RETURNS TABLE (
    id uuid,
    owner_id uuid,
    status property_status_enum,
    listing_type listing_type_enum,
    address_street text,
    address_number varchar(10),
    address_department varchar(10),
    address_commune text,
    address_region text,
    price_clp bigint,
    common_expenses_clp integer,
    bedrooms integer,
    bathrooms integer,
    surface_m2 integer,
    description text,
    created_at timestamptz,
    property_images jsonb,
    postulation_count bigint,
    postulations jsonb
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.owner_id,
        p.status,
        p.listing_type,
        p.address_street,
        p.address_number,
        p.address_department,
        p.address_commune,
        p.address_region,
        p.price_clp,
        p.common_expenses_clp,
        p.bedrooms,
        p.bathrooms,
        p.surface_m2,
        p.description,
        p.created_at,
        COALESCE(
            (
                SELECT jsonb_agg(jsonb_build_object(
                    'image_url', pi.image_url,
                    'storage_path', pi.storage_path
                ))
                FROM property_images pi
                WHERE pi.property_id = p.id
            ),
            '[]'::jsonb
        ) as property_images,
        COUNT(a.id)::bigint as postulation_count,
        COALESCE(
            (
                SELECT jsonb_agg(jsonb_build_object(
                    'id', app.id,
                    'applicant_id', app.applicant_id,
                    'status', app.status,
                    'created_at', app.created_at,
                    'message', app.message,
                    'application_characteristic_id', app.application_characteristic_id,
                    'applicant_name', COALESCE(
                        prof.first_name || ' ' || prof.paternal_last_name || ' ' || COALESCE(prof.maternal_last_name, ''),
                        'Sin nombre'
                    ),
                    'applicant_email', prof.email,
                    'applicant_phone', prof.phone,
                    'guarantor_name', COALESCE(
                        guar.first_name || ' ' || guar.paternal_last_name || ' ' || COALESCE(guar.maternal_last_name, ''),
                        NULL
                    ),
                    'guarantor_email', guar.email,
                    'guarantor_phone', guar.phone,
                    'guarantor_characteristic_id', guar.guarantor_characteristic_id
                ) ORDER BY app.created_at DESC)
                FROM applications app
                LEFT JOIN profiles prof ON app.applicant_id = prof.id
                LEFT JOIN guarantors guar ON app.guarantor_id = guar.id
                WHERE app.property_id = p.id
            ),
            '[]'::jsonb
        ) as postulations
    FROM properties p
    LEFT JOIN applications a ON p.id = a.property_id
    WHERE p.owner_id = user_id_param
    GROUP BY p.id
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_portfolio_with_postulations(uuid) TO authenticated;
```

---

### Problema 2: Falta la columna "type"

**Síntoma:** Error sobre columna "type" no existe

**Solución:** Necesitamos agregar más campos a la función. Revisa qué columnas tiene tu tabla `properties`:

```sql
-- Ver todas las columnas de properties
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'properties' 
ORDER BY ordinal_position;
```

---

### Problema 3: La función devuelve vacío pero tienes propiedades

**Síntoma:** La consulta directa a `properties` muestra resultados, pero la función RPC no

**Solución Temporal:** Usa el método anterior mientras arreglamos la función. Edita `PortfolioPage.tsx`:

```typescript
// SOLUCIÓN TEMPORAL - Reemplaza fetchPortfolioData con esto:
const fetchPortfolioData = useCallback(async () => {
  if (!user || !user.id) {
    console.warn('User not authenticated, cannot fetch portfolio data');
    setProperties([]);
    setLoading(false);
    return;
  }

  setLoading(true);
  try {
    // Intentar primero con la nueva función RPC
    console.log('🔍 Intentando con RPC function...');
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_portfolio_with_postulations', {
        user_id_param: user.id
      });

    if (rpcError) {
      console.error('❌ Error con RPC:', rpcError);
      console.log('🔄 Usando método de respaldo...');
      
      // FALLBACK: Usar el método anterior
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select(`
          id,
          owner_id,
          status,
          listing_type,
          address_street,
          address_number,
          address_department,
          address_commune,
          address_region,
          price_clp,
          common_expenses_clp,
          bedrooms,
          bathrooms,
          surface_m2,
          description,
          created_at,
          property_images (
            image_url,
            storage_path
          )
        `)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (propertiesError) {
        console.error('Error fetching properties:', propertiesError);
        setProperties([]);
      } else {
        // Agregar conteos manualmente
        const propertiesWithCounts = await Promise.all(
          (propertiesData || []).map(async (property) => {
            const { count } = await supabase
              .from('applications')
              .select('*', { count: 'exact', head: true })
              .eq('property_id', property.id);
            
            return {
              ...property,
              postulation_count: count || 0,
              postulations: []
            };
          })
        );
        
        setProperties(propertiesWithCounts);
      }
    } else {
      console.log('✅ RPC funcionó correctamente:', rpcData);
      setProperties(rpcData || []);
    }

  } catch (error) {
    console.error('Error fetching portfolio data:', error);
    setProperties([]);
  } finally {
    setLoading(false);
  }
}, [user]);
```

---

## 📝 Información que Necesito

Por favor proporciona:

1. **Mensaje de error completo** de la consola del navegador
2. **Resultado** de ejecutar la función RPC directamente en Supabase
3. **¿Tienes propiedades?** (resultado de la query directa a la tabla properties)
4. **Versión de Supabase** que estás usando

Con esta información puedo darte una solución precisa.

