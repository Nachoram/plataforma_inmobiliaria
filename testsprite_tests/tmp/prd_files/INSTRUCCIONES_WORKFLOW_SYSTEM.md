# 🚀 **Sistema de Workflow Completo - Instrucciones de Despliegue**

## ✅ **Estado Actual**

El sistema completo de generación y visualización de informes HTML ha sido implementado exitosamente. Todos los archivos están creados y el código TypeScript compila sin errores.

### **Archivos Creados:**
- ✅ `src/components/common/HTMLCanvasViewer.tsx`
- ✅ `20251003150000_create_workflow_outputs_system.sql`
- ✅ `supabase/functions/get-workflow-html/index.ts`
- ✅ `src/lib/api/workflow.ts`
- ✅ `src/components/workflow/WorkflowResultPage.tsx`
- ✅ `test_workflow_system.sql`

---

## 🔧 **Pasos para Completar la Implementación**

### **1. Aplicar Migración de Base de Datos**

Ejecuta el archivo SQL en tu base de datos de Supabase:

```sql
-- Ejecutar en el SQL Editor de Supabase Dashboard
-- Archivo: 20251003150000_create_workflow_outputs_system.sql
```

**Opciones alternativas:**
- Copia y pega el contenido del archivo en el SQL Editor
- Usa el comando de Supabase CLI si tienes acceso configurado

### **2. Verificar la Migración**

Ejecuta el script de verificación:

```sql
-- Ejecutar en el SQL Editor de Supabase Dashboard
-- Archivo: test_workflow_system.sql
```

Deberías ver mensajes como:
```
✅ Tabla workflow_outputs existe
✅ Todas las columnas de workflow_outputs existen
✅ RLS habilitado en workflow_outputs
✅ Bucket workflow-outputs existe en Storage
🎉 SISTEMA DE WORKFLOW VERIFICADO EXITOSAMENTE
```

### **3. Desplegar Edge Function**

```bash
# Iniciar sesión en Supabase (si no está hecho)
npx supabase login

# Desplegar la función
npx supabase functions deploy get-workflow-html
```

---

## 🎯 **Cómo Usar el Sistema**

### **Opción 1: Componente Completo (Recomendado)**

```typescript
import { WorkflowResultPage } from '@/components/workflow/WorkflowResultPage';

// En tu aplicación
function MyPage() {
  return (
    <WorkflowResultPage
      workflowType="informe_mensual_propiedad"
      propertyId="uuid-opcional-de-propiedad"
    />
  );
}
```

### **Opción 2: Uso Programático**

```typescript
import { generateWorkflowOutput, getHtmlContentFromStorage, HTMLCanvasViewer } from '@/lib/api/workflow';

function CustomWorkflowComponent() {
  const [htmlContent, setHtmlContent] = useState<string | null>(null);

  const generateReport = async () => {
    try {
      // Generar informe
      const storagePath = await generateWorkflowOutput('informe_mensual_propiedad');

      // Descargar contenido
      const content = await getHtmlContentFromStorage(storagePath);

      // Mostrar en canvas
      setHtmlContent(content);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div>
      <button onClick={generateReport}>Generar Informe</button>
      {htmlContent && <HTMLCanvasViewer htmlString={htmlContent} />}
    </div>
  );
}
```

---

## 📋 **Flujo Completo del Sistema**

1. **Usuario** hace clic en "Generar Informe"
2. **Frontend** llama a `generateWorkflowOutput()`
3. **Edge Function** genera HTML dinámico
4. **Storage** guarda el archivo HTML
5. **Base de datos** registra metadatos
6. **Frontend** descarga HTML desde Storage
7. **HTMLCanvasViewer** convierte HTML a imagen en canvas
8. **Usuario** ve el informe renderizado

---

## 🔒 **Seguridad Implementada**

- ✅ **RLS habilitado** en tabla `workflow_outputs`
- ✅ **Políticas de acceso** solo para propietario
- ✅ **Bucket privado** `workflow-outputs`
- ✅ **Políticas Storage** con control de carpetas
- ✅ **Autenticación requerida** en Edge Function

---

## 🎨 **Características del Sistema**

### **HTMLCanvasViewer**
- Conversión HTML → Canvas automática
- Manejo de errores y estados de carga
- Optimización de DOM (limpieza automática)
- Responsive y accesible

### **Edge Function**
- Generación de informes HTML dinámicos
- Almacenamiento seguro en Storage
- Registro completo de metadatos
- Manejo robusto de errores

### **API Frontend**
- Funciones async/await modernas
- Tipado TypeScript completo
- Manejo de errores consistente
- Funciones helper adicionales

---

## 🧪 **Tipos de Workflow Disponibles**

```typescript
import { WORKFLOW_TYPES } from '@/lib/api/workflow';

WORKFLOW_TYPES.INFORME_MENSUAL_PROPIEDAD  // 'informe_mensual_propiedad'
WORKFLOW_TYPES.REPORTE_FINANCIERO         // 'reporte_financiero'
WORKFLOW_TYPES.ANALISIS_MERCADO          // 'analisis_mercado'
WORKFLOW_TYPES.ESTADO_CUENTA             // 'estado_cuenta'
WORKFLOW_TYPES.HISTORIAL_TRANSACCIONES   // 'historial_transacciones'
```

---

## 🚨 **Solución de Problemas**

### **Error: "relation migration_log does not exist"**
✅ **SOLUCIONADO**: La migración ya fue corregida y no incluye referencias a `migration_log`.

### **Error: "Bucket workflow-outputs no existe"**
- Verificar que la migración se aplicó correctamente
- Revisar permisos de administrador en Supabase

### **Error: "Usuario no autenticado"**
- Verificar que el usuario esté logueado
- Revisar configuración de autenticación de Supabase

### **Error: "Función no encontrada"**
- Verificar que la Edge Function se desplegó correctamente
- Revisar logs de Supabase Functions

---

## 📊 **Monitoreo y Debugging**

### **Verificar Registros Generados:**
```sql
SELECT
  id,
  workflow_type,
  output_storage_path,
  file_size_bytes,
  created_at
FROM workflow_outputs
WHERE user_id = auth.uid()
ORDER BY created_at DESC;
```

### **Verificar Archivos en Storage:**
- Ir al dashboard de Supabase → Storage → workflow-outputs
- Los archivos están organizados por usuario: `{user_id}/{filename}.html`

---

## 🎉 **¡Sistema Listo para Usar!**

Una vez completados los pasos de despliegue, el sistema estará completamente funcional y listo para generar informes HTML dinámicos que se visualizan como imágenes en canvas.

**¿Necesitas ayuda con algún paso específico?**
