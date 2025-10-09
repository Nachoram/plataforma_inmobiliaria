# ✅ CHECKLIST DE VERIFICACIÓN - Integración ContractCanvasEditor

**Fecha de Verificación:** _______________  
**Verificado por:** _______________

---

## 🔍 PRE-VERIFICACIÓN

### Archivos Modificados
- [ ] `src/components/contracts/ContractCanvasEditor.tsx` - Existe y está actualizado
- [ ] `src/components/contracts/ContractCanvasEditorPage.tsx` - Existe y está actualizado
- [ ] `src/components/contracts/ContractManagementPage.tsx` - Existe y está actualizado
- [ ] `src/components/AppContent.tsx` - Ruta de prueba eliminada
- [ ] `src/components/contracts/TestCanvasEditor.tsx` - **NO debe existir** (eliminado)

### Compilación
- [ ] `npm run build` - Sin errores
- [ ] `npm run dev` - Aplicación inicia correctamente
- [ ] Consola del navegador - Sin errores críticos

---

## 🧪 TESTING FUNCIONAL

### 1. Navegación a Lista de Contratos
- [ ] Ir a `/contracts`
- [ ] Se muestra la lista de contratos
- [ ] Cada contrato tiene dos botones:
  - [ ] 🔵 "Ver Contrato"
  - [ ] 🟣 "Editar Contrato"

### 2. Acceso al Editor
- [ ] Click en "Editar Contrato" en cualquier tarjeta
- [ ] Se carga `/contracts/:id/canvas-editor`
- [ ] Se muestra el header con:
  - [ ] Botón "Volver a Contratos"
  - [ ] Título "Editor de Contrato"
  - [ ] Número o ID del contrato

### 3. Editor Canvas - Carga de Datos
- [ ] Se muestra el contrato completo
- [ ] Tiene la barra de herramientas sticky (superior)
- [ ] Botones visibles:
  - [ ] "Añadir Cláusula"
  - [ ] "Guardar Cambios" (morado)
  - [ ] "Descargar PDF" (verde)

### 4. Edición de Texto
- [ ] Click en el título del contrato
  - [ ] Aparece campo de edición con fondo azul
  - [ ] El campo es editable
  - [ ] Click fuera → vuelve a modo vista
  
- [ ] Click en comparecencia
  - [ ] Editable correctamente
  
- [ ] Click en título de cláusula
  - [ ] Editable correctamente
  
- [ ] Click en contenido de cláusula
  - [ ] Editable correctamente
  - [ ] Campo se expande al escribir

- [ ] Click en datos de firmante
  - [ ] Nombre editable
  - [ ] RUT editable
  - [ ] Rol editable

### 5. Agregar Elementos
- [ ] Click en "Añadir Cláusula"
  - [ ] Aparece nueva cláusula al final
  - [ ] Título editable: "NUEVA CLÁUSULA"
  - [ ] Contenido editable
  
- [ ] Click en "Añadir Firmante"
  - [ ] Aparece nuevo firmante al final
  - [ ] Todos los campos editables

### 6. Eliminar Elementos
- [ ] Hover sobre cláusula
  - [ ] Aparece botón 🗑️ rojo
  - [ ] Click elimina la cláusula
  
- [ ] Hover sobre firmante
  - [ ] Aparece botón 🗑️ rojo
  - [ ] Click elimina el firmante

### 7. Función de Guardado
- [ ] Hacer un cambio en el contrato
- [ ] Click en "Guardar Cambios"
- [ ] Botón cambia a "Guardando..."
- [ ] Botón cambia a "Guardado ✓" (verde)
- [ ] Mensaje desaparece después de 3 segundos
- [ ] **CRÍTICO:** Verificar en base de datos:
  ```sql
  SELECT contract_content, updated_at 
  FROM rental_contracts 
  WHERE id = '[el ID del contrato]';
  ```
  - [ ] El `contract_content` tiene los cambios
  - [ ] El `updated_at` se actualizó

### 8. Manejo de Errores
- [ ] Intentar editar sin permisos (si es posible)
  - [ ] Muestra alerta de error
  
- [ ] Desconectar internet y guardar
  - [ ] Muestra alerta de error
  - [ ] No muestra "Guardado ✓" falso

### 9. Descarga de PDF
- [ ] Click en "Descargar PDF"
- [ ] Se descarga archivo `contrato-final-profesional.pdf`
- [ ] Abrir el PDF:
  - [ ] Tiene márgenes (1.5cm aprox)
  - [ ] Fuente serif profesional
  - [ ] Paginación correcta
  - [ ] Sin botones de UI
  - [ ] Sin elementos de edición visibles
  - [ ] Contenido completo

### 10. Navegación desde Viewer
- [ ] Ir a `/contract/:id` (vista de solo lectura)
- [ ] Click en botón "Editar"
- [ ] Se abre el editor canvas
- [ ] Funcionalidad completa

---

## 🔐 VERIFICACIÓN DE SEGURIDAD

### RLS Policies
- [ ] Intentar editar contrato de otro usuario
  - [ ] NO debe permitir guardado
  - [ ] Debe mostrar error de permisos
  
- [ ] Verificar políticas en Supabase Dashboard
  - [ ] Policy "Owners can update contracts" existe
  - [ ] Policy está ENABLED

### Validación de Datos
- [ ] Guardar contrato con ID inválido
  - [ ] Muestra error apropiado
  
- [ ] Guardar sin contractId prop
  - [ ] Botón "Guardar Cambios" no aparece

---

## 📱 TESTING DE UI/UX

