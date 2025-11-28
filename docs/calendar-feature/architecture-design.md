# 🏗️ Diseño de Arquitectura: Sección Calendario en Perfil

## 📋 Visión General

La sección de calendario será una funcionalidad integrada que combina datos de múltiples fuentes para proporcionar al usuario una vista unificada de todas sus actividades inmobiliarias importantes.

## 🏛️ Arquitectura General

### **Patrón Arquitectónico**
```
Frontend (React) ↔ Supabase Edge Functions ↔ PostgreSQL
     ↓
Componentes UI ↔ Hooks Personalizados ↔ APIs REST
```

### **Capas de la Arquitectura**

#### **1. Capa de Presentación (Frontend)**
- **Framework:** React 18 con TypeScript
- **Routing:** React Router DOM
- **Estado:** React Hooks + Context
- **UI:** Tailwind CSS + Componentes personalizados
- **Gráficos:** date-fns para manejo de fechas

#### **2. Capa de Lógica de Negocio**
- **Hooks personalizados:** `useUserCalendar`, `useCalendar` (existente)
- **Servicios:** Funciones utilitarias para transformación de datos
- **Validación:** Esquemas de validación de datos

#### **3. Capa de Datos**
- **ORM:** Supabase Client
- **Edge Functions:** Procesamiento server-side
- **Base de datos:** PostgreSQL con PostGIS

## 🧩 Componentes del Sistema

### **Componentes Nuevos a Crear**

#### **A. `useUserCalendar` Hook**
```typescript
// src/hooks/useUserCalendar.ts
interface UserCalendarEvent {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  eventType: 'visit' | 'closing' | 'deadline' | 'negotiation';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  relatedEntityType: 'scheduled_visit' | 'rental_contract' | 'offer';
  relatedEntityId: string;
  location?: string;
  color: string;
}

export const useUserCalendar = () => {
  // Estado y lógica del hook
}
```

#### **B. `UserCalendarSection` Component**
```typescript
// src/components/profile/UserCalendarSection.tsx
interface UserCalendarSectionProps {
  className?: string;
}

export const UserCalendarSection: React.FC<UserCalendarSectionProps> = ({
  className = ''
}) => {
  // Lógica del componente principal
}
```

#### **C. `EventDetailsModal` Component**
```typescript
// src/components/profile/EventDetailsModal.tsx
interface EventDetailsModalProps {
  event: UserCalendarEvent;
  onClose: () => void;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  event,
  onClose
}) => {
  // Modal de detalles de eventos
}
```

### **Componentes Existentes a Modificar**

#### **A. `UserProfilePage`**
**Cambios requeridos:**
- Agregar estado para gestión de pestañas
- Importar e integrar `UserCalendarSection`
- Modificar layout para incluir navegación por pestañas

```typescript
// Agregar estado de pestañas
const [activeTab, setActiveTab] = useState<'profile' | 'calendar'>('profile');

// Modificar JSX para incluir pestañas
{tab === 'calendar' && <UserCalendarSection />}
```

#### **B. `Calendar` Component (Existente)**
**Reutilización:**
- El componente `Calendar` existente será reutilizado
- Se adaptarán los props para trabajar con `UserCalendarEvent`
- Se mantendrá compatibilidad con eventos manuales

## 📊 Estructura de Datos

### **Eventos del Calendario de Usuario**

```typescript
export interface UserCalendarEvent {
  // Identificación
  id: string;                    // ID único del evento
  title: string;                 // Título descriptivo
  description: string;           // Descripción detallada

  // Fechas y horarios
  startDate: Date;               // Fecha/hora de inicio
  endDate: Date;                 // Fecha/hora de fin
  allDay?: boolean;              // Si es evento de todo el día

  // Clasificación
  eventType: EventType;          // Tipo de evento
  priority: EventPriority;       // Nivel de prioridad
  status?: EventStatus;          // Estado del evento

  // Relaciones
  relatedEntityType: EntityType; // Tipo de entidad relacionada
  relatedEntityId: string;       // ID de la entidad relacionada

  // Información adicional
  location?: string;             // Ubicación física
  attendees?: string[];          // Participantes (IDs de usuario)
  color: string;                 // Color para UI

  // Metadata
  createdAt?: Date;              // Fecha de creación
  updatedAt?: Date;              // Fecha de actualización
}
```

