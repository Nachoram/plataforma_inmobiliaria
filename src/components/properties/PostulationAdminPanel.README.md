# PostulationAdminPanel

## 📋 Descripción

`PostulationAdminPanel` es un componente dedicado para la gestión administrativa de postulaciones de propiedades en arrendamiento. Este componente encapsula toda la funcionalidad relacionada con la revisión, evaluación y procesamiento de solicitudes de arrendamiento por parte de propietarios y administradores.

## 🎯 Motivación y Justificación

### ¿Por qué se creó este componente?

Este componente fue extraído de `AdminPropertyDetailView.tsx` el 28 de octubre de 2025 como parte de una refactorización para mejorar la arquitectura del código:

1. **Separación de Responsabilidades**: `AdminPropertyDetailView` se estaba volviendo demasiado grande y complejo, manejando tanto la visualización de propiedades como la gestión de postulaciones.

2. **Escalabilidad**: Al separar la gestión de postulaciones, facilitamos futuras integraciones de roles/permisos específicos sin afectar otras partes del sistema.

3. **Mantenibilidad**: Un componente dedicado es más fácil de mantener, testear y evolucionar.

4. **Reutilización**: Este componente puede ser utilizado en otros contextos de la aplicación donde se necesite gestionar postulaciones.

5. **Reducción de Acoplamiento**: Disminuye las dependencias entre módulos y facilita el desarrollo paralelo de features.

## 🔧 Características Principales

### Funcionalidades Implementadas

- ✅ **Visualización de Postulaciones**: Tabla completa con información clave de cada postulante
- ✅ **Detalles del Postulante**: Modal con información detallada del aplicante y su aval
- ✅ **Score de Riesgo**: Visualización del score crediticio con código de colores
- ✅ **Estados de Postulación**: Seguimiento visual del estado (En Revisión, Aprobado, Rechazado)
- ✅ **Acciones Administrativas**:
  - Solicitar Informe Comercial
  - Solicitar Documentación
  - Enviar Documentos
  - Aceptar Postulación y Generar Contrato
- ✅ **Integración con Contratos**: Flujo completo de aceptación que abre el formulario de condiciones contractuales
- ✅ **Manejo de Errores**: Sistema robusto de manejo y visualización de errores

### Funcionalidades Pendientes (TODOs en el código)

- ⏳ **Cálculo de Score Real**: Actualmente se muestra un score fijo (750), debe calcularse basado en datos reales
- ⏳ **Datos de Ingresos**: Integrar información real de ingresos del postulante y aval
- ⏳ **Situación Laboral**: Agregar información laboral detallada si está disponible en la BD
- ⏳ **Implementar Acciones**: Las acciones de "Solicitar Informe Comercial", "Solicitar Documentación" y "Enviar Documentos" actualmente muestran mensajes de desarrollo

## 📦 Props

```typescript
interface PostulationAdminPanelProps {
  propertyId: string;  // UUID de la propiedad
  property: Property;  // Objeto completo de la propiedad (necesario para generación de contratos)
}
```

### Detalles de Props

#### `propertyId` (string, requerido)
- **Descripción**: Identificador único de la propiedad
- **Formato**: UUID (ej: "123e4567-e89b-12d3-a456-426614174000")
- **Uso**: Se utiliza para filtrar las postulaciones específicas de esta propiedad

#### `property` (Property, requerido)
- **Descripción**: Objeto completo de la propiedad con toda su información
- **Uso**: Necesario para el componente `RentalContractConditionsForm` al generar contratos
- **Campos importantes**:
  - `address_street`, `address_number`: Dirección de la propiedad
  - `price_clp`: Precio mensual de arriendo
  - `bedrooms`, `bathrooms`: Características de la propiedad

## 🎨 Estructura del Componente

### Jerarquía de Componentes

