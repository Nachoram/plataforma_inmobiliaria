# Componentes de Contratos

Este directorio contiene componentes especializados para la gestión de contratos de arriendo.

## RentalContractConditionsForm.tsx

**Fecha de creación:** 28 de octubre de 2025

### Descripción

Componente independiente que maneja el formulario completo para confirmar y gestionar las condiciones de contratos de arriendo.

### Origen

Este componente fue extraído de `AdminPropertyDetailView.tsx` como parte de una refactorización para:

- **Facilitar el mantenimiento**: Aislar la lógica de contratos de la vista administrativa
- **Mejorar la reutilización**: Permitir usar el formulario en diferentes flujos
- **Simplificar testing**: Componente independiente más fácil de probar
- **Mejorar la organización**: Separación clara de responsabilidades

### Funcionalidades

El componente maneja de forma autónoma:

1. **UI Completa del Formulario**
   - Campos básicos: fecha de inicio, duración, garantía, día de pago
   - Precio final y datos del corredor
   - Condiciones especiales según tipo de propiedad (Casa, Departamento, Bodega, Estacionamiento)
   - Cláusula DICOM
   - Condiciones de pago y datos bancarios
   - Email de notificación oficial

2. **Validaciones en Tiempo Real**
   - Validación de campos obligatorios
   - Formato de email
   - Formato de RUT del corredor
   - Rangos numéricos (montos, días, etc.)

3. **Gestión de Estado**
   - Estado completo del formulario
   - Errores de validación
   - Loading states durante el submit

4. **Integración con Backend**
   - Consultas a Supabase para obtener datos de características
   - Creación/actualización de registros en `rental_contract_conditions`
   - Creación/actualización de registros en `rental_contracts`
   - Envío de webhook a n8n para generación del contrato

### Props

```typescript
interface RentalContractConditionsFormProps {
  property: Property;              // Datos de la propiedad
  selectedProfile: SelectedProfile; // Datos del postulante seleccionado
  onSuccess?: () => void;          // Callback cuando se genera exitosamente
  onClose: () => void;             // Callback para cerrar el modal
}
```

### Uso

```typescript
import { RentalContractConditionsForm } from '../contracts/RentalContractConditionsForm';

// En tu componente:
{isContractModalOpen && selectedProfile && property && (
  <RentalContractConditionsForm
    property={property}
    selectedProfile={selectedProfile}
    onSuccess={() => {
      console.log('Contrato generado con éxito');
      // Acciones adicionales...
    }}
    onClose={() => setIsContractModalOpen(false)}
  />
)}
```

### Dependencias Externas

- **Supabase**: Para consultas y mutaciones de datos
- **react-hot-toast**: Para notificaciones
- **lucide-react**: Para iconos
- **n8n webhook**: Para generación del contrato (variable de entorno `VITE_N8N_CONTRACT_WEBHOOK_URL`)

### Flujo de Trabajo

1. Usuario abre el formulario desde `AdminPropertyDetailView`
2. Formulario se inicializa con datos vacíos o pre-cargados
3. Usuario completa los campos requeridos
4. Validaciones en tiempo real al editar cada campo
5. Al hacer submit:
   - Se validan todos los campos
   - Se obtienen IDs de características desde Supabase
   - Se guardan condiciones en `rental_contract_conditions`
   - Se crea/actualiza registro en `rental_contracts`
   - Se envía payload completo al webhook de n8n
   - Se notifica éxito o error al usuario
   - Se cierra el modal

### Notas Técnicas

- El componente es completamente autónomo y no depende del estado de componentes padres (excepto las props que recibe)
- Toda la lógica de validación, transformación de datos y comunicación con el backend está encapsulada
- Los errores de Supabase se formatean en mensajes user-friendly
- Los campos condicionales se muestran/ocultan según el tipo de propiedad

### Futuras Mejoras

- [ ] Agregar tests unitarios
- [ ] Implementar guardado de borrador automático
- [ ] Agregar preview del contrato antes de enviar
- [ ] Soporte para múltiples idiomas
- [ ] Historial de versiones del contrato

---

## Migración desde AdminPropertyDetailView

Si necesitas actualizar código que referenciaba el formulario en `AdminPropertyDetailView`, ten en cuenta:

**Antes:**
```typescript
// El formulario estaba incrustado directamente en AdminPropertyDetailView
{/* Modal de Condiciones de Contrato */}
{isContractModalOpen && selectedProfile && property && (
  <div className="fixed inset-0 bg-black bg-opacity-60...">
    {/* 600+ líneas de código del formulario */}
  </div>
)}
```

**Después:**
```typescript
// Ahora se usa el componente dedicado
{isContractModalOpen && selectedProfile && property && (
  <RentalContractConditionsForm
    property={property}
    selectedProfile={selectedProfile}
    onSuccess={() => {
      console.log('✅ Contrato generado con éxito');
    }}
    onClose={() => setIsContractModalOpen(false)}
  />
)}
```

### Código Eliminado de AdminPropertyDetailView

Los siguientes elementos fueron removidos porque ahora están en `RentalContractConditionsForm`:

- ❌ Interface `ContractConditionsFormData`
- ❌ Estados: `formData`, `formErrors`, `isGenerating`, `error`, `isSubmittingContract`
- ❌ Función `calculateEndDate`
- ❌ Función `validateField`
- ❌ Función `handleContractFormChange`
- ❌ Función `fetchContractData`
- ❌ Función `createOrUpdateRentalContract`
- ❌ Función `mapFormDataToDatabase`
- ❌ Función `handleGenerateContract`
- ❌ useEffect para cargar condiciones existentes
- ❌ useEffect para obtener el usuario actual (relacionado al formulario)
- ❌ Todo el JSX del modal (600+ líneas)

---

**Autor:** Plataforma Inmobiliaria  
**Última actualización:** 28 de octubre de 2025