### **Enums y Tipos**

```typescript
export type EventType = 'visit' | 'closing' | 'deadline' | 'negotiation';
export type EventPriority = 'low' | 'normal' | 'high' | 'urgent';
export type EventStatus = 'confirmed' | 'tentative' | 'cancelled';
export type EntityType = 'scheduled_visit' | 'rental_contract' | 'offer';
```

## 🔄 Flujo de Datos

### **Secuencia de Carga de Eventos**

```
1. UserProfilePage → useUserCalendar
2. useUserCalendar → Supabase Edge Function
3. Edge Function → PostgreSQL Function get_user_calendar_events()
4. PostgreSQL → Query multiple tables (JOINs)
5. Return → Transform to UserCalendarEvent[]
6. React → Update UI with events
```

### **Transformación de Datos**

```sql
-- Función PostgreSQL que consolida datos de múltiples tablas
CREATE OR REPLACE FUNCTION get_user_calendar_events(user_id UUID)
RETURNS TABLE (
  id TEXT, title TEXT, description TEXT,
  start_date TIMESTAMPTZ, end_date TIMESTAMPTZ,
  event_type TEXT, priority TEXT, color TEXT,
  related_entity_type TEXT, related_entity_id UUID,
  location TEXT
) AS $$
BEGIN
  -- Eventos de visitas
  RETURN QUERY SELECT ... FROM scheduled_visits;
  -- Eventos de contratos
  RETURN QUERY SELECT ... FROM rental_contracts;
  -- Eventos de ofertas (cuando se implemente deadline_date)
  RETURN QUERY SELECT ... FROM property_sale_offers;
END;
$$ LANGUAGE plpgsql;
```

## 🔗 Integración con Sistemas Existentes

### **Reutilización del Sistema de Calendario**

#### **Componente `Calendar` Existente**
- **Vista mensual:** Reutilizada sin cambios
- **Vista semanal:** Reutilizada sin cambios
- **Vista diaria:** Reutilizada sin cambios
- **Vista agenda:** Reutilizada sin cambios
- **Navegación:** Reutilizada sin cambios

#### **Hook `useCalendar` Existente**
- **Funciones de utilidad:** `getEventsForDate`, `getEventsForRange`
- **Navegación:** `navigateToDate`, `navigateToToday`, etc.
- **Filtros:** Sistema de filtros existente

### **Integración con Autenticación**

#### **Hook `useAuth`**
- Obtener `user.id` para consultas
- Verificar permisos de acceso
- Manejar estados de carga de autenticación

### **Integración con UI Existente**

#### **Layout y Navegación**
- Reutilizar `Layout` existente
- Integrar con navegación móvil
- Mantener consistencia visual

#### **Componentes UI**
- Reutilizar componentes de `common/`
- Mantener paleta de colores consistente
- Seguir patrones de diseño existentes

## 🎨 Decisiones de Diseño

### **Sistema de Colores**

```typescript
const EVENT_COLORS = {
  visit: '#3B82F6',      // Azul - Visitas
  closing: '#10B981',    // Verde - Firmas
  deadline: '#EF4444',   // Rojo - Plazos
  negotiation: '#F97316' // Naranja - Negociaciones
} as const;
```

### **Iconos por Tipo de Evento**

```typescript
const EVENT_ICONS = {
  visit: Calendar,
  closing: CheckCircle,
  deadline: AlertTriangle,
  negotiation: MessageCircle
} as const;
```

### **Estados de Carga y Error**

#### **Estados de UI**
- **Loading:** Spinner con mensaje "Cargando calendario..."
- **Error:** Mensaje de error con botón "Reintentar"
- **Empty:** Mensaje "No hay eventos programados"

#### **Manejo de Errores**
- Errores de red: Reintento automático
- Errores de permisos: Mensaje específico
- Errores de datos: Logging y fallback

## 📱 Arquitectura Responsive

### **Breakpoints y Layout**

#### **Desktop (lg+)**
```
┌─────────────────────────────────────────────────┐
│ Header con estadísticas                        │
├─────────────────┬───────────────────────────────┤
│ Calendario      │ Panel lateral                 │
│ Principal       │ - Eventos del día             │
│ (2/3 ancho)     │ - Próximos eventos             │
│                 │ - Leyenda                     │
└─────────────────┴───────────────────────────────┘
```