```
PostulationAdminPanel
├── Tabla de Postulaciones
│   ├── Header (columnas)
│   ├── Filas de postulaciones
│   │   ├── Avatar del postulante
│   │   ├── Nombre
│   │   ├── Fecha
│   │   ├── Score (con color)
│   │   ├── Estado (badge)
│   │   └── Botón "Administrar"
│   └── Footer (resumen)
│
├── Modal de Detalles
│   ├── Header con avatar y badges
│   ├── Grid de información
│   │   ├── Perfil del Postulante
│   │   │   ├── Email
│   │   │   ├── Teléfono
│   │   │   ├── Renta Mensual
│   │   │   └── Situación Laboral
│   │   └── Datos del Aval
│   │       ├── Nombre
│   │       ├── Email
│   │       ├── Renta Mensual
│   │       └── Capacidad de Pago Total
│   ├── Panel de Acciones
│   │   ├── Solicitar Informe Comercial
│   │   ├── Solicitar Documentación
│   │   ├── Enviar Documentos
│   │   └── Aceptar Postulación
│   └── Footer con botón Cerrar
│
└── Modal de Contrato
    └── RentalContractConditionsForm
```

## 💾 Integración con Supabase

### Query de Postulaciones

El componente realiza la siguiente consulta a Supabase:

```typescript
const { data, error } = await supabase
  .from('applications')
  .select(`
    id,
    applicant_id,
    guarantor_id,
    status,
    created_at,
    message,
    application_characteristic_id,
    guarantor_characteristic_id,
    profiles!applicant_id (
      first_name,
      paternal_last_name,
      maternal_last_name,
      email,
      phone
    ),
    guarantors!guarantor_id (
      first_name,
      rut
    )
  `)
  .eq('property_id', propertyId)
  .order('created_at', { ascending: false });
```

### Tablas Utilizadas

- **applications**: Tabla principal de postulaciones
- **profiles**: Información del postulante (join via `applicant_id`)
- **guarantors**: Información del aval (join via `guarantor_id`)

## 🎭 Estados del Componente

### Estados Locales

```typescript
const [postulations, setPostulations] = useState<Postulation[]>([]);
const [loading, setLoading] = useState(true);
const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
const [selectedProfile, setSelectedProfile] = useState<Postulation | null>(null);
const [isContractModalOpen, setIsContractModalOpen] = useState(false);
```

### Ciclo de Vida

1. **Montaje**: Al montarse, el componente carga las postulaciones de la propiedad
2. **Carga**: Muestra un spinner mientras se obtienen los datos
3. **Sin Datos**: Si no hay postulaciones, muestra un mensaje informativo
4. **Con Datos**: Renderiza la tabla con todas las postulaciones
5. **Interacción**: Usuario puede abrir modales y realizar acciones
6. **Recarga**: Después de ciertas acciones (ej: generar contrato), se recargan las postulaciones

## 🔗 Dependencias

### Componentes Externos

- `RentalContractConditionsForm`: Formulario de generación de contratos de arriendo
- `lucide-react`: Iconos utilizados en toda la interfaz
- `react-hot-toast`: Sistema de notificaciones toast

### Bibliotecas

```json
{
  "react": "^18.x",
  "lucide-react": "^0.x",
  "react-hot-toast": "^2.x",
  "@supabase/supabase-js": "^2.x"
}
```

## 📝 Ejemplos de Uso

### Uso Básico

```tsx
import { PostulationAdminPanel } from './components/properties/PostulationAdminPanel';

function PropertyManagement() {
  const property = {
    id: 'prop-123',
    // ... otros campos de la propiedad
  };

  return (
    <div>
      <h1>Gestión de Propiedad</h1>
      <PostulationAdminPanel 
        propertyId={property.id} 
        property={property} 
      />
    </div>
  );
}
```

### Uso Condicional (Solo para Propietarios)

```tsx
import { PostulationAdminPanel } from './components/properties/PostulationAdminPanel';
import { useAuth } from '../../hooks/useAuth';

function AdminPropertyDetailView() {
  const { user } = useAuth();
  const property = /* ... */;
  
  const isOwner = user?.id === property.owner_id;

  return (
    <div>
      {/* Información de la propiedad */}
      
      {/* Panel de postulaciones solo visible para el propietario */}
      {isOwner && property && (
        <PostulationAdminPanel 
          propertyId={property.id} 
          property={property} 
        />
      )}
    </div>
  );
}
```

## 🧪 Testing

### Archivo de Tests

Los tests se encuentran en: `src/components/properties/__tests__/PostulationAdminPanel.test.tsx`

### Cobertura de Tests