### Responsive Design
- [ ] Desktop (1920x1080)
  - [ ] Editor se ve correctamente
  - [ ] Todos los botones accesibles
  
- [ ] Tablet (768px)
  - [ ] Layout se adapta
  - [ ] Texto legible
  
- [ ] Mobile (375px)
  - [ ] Edición posible (aunque limitada)
  - [ ] Botones accesibles

### Accesibilidad
- [ ] Tab navigation funciona
- [ ] Hover states visibles
- [ ] Feedback visual claro
- [ ] Mensajes de error legibles

### Performance
- [ ] Carga inicial < 2 segundos
- [ ] Guardado completa < 1 segundo
- [ ] Generación PDF < 5 segundos
- [ ] Sin lag al escribir

---

## 🗄️ VERIFICACIÓN DE BASE DE DATOS

### Estructura
```sql
\d rental_contracts
```
- [ ] Columna `contract_content` existe (JSONB)
- [ ] Columna `updated_at` existe (TIMESTAMP)
- [ ] Columna `contract_html` existe (TEXT)
- [ ] Columna `contract_format` existe (VARCHAR)

### Datos
```sql
SELECT * FROM rental_contracts LIMIT 1;
```
- [ ] `contract_content` tiene estructura correcta:
  ```json
  {
    "titulo": "...",
    "comparecencia": "...",
    "clausulas": [...],
    "cierre": "...",
    "firmantes": [...]
  }
  ```

### Permisos
```sql
SELECT * FROM pg_policies WHERE tablename = 'rental_contracts';
```
- [ ] Policies de SELECT existen
- [ ] Policies de UPDATE existen
- [ ] Policies de INSERT existen

---

## 📊 VERIFICACIÓN DE INTEGRACIÓN

### Flujo Completo (End-to-End)
1. [ ] Login como propietario
2. [ ] Ir a `/contracts`
3. [ ] Click en "Editar Contrato"
4. [ ] Modificar título del contrato
5. [ ] Agregar nueva cláusula
6. [ ] Eliminar una cláusula
7. [ ] Modificar datos de firmante
8. [ ] Click en "Guardar Cambios"
9. [ ] Esperar "Guardado ✓"
10. [ ] Click en "Volver a Contratos"
11. [ ] Volver a entrar al mismo contrato
12. [ ] **Verificar que los cambios persisten**

### Compatibilidad de Datos
- [ ] Contratos nuevos (formato canvas) funcionan
- [ ] Contratos antiguos (si existen) se manejan correctamente
- [ ] No se pierden datos al guardar
- [ ] `updated_at` se actualiza correctamente

---

## 📚 VERIFICACIÓN DE DOCUMENTACIÓN

### Archivos Creados
- [ ] `INTEGRACION_CANVAS_EDITOR_COMPLETA.md` existe
- [ ] `GUIA_USO_EDITOR_CANVAS.md` existe
- [ ] `verificar_integracion_canvas.sql` existe
- [ ] `RESUMEN_INTEGRACION_FINAL.md` existe
- [ ] `CHECKLIST_VERIFICACION.md` existe (este archivo)

### Contenido
- [ ] Documentación técnica completa
- [ ] Guía de usuario clara y detallada
- [ ] Scripts SQL funcionan correctamente
- [ ] Ejemplos de código son correctos

---

## 🚨 CHECKLIST DE PRODUCCIÓN

### Pre-Deploy
- [ ] Todos los tests anteriores pasan
- [ ] No hay errores en consola
- [ ] No hay warnings críticos
- [ ] Performance es aceptable
- [ ] Seguridad verificada

### Deploy
- [ ] Backup de base de datos realizado
- [ ] Migraciones aplicadas (si hay)
- [ ] Variables de entorno configuradas
- [ ] Build de producción exitoso

### Post-Deploy
- [ ] Funcionalidad básica verificada en producción
- [ ] Monitoreo activo por 24h
- [ ] Plan de rollback preparado
- [ ] Documentación actualizada

---

## 📝 NOTAS Y OBSERVACIONES

### Problemas Encontrados:
```
_______________________________________________________________________
_______________________________________________________________________
_______________________________________________________________________
```

### Mejoras Sugeridas:
```
_______________________________________________________________________
_______________________________________________________________________
_______________________________________________________________________
```

### Bugs a Reportar:
```
_______________________________________________________________________
_______________________________________________________________________
_______________________________________________________________________
```

---

## ✅ APROBACIÓN FINAL

### Verificado por Roles:

**Developer:**
- Nombre: _______________
- Fecha: _______________
- Firma: _______________
- Status: [ ] APROBADO [ ] REQUIERE CAMBIOS

**QA/Tester:**
- Nombre: _______________
- Fecha: _______________
- Firma: _______________
- Status: [ ] APROBADO [ ] REQUIERE CAMBIOS

**Product Owner:**
- Nombre: _______________
- Fecha: _______________
- Firma: _______________
- Status: [ ] APROBADO [ ] REQUIERE CAMBIOS

---

## 🎯 RESULTADO FINAL

**Items Verificados:** _____ / _____  
**Porcentaje de Éxito:** _____ %  

**Status General:**
- [ ] ✅ LISTO PARA PRODUCCIÓN
- [ ] ⚠️ REQUIERE AJUSTES MENORES
- [ ] ❌ REQUIERE TRABAJO ADICIONAL

---

**Fecha de Verificación:** _______________  
**Próxima Revisión:** _______________  
**Notas Finales:** 
```
_______________________________________________________________________
_______________________________________________________________________
_______________________________________________________________________
```