#### **Mobile (sm-)**
```
┌─────────────────────────────────┐
│ Header con estadísticas         │
├─────────────────────────────────┤
│ Calendario (full width)         │
├─────────────────────────────────┤
│ Eventos del día (collapsible)   │
├─────────────────────────────────┤
│ Próximos eventos (collapsible)  │
└─────────────────────────────────┘
```

### **Navegación Móvil**
- Bottom navigation integrada
- Swipe gestures para navegación de calendario
- Modal fullscreen para detalles de eventos

## ⚡ Optimizaciones de Performance

### **Lazy Loading**
- Componentes cargados bajo demanda
- Eventos cargados por rango de fechas
- Imágenes y assets optimizados

### **Caching**
- Cache de eventos por usuario
- Invalidación inteligente de cache
- Persistencia offline (futuro)

### **Virtualización**
- Listas largas virtualizadas
- Calendario con virtual scrolling
- Paginación de datos del servidor

## 🔒 Seguridad y Privacidad

### **Control de Acceso**
- **RLS Policies:** Solo eventos del usuario autenticado
- **Row Level Security:** Políticas granulares por tabla
- **JWT Tokens:** Autenticación via Supabase

### **Validación de Datos**
- **Input sanitization:** En Edge Functions
- **Type checking:** TypeScript en frontend
- **SQL injection prevention:** Prepared statements

### **Auditoría**
- **Logging:** Acceso a datos sensibles
- **Rate limiting:** Protección contra abuso
- **Error tracking:** Monitoreo de excepciones

## 🧪 Estrategia de Testing

### **Testing Unitario**
- **Hooks:** `useUserCalendar` con mocks
- **Componentes:** Renderizado y interacciones
- **Utilidades:** Funciones de transformación

### **Testing de Integración**
- **API Calls:** Edge Functions
- **Database:** Consultas PostgreSQL
- **Componentes:** Interacción entre componentes

### **Testing E2E**
- **User Journeys:** Flujo completo de usuario
- **Responsive:** Diferentes dispositivos
- **Performance:** Métricas de carga

## 📈 Escalabilidad

### **Base de Datos**
- **Índices:** Optimizados para consultas frecuentes
- **Partitioning:** Para tablas grandes (futuro)
- **Connection pooling:** Manejo eficiente de conexiones

### **Frontend**
- **Code splitting:** Componentes cargados dinámicamente
- **Service workers:** Cache y offline (futuro)
- **CDN:** Assets estáticos distribuidos

### **Backend**
- **Edge Functions:** Escalabilidad automática
- **Caching:** Redis para datos calientes (futuro)
- **Load balancing:** Distribución de carga

## 🚀 Plan de Implementación

### **Fase 1: Fundamentos (Backend)**
1. Crear función PostgreSQL `get_user_calendar_events()`
2. Implementar Edge Function
3. Crear migraciones necesarias (deadline_date)

### **Fase 2: Lógica de Frontend**
1. Crear hook `useUserCalendar`
2. Implementar transformación de datos
3. Crear componentes base

### **Fase 3: UI/UX**
1. Implementar `UserCalendarSection`
2. Modificar `UserProfilePage`
3. Integrar navegación por pestañas

### **Fase 4: Testing y Optimización**
1. Testing unitario y de integración
2. Optimización de performance
3. Testing E2E

### **Fase 5: Despliegue**
1. Deploy de Edge Functions
2. Deploy de migraciones
3. Deploy de frontend
4. Monitoreo post-lanzamiento

## 🎯 Métricas de Éxito

### **Funcionales**
- ✅ Carga de eventos < 3 segundos
- ✅ 100% de eventos relevantes mostrados
- ✅ 0% de errores de permisos

### **Técnicas**
- ✅ Cobertura de tests > 80%
- ✅ Performance lighthouse > 90
- ✅ Zero downtime deployment

### **Usuario**
- ✅ Satisfacción > 4.5/5
- ✅ Tasa de uso > 70% de usuarios activos
- ✅ Reducción de consultas de soporte

Esta arquitectura proporciona una base sólida y escalable para la implementación de la sección calendario, manteniendo consistencia con el sistema existente mientras introduce las nuevas funcionalidades requeridas.