- ✅ Renderizado básico
- ✅ Carga de datos desde Supabase
- ✅ Manejo de estados (carga, sin datos, con datos)
- ✅ Apertura y cierre de modales
- ✅ Acciones administrativas (clicks en botones)
- ✅ Flujo de aceptación y generación de contrato
- ✅ Manejo de errores
- ✅ Validaciones de propertyId
- ✅ Visualización de scores y estados
- ✅ Postulaciones con y sin aval

### Ejecutar Tests

```bash
# Ejecutar todos los tests
npm test

# Ejecutar solo tests de PostulationAdminPanel
npm test PostulationAdminPanel

# Ejecutar con coverage
npm test -- --coverage
```

## 🎨 Personalización y Estilos

### Sistema de Colores

El componente utiliza un sistema de colores basado en Tailwind CSS:

#### Scores de Riesgo
- **Verde** (`score > 750`): Bajo riesgo - `text-green-600 bg-green-50`
- **Amarillo** (`650 ≤ score ≤ 750`): Riesgo medio - `text-yellow-600 bg-yellow-50`
- **Rojo** (`score < 650`): Alto riesgo - `text-red-600 bg-red-50`

#### Estados de Postulación
- **Aprobado**: `bg-green-100 text-green-800 border-green-200`
- **Rechazado**: `bg-red-100 text-red-800 border-red-200`
- **En Revisión**: `bg-yellow-100 text-yellow-800 border-yellow-200`

### Modificar Estilos

Para personalizar los estilos, puedes:

1. Modificar las clases de Tailwind directamente en el componente
2. Crear un archivo CSS personalizado
3. Usar CSS Modules si lo prefieres

## 🔒 Seguridad y Permisos

### Row Level Security (RLS)

El componente depende de las políticas RLS de Supabase para:
- Asegurar que solo el propietario de la propiedad pueda ver sus postulaciones
- Prevenir acceso no autorizado a datos sensibles de postulantes

### Validaciones

- ✅ Validación de `propertyId` no nulo/undefined antes de consultar
- ✅ Manejo de errores de permisos con mensajes user-friendly
- ✅ Logging detallado de errores para debugging

## 🚀 Roadmap y Mejoras Futuras

### Corto Plazo
- [ ] Implementar cálculo real de score de riesgo
- [ ] Agregar campos de ingresos a la base de datos
- [ ] Completar implementación de "Solicitar Informe Comercial"
- [ ] Completar implementación de "Solicitar Documentación"
- [ ] Completar implementación de "Enviar Documentos"

### Mediano Plazo
- [ ] Añadir sistema de filtros (por estado, fecha, score)
- [ ] Implementar ordenamiento de columnas
- [ ] Agregar paginación para listas largas
- [ ] Exportar postulaciones a Excel/PDF
- [ ] Notificaciones en tiempo real de nuevas postulaciones

### Largo Plazo
- [ ] Sistema de scoring automático basado en ML
- [ ] Integración con servicios de verificación de identidad
- [ ] Chat integrado con postulantes
- [ ] Historial de actividad y auditoría
- [ ] Dashboard analítico de postulaciones

## 📚 Referencias

### Documentación Relacionada
- [AdminPropertyDetailView.tsx](./AdminPropertyDetailView.tsx) - Componente padre
- [RentalContractConditionsForm.tsx](../contracts/RentalContractConditionsForm.tsx) - Formulario de contratos
- [Supabase Documentation](https://supabase.com/docs)

### Issues y Pull Requests
- Refactorización inicial: [fecha: 2025-10-28]

## 🤝 Contribuciones

### Cómo Contribuir

1. Crea un branch desde `main`: `git checkout -b feature/mejora-postulaciones`
2. Realiza tus cambios
3. Asegúrate de que los tests pasen: `npm test`
4. Ejecuta el linter: `npm run lint`
5. Crea un Pull Request con descripción detallada

### Estándares de Código

- Usar TypeScript con tipado estricto
- Documentar funciones complejas con JSDoc
- Mantener componentes bajo 500 líneas (extraer si es necesario)
- Tests para nueva funcionalidad
- Mensajes de commit descriptivos

## 📄 Licencia

Este componente es parte del sistema de gestión inmobiliaria y está sujeto a la licencia del proyecto principal.

---

**Última actualización**: 28 de octubre de 2025  
**Mantenedor**: Equipo de Desarrollo

