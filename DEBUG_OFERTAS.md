# 🔍 Guía de Debug - Formulario de Ofertas

## Problema Reportado
El formulario de oferta no se despliega al hacer clic en el botón "Hacer Oferta de Compra".

## ✅ Pasos de Verificación

### 1. Verificar que el servidor esté corriendo
```bash
npm run dev
```
- El servidor debe estar corriendo sin errores
- Busca errores de compilación en la consola

### 2. Verificar en el navegador

Abre la consola del navegador (F12) y busca estos logs:

#### Al hacer clic en "Hacer Oferta de Compra":
```
🔵 handleQuickOffer called { user: {...}, property: {...} }
🚀 Navigating to: /ofertas/nueva/[property-id]
```

#### Cuando carga la página de oferta:
```
🟢 SaleOfferPage rendered, propertyId: [property-id]
```

### 3. Verificaciones Específicas

#### ¿El botón aparece?
- **SÍ:** El botón "Hacer Oferta de Compra" se muestra
- **NO:** Ir a "Problema: El botón no aparece"

#### ¿El botón funciona?
- Al hacer clic, verifica en la consola si aparece el log `🔵 handleQuickOffer called`
- Si NO aparece, hay un problema con el event handler
- Si SÍ aparece, continúa verificando

#### ¿Aparece el log de navegación?
- Verifica si aparece `🚀 Navigating to: ...`
- Si NO aparece, revisa los logs de error

#### ¿Se carga SaleOfferPage?
- Verifica si aparece `🟢 SaleOfferPage rendered`
- Si NO aparece, hay un problema con el routing

---

## 🐛 Problemas Comunes

### Problema: El botón no aparece

**Posibles causas:**

1. **La propiedad es de tipo "arriendo"**
   - El botón de oferta solo se muestra para propiedades de tipo "venta"
   - Verifica en la consola: `console.log(property.listing_type)`
   - Debe ser: `"venta"`

2. **No estás autenticado**
   - El botón solo se muestra para usuarios autenticados
   - Verifica: `console.log(user)`
   - Debe existir un objeto de usuario

3. **Eres el propietario**
   - El botón no se muestra si eres dueño de la propiedad
   - Verifica: `console.log(property.owner_id === user.id)`
   - Debe ser `false`

**Solución:**
- Asegúrate de estar viendo una propiedad de tipo "venta"
- Asegúrate de estar autenticado
- Asegúrate de no ser el propietario

### Problema: El botón no hace nada al hacer clic

**Verificación en consola:**
```javascript
// Abre la consola del navegador y ejecuta:
console.log('Testing navigation');
window.location.href = '/ofertas/nueva/test-id';
```

Si esto funciona pero el botón no, hay un problema con el event handler.

**Solución:**
1. Verifica que no haya errores JavaScript en la consola
2. Verifica que el botón no esté deshabilitado (`disabled={actionLoading}`)
3. Reinicia el servidor de desarrollo

### Problema: Navega pero no carga el formulario

**Síntomas:**
- La URL cambia a `/ofertas/nueva/[id]`
- Pero la página no se carga o muestra error

**Verificaciones:**

1. **Verifica que los archivos existan:**
   ```
   src/components/sales/SaleOfferPage.tsx
   src/components/sales/SaleOfferForm.tsx
   ```

2. **Verifica la importación en AppContent.tsx:**
   ```typescript
   import SaleOfferPage from './sales/SaleOfferPage';
   ```

3. **Verifica las rutas en AppContent.tsx:**
   ```typescript
   <Route path="/ofertas/nueva/:propertyId" element={
     <Layout>
       <SaleOfferPage />
     </Layout>
   } />
   ```

**Solución:**
1. Reinicia el servidor de desarrollo
2. Limpia la caché del navegador (Ctrl+Shift+R)
3. Verifica errores en la consola del navegador

### Problema: Error al cargar la propiedad

**Síntomas:**
- La página carga pero muestra un mensaje de error
- Ejemplo: "Error al cargar la propiedad"

**Verificaciones:**

1. **Verifica la conexión a Supabase:**
   - Abre la consola del navegador
   - Busca errores de red en la tab "Network"

2. **Verifica que la propiedad exista:**
   ```javascript
   // En la consola del navegador
   const { data, error } = await supabase
     .from('properties')
     .select('*')
     .eq('id', 'tu-property-id')
     .single();
   console.log({ data, error });
   ```

3. **Verifica el tipo de propiedad:**
   ```javascript
   console.log(data.listing_type); // Debe ser "venta"
   console.log(data.status); // Debe ser "disponible" o "activa"
   ```

---

## 🔧 Soluciones Rápidas

### 1. Reiniciar servidor de desarrollo
```bash
# Ctrl+C para detener
npm run dev
```

### 2. Limpiar caché del navegador
- Chrome/Edge: Ctrl+Shift+R
- Firefox: Ctrl+F5

### 3. Verificar errores de compilación
Revisa la terminal donde corre `npm run dev` y busca errores en rojo.

### 4. Verificar errores en consola del navegador
- Abre DevTools (F12)
- Ve a la tab "Console"
- Busca errores en rojo

---

## 📝 Checklist de Verificación Rápida

Antes de reportar un problema, verifica:

- [ ] El servidor está corriendo sin errores
- [ ] No hay errores en la consola del navegador
- [ ] Estoy viendo una propiedad de tipo "venta" (no "arriendo")
- [ ] Estoy autenticado (logeado)
- [ ] No soy el propietario de la propiedad
- [ ] El botón "Hacer Oferta de Compra" es visible
- [ ] Al hacer clic, aparecen los logs en la consola
- [ ] La migración de base de datos fue aplicada

---

## 🗄️ Verificar Migración de Base de Datos

Si el formulario carga pero falla al enviar datos:

### Verificar que las tablas existan:

```sql
-- En Supabase SQL Editor
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'offer_bank_executives'
);
```

Debe retornar `true`.

### Verificar columnas en property_sale_offers:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'property_sale_offers'
ORDER BY ordinal_position;
```

Busca estas columnas:
- `entity_type`
- `buyer_lastname`
- `company_name`
- `has_bank_executive`
- `has_preapproved_credit`

Si NO existen, debes aplicar la migración:

```bash
# Aplica la migración en Supabase Dashboard > SQL Editor
# Copia y pega el contenido de:
supabase/migrations/20251115000000_extend_sale_offers_for_buyer_types.sql
```

---

## 🆘 Si nada funciona

1. **Toma un screenshot de:**
   - La consola del navegador con todos los logs
   - La terminal donde corre npm run dev
   - La URL en la barra del navegador

2. **Reporta:**
   - ¿Qué logs aparecen en la consola?
   - ¿Hay algún error en rojo?
   - ¿En qué paso específico falla?
   - ¿Estás viendo una propiedad de venta o arriendo?

3. **Información adicional útil:**
   - Navegador y versión
   - Sistema operativo
   - Tipo de propiedad que estás viendo

