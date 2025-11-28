# 📊 Diagrama de Arquitectura - Sección Calendario

## 🏛️ Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                    🖥️  Frontend (React)                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐  │
│  │ UserProfilePage │────│ UserCalendarSec │────│ EventDetails│  │
│  │                 │    │ tion            │    │ Modal       │  │
│  └─────────────────┘    └─────────────────┘    └─────────────┘  │
│           │                        │                           │
│           └────────────────────────┼───────────────────────────┘
│                                    │
│                         ┌─────────────────┐                      │
│                         │ useUserCalendar │                      │
│                         │ Hook            │                      │
│                         └─────────────────┘                      │
│                                    │                           │
└────────────────────────────────────┼───────────────────────────┘
                                     │
┌────────────────────────────────────┼───────────────────────────┐
│                    ☁️  Supabase Edge Functions                   │
├────────────────────────────────────┼───────────────────────────┤
│                         ┌─────────────────┐                      │
│                         │ get-user-       │                      │
│                         │ calendar-events │                      │
│                         └─────────────────┘                      │
│                                    │                           │
└────────────────────────────────────┼───────────────────────────┘
                                     │
┌────────────────────────────────────┼───────────────────────────┐
│                 🗄️  PostgreSQL Database                         │
├────────────────────────────────────┼───────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐  │
│  │ scheduled_visits│    │ rental_contracts│    │ property_   │  │
│  │                 │    │                 │    │ sale_offers │  │
│  └─────────────────┘    └─────────────────┘    └─────────────┘  │
│           │                        │                  │        │
│           └────────────────────────┼──────────────────┼────────┘
│                                    │                  │
│                         ┌─────────────────┐           │        │
│                         │ get_user_       │◄──────────┘        │
│                         │ calendar_events │                    │
│                         │ (Function)      │                    │
│                         └─────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Flujo de Datos Detallado

```
1. 👤 Usuario accede a /perfil
   ↓
2. 📱 UserProfilePage renderiza pestañas
   ↓
3. 📅 UserCalendarSection se monta
   ↓
4. 🪝 useUserCalendar hook se ejecuta
   ↓
5. 🌐 Llama a Supabase Edge Function
   ↓
6. ⚡ Edge Function ejecuta función PostgreSQL
   ↓
7. 🗄️ PostgreSQL consulta múltiples tablas:
   • scheduled_visits (visitas)
   • rental_contracts (firmas)
   • property_sale_offers (plazos)
   ↓
8. 📊 Datos consolidados se retornan
   ↓
9. 🔄 Transformación a UserCalendarEvent[]
   ↓
10. 🎨 Renderizado en componentes UI
    ↓
11. 👁️ Usuario ve calendario integrado
```

## 🧩 Componentes y Responsabilidades

### **Frontend Components**

```
UserProfilePage
├── Estado: activeTab ('profile' | 'calendar')
├── Tabs: Perfil | Calendario
└── Renderiza: ProfileSection | UserCalendarSection

UserCalendarSection
├── useUserCalendar hook
├── Calendar existente (reutilizado)
├── Panel lateral con eventos del día
├── Lista próximos eventos (7 días)
└── Estadísticas por tipo

EventDetailsModal
├── Muestra detalles completos del evento
├── Información contextual
└── Acciones disponibles (según tipo)
```

### **Hooks Personalizados**

```
useUserCalendar
├── Estado: events[], loading, error
├── loadEvents(): Carga desde API
├── getEventsForDate(date): Eventos del día
├── getEventsForRange(start, end): Eventos en rango
├── getUpcomingEvents(days): Próximos N días
└── getEventsByType(type): Filtrar por tipo
```

### **Backend Functions**

```
get_user_calendar_events(user_id)
├── Consulta scheduled_visits
├── Consulta rental_contracts
├── Consulta property_sale_offers (futuro)
└── Retorna eventos consolidados
```

## 📊 Estructura de Eventos

```typescript
UserCalendarEvent {
  // Identificación
  id: "visit-123" | "contract-sign-456" | "offer-deadline-789"
  title: "Visita: Casa en Las Condes"
  description: "Visita con María González - Inspección"

  // Temporales
  startDate: 2025-01-15T10:00:00Z
  endDate: 2025-01-15T11:00:00Z
  allDay: false

  // Clasificación
  eventType: "visit" | "closing" | "deadline"
  priority: "normal" | "high" | "urgent"

  // Relaciones
  relatedEntityType: "scheduled_visit" | "rental_contract" | "offer"
  relatedEntityId: "uuid-string"

  // UI
  location: "Av. Las Condes 1234, Las Condes"
  color: "#3B82F6"
}
```

## 🎨 Sistema de Colores e Iconos

```
Tipo de Evento    Color       Icono      Prioridad
─────────────────────────────────────────────────
Visitas          🔵 #3B82F6  📅 Calendar    Normal
Firmas           🟢 #10B981  ✍️ CheckCircle High
Plazos           🔴 #EF4444  ⏰ AlertTriangle Urgent
Negociaciones    🟠 #F97316  💬 MessageCircle Normal
```

## 🔗 Integraciones

### **Con Sistema Existente**
- ✅ `useAuth` - Autenticación de usuario
- ✅ `Calendar` component - Reutilización de vistas
- ✅ `useCalendar` hook - Funciones utilitarias
- ✅ `Layout` - Navegación y estructura
- ✅ `Supabase` client - Conexión a BD

### **Con Nuevas Funcionalidades**
- 🔄 Edge Functions - API personalizada
- 🔄 PostgreSQL Functions - Lógica de negocio
- 🔄 TypeScript interfaces - Type safety
- 🔄 Responsive design - Móvil + Desktop

## 🚀 Plan de Implementación

### **Fase 2: Backend** (2-3 días)
```
1. Crear función PostgreSQL get_user_calendar_events()
2. Implementar Edge Function
3. Testing de consultas
4. Optimización de performance
```

### **Fase 3: Frontend** (3-4 días)
```
1. Crear useUserCalendar hook
2. Implementar UserCalendarSection
3. Modificar UserProfilePage
4. Testing de componentes
```

### **Fase 4: Testing & Deploy** (1-2 días)
```
1. Testing unitario e integración
2. Testing E2E
3. Optimización performance
4. Despliegue producción
```

---

*Diagrama actualizado - Fase 1 completada*
