# 🚀 EJECUTA ESTO AHORA - Solución Rápida

## 📝 Sigue estos 2 pasos:

---

## PASO 1: Diagnóstico (1 minuto)

1. Abre **Supabase Dashboard** → **SQL Editor**
2. Crea una **nueva query**
3. Abre el archivo `FIX_DOCUMENTOS_DIAGNOSTICO.sql`
4. **Copia TODO** y pega en SQL Editor
5. Click **Run** (o F5)
6. **Mira los mensajes** que aparecen

Te dirá si tienes o no la columna "id".

---

## PASO 2: Ejecutar corrección (2 minutos)

1. En **SQL Editor**, crea una **nueva query**
2. Abre el archivo `FIX_DOCUMENTOS_ALTERNATIVA.sql`
3. **Copia TODO** y pega en SQL Editor
4. Click **Run** (o F5)
5. **Listo!** ✅

---

## ✅ Verificación Final

Ejecuta esto para confirmar que todo está OK:

```sql
SELECT 'applicant_documents' as tabla, COUNT(*) as registros FROM applicant_documents
UNION ALL
SELECT 'guarantor_documents' as tabla, COUNT(*) as registros FROM guarantor_documents;
```

Deberías ver:
```
tabla                  | registros
-----------------------|----------
applicant_documents    | 0
guarantor_documents    | 0
```

**0 registros es OK** (están vacías porque son nuevas) ✅

---

## 📁 Archivos que necesitas:

1. `FIX_DOCUMENTOS_DIAGNOSTICO.sql` - Para ver qué pasa
2. `FIX_DOCUMENTOS_ALTERNATIVA.sql` - Para crear las tablas

---

## ⚠️ Si hay error en PASO 2:

**Copia el mensaje de error completo** y pégalo aquí, te ayudaré a solucionarlo.

---

**¡Empieza con PASO 1 y cuéntame qué te dice!** 👇

