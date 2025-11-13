# 🧪 Instrucciones para Probar el Formulario de Ofertas

## ⚡ Pasos Inmediatos

### 1️⃣ **Reinicia el Servidor de Desarrollo**

En tu terminal donde corre el proyecto:

```bash
# Detén el servidor (Ctrl + C)
# Luego reinicia:
npm run dev
```

Espera a que diga algo como:
```
  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

### 2️⃣ **Limpia Completamente el Caché del Navegador**

**Opción A - Hard Refresh:**
- Windows/Linux: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

**Opción B - Desde DevTools (RECOMENDADO):**
1. Abre DevTools (F12)
2. Mantén presionado el botón de recargar (al lado de la barra de URL)
3. Selecciona: **"Vaciar caché y volver a cargar de manera forzada"**

**Opción C - Limpia todo el caché:**
1. `Ctrl + Shift + Delete`
2. Selecciona "Imágenes y archivos en caché"
3. Clic en "Borrar datos"

---

### 3️⃣ **Abre la Consola del Navegador**

1. Presiona `F12` para abrir DevTools
2. Ve a la pestaña **"Console"**
3. Déjala abierta para ver los logs

---

### 4️⃣ **Prueba el Formulario**

#### **Opción A: Desde el Panel Principal**

1. Ve a la página principal: `http://localhost:5173/`
2. Busca una propiedad que diga **"Venta"** (NO "Arriendo")
3. Haz clic en el botón **"Ofertar"** (tiene un ícono 📈)

#### **Opción B: Desde Detalles de Propiedad**

1. Entra a cualquier propiedad de venta
2. Scroll hacia abajo hasta ver el sidebar derecho
3. Haz clic en **"Hacer Oferta de Compra"**

---

## ✅ ¿Qué Deberías Ver?

### En la consola del navegador:
```
🚀 Navigating to: /ofertas/nueva/[algún-id]
🟢 SaleOfferPage rendered, propertyId: [algún-id]
```

### En la pantalla:
Un **formulario completo** con estas secciones:

```
┌─────────────────────────────────────────┐
│   Hacer Oferta de Compra                │
├─────────────────────────────────────────┤
│                                         │
│   Información de la Propiedad           │
│   (dirección, precio)                   │
│                                         │
│   ○ Persona Natural  ○ Persona Jurídica│
│                                         │
│   Datos Personales/Empresariales        │
│   [Campos de formulario]                │
│                                         │
│   Datos de Contacto                     │
│   [Email, Teléfono]                     │
│                                         │
│   Detalles de la Oferta                 │
│   [Monto, Mensaje]                      │
│                                         │
│   Financiamiento                        │
│   ☐ Crédito Preaprobado                 │
│   ☐ Ejecutivo Bancario                  │
│                                         │
│   Documentos Respaldatorios             │
│   [Upload de archivos]                  │
│                                         │
│   [Cancelar]  [Enviar Oferta]          │
└─────────────────────────────────────────┘
```

---

## ❌ Si Todavía Ves el Modal Antiguo

### El modal antiguo se ve así:
- Ventana pequeña emergente
- Solo 2 campos: monto y mensaje
- Fondo oscuro detrás

### Solución:

1. **Verifica la URL en la barra del navegador:**
   - ¿Cambió a `/ofertas/nueva/...`? 
     - **SÍ:** El formulario debería cargar
     - **NO:** Hay un problema con la navegación

2. **Verifica los logs en la consola:**
   - ¿Aparece el emoji 🚀 y 🟢?
     - **NO:** Comparte los errores que aparecen

3. **Intenta en modo incógnito:**
   ```
   Ctrl + Shift + N (Chrome)
   Ctrl + Shift + P (Firefox)
   ```

4. **Verifica que el servidor se reinició correctamente:**
   - Busca errores en rojo en la terminal
   - Debe decir "ready" o mostrar la URL local

---

## 📸 Toma Screenshots

Si todavía hay problemas, toma screenshots de:

1. **La consola del navegador** (pestaña Console)
2. **La terminal** donde corre `npm run dev`
3. **Lo que aparece en pantalla** cuando haces clic en "Ofertar"
4. **La barra de URL** del navegador

Y compártelos para poder ayudarte mejor.

---

## 🎯 Verificación Rápida

Ejecuta esto en la consola del navegador:

```javascript
// Copia y pega esto en la consola
console.log('Test navigation');
window.location.href = '/ofertas/nueva/test-123';
```

- Si navega a una nueva página → El routing funciona ✅
- Si no pasa nada → Hay un problema con el router ❌

---

## 💡 Comandos Útiles

### Verificar que los archivos existen:
```bash
# En la terminal del proyecto
dir src\components\sales\SaleOfferPage.tsx
dir src\components\sales\SaleOfferForm.tsx
```

Deberían mostrar que los archivos existen.

### Verificar errores de compilación:
Revisa la terminal donde corre `npm run dev` y busca líneas en rojo.

---

## ✨ Una Vez que Funcione

Completa el formulario:

1. Selecciona "Persona Natural"
2. Completa nombre y apellidos
3. Agrega un monto (ej: 100000000)
4. Escribe un mensaje
5. (Opcional) Marca "Tiene ejecutivo bancario" y agrega uno
6. Haz clic en "Enviar Oferta"

Deberías ser redirigido a `/my-offers` y ver un mensaje de éxito.

---

**¿Listo para probar? Reinicia el servidor y prueba! 🚀**

