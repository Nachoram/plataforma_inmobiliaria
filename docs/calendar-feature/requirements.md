# 📋 Requerimientos Detallados: Sección Calendario en Perfil de Usuario

## 🎯 Objetivo General

Crear una sección de calendario integrada en el perfil del usuario que muestre todas las actividades importantes relacionadas con propiedades inmobiliarias: visitas agendadas, firmas de contratos pendientes y plazos de ofertas.

## 📊 Fuentes de Datos Analizadas

### 1. **scheduled_visits** - Visitas Agendadas
**Estructura identificada:**
- `id` (UUID): Identificador único
- `property_id` (UUID): Referencia a propiedad
- `scheduled_date` (DATE): Fecha de la visita
- `scheduled_time_slot` (TEXT): Horario (ej: '9-10', '10-11', etc.)
- `visitor_name`, `visitor_email`, `visitor_phone`: Información del visitante
- `visit_purpose` (TEXT): Propósito ('property_visit', 'inspection', 'valuation', 'negotiation')
- `status` (TEXT): Estado ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')

**Relaciones:** Conecta con `properties` para obtener título y dirección.

### 2. **rental_contracts** - Contratos de Arriendo
**Estructura identificada:**
- `id` (UUID): Identificador único
- `application_id` (UUID): Referencia a postulación
- `status` (contract_status_enum): Estado del contrato
- `sent_to_signature_at` (TIMESTAMPTZ): Fecha de envío a firma
- `owner_signed_at`, `tenant_signed_at`, `guarantor_signed_at`: Fechas de firmas
- `signed_contract_url`: URL del contrato firmado

**Estados relevantes:** 'sent_to_signature', 'partially_signed'

### 3. **property_sale_offers** - Ofertas de Compra
**Estructura identificada:**
- `id` (UUID): Identificador único
- `property_id` (UUID): Referencia a propiedad
- `buyer_id` (UUID): ID del comprador
- `buyer_name`, `buyer_email`: Información del comprador
- `offer_amount` (BIGINT): Monto de la oferta
- `status` (offer_status): Estado de la oferta
- `created_at`, `updated_at`: Fechas de auditoría

**Nota:** Actualmente NO existe campo `deadline_date` en esta tabla.

### 4. **calendar_events** - Eventos de Calendario Existentes
**Estructura existente:**
- Soporte completo para eventos de calendario
- Tipos: 'meeting', 'deadline', 'reminder', 'visit', 'negotiation', 'closing', 'inspection', 'availability'
- Estados: 'confirmed', 'tentative', 'cancelled'
- Prioridades: 'low', 'normal', 'high', 'urgent'

## 🎪 Tipos de Eventos a Implementar

### **A. Eventos de Visitas Agendadas** 🔵
- **Tipo:** `visit`
- **Color:** Azul (#3B82F6)
- **Prioridad:** Normal
- **Fuente:** `scheduled_visits` con status 'scheduled'/'confirmed'
- **Título:** "Visita: [Título de Propiedad]"
- **Descripción:** "Visita con [Nombre Visitante] - [Propósito]"
- **Ubicación:** "[Dirección Propiedad]"
- **Horario:** Basado en `scheduled_date` + `scheduled_time_slot`

### **B. Eventos de Firmas de Contratos** 🟢
- **Tipo:** `closing`
- **Color:** Verde (#10B981)
- **Prioridad:** Alta
- **Fuente:** `rental_contracts` con status 'sent_to_signature'/'partially_signed'
- **Título:** "Firma contrato: [Título Propiedad]"
- **Descripción:** "Firma pendiente del [propietario/arrendatario/avalista]"
- **Horario:** `sent_to_signature_at` (todo el día)

### **C. Eventos de Plazos de Ofertas** 🔴
- **Tipo:** `deadline`
- **Color:** Rojo (#EF4444)
- **Prioridad:** Urgente
- **Fuente:** `property_sale_offers` con status 'pendiente'
- **Título:** "Plazo oferta: [Título Propiedad]"
- **Descripción:** "Oferta de [Nombre Comprador] vence"
- **Horario:** Campo `deadline_date` (requiere agregar a BD)

## ⚙️ Funcionalidades Requeridas

### **Vista Principal del Calendario**
- [ ] Vista mensual (por defecto)
- [ ] Vista semanal
- [ ] Vista diaria
- [ ] Vista de agenda (lista)
- [ ] Navegación entre fechas (hoy, anterior, siguiente)

### **Gestión de Eventos**
- [ ] Mostrar eventos del día seleccionado
- [ ] Lista de próximos eventos (7 días)
- [ ] Modal de detalles de eventos
- [ ] Indicadores visuales por tipo de evento
- [ ] Estadísticas por tipo (visitas, firmas, plazos)

### **Interfaz de Usuario**
- [ ] Panel lateral derecho con eventos del día
- [ ] Lista de próximos eventos (7 días)
- [ ] Modal de detalles con información completa
- [ ] Sistema de colores por tipo de evento
- [ ] Botón de actualizar datos
- [ ] Estados de carga y error

### **Responsive Design**
- [ ] Funcional en desktop y móvil
- [ ] Navegación móvil integrada
- [ ] Componentes adaptativos

## 🔗 Relaciones y Filtros

### **Filtros por Usuario**
- Eventos donde el usuario es:
  - **Propietario** de la propiedad (scheduled_visits.property_owner_id)
  - **Participante** en contratos (rental_contracts via applications)
  - **Vendedor** de ofertas (property_sale_offers.seller_id)

### **Estados a Considerar**
- **Visitas:** Solo status 'scheduled', 'confirmed'
- **Contratos:** Status 'sent_to_signature', 'partially_signed'
- **Ofertas:** Status 'pendiente' (y agregar deadline_date)

## 🎨 Especificaciones de UI/UX

### **Colores por Tipo**
- 🔵 **Azul (#3B82F6):** Visitas agendadas
- 🟢 **Verde (#10B981):** Firmas de contratos
- 🔴 **Rojo (#EF4444):** Plazos urgentes
- 🟠 **Naranja (#F97316):** Negociaciones

### **Iconos por Tipo**
- 📅 Visitas: `Calendar`
- ✍️ Firmas: `CheckCircle`
- ⏰ Plazos: `AlertTriangle`
- 💬 Negociaciones: `MessageCircle`

### **Estados Visuales**
- **Prioridad Alta/Urgente:** Borde rojo, indicador especial
- **Eventos del día actual:** Fondo azul claro
- **Eventos pasados:** Opacidad reducida

## 📈 Métricas y KPIs

### **Métricas a Mostrar**
- Total de eventos activos
- Eventos por tipo (visitas, firmas, plazos)
- Eventos urgentes/high priority
- Eventos del día actual

### **Funcionalidades de Seguimiento**
- Conteo de eventos próximos (7 días)
- Alertas para eventos urgentes
- Recordatorios automáticos (futuro)

## 🔧 Requerimientos Técnicos

### **Backend**
- [ ] Función PostgreSQL `get_user_calendar_events(user_id)`
- [ ] Endpoint Supabase Edge Function
- [ ] Manejo de errores y logging

### **Frontend**
- [ ] Hook personalizado `useUserCalendar`
- [ ] Componente `UserCalendarSection`
- [ ] Integración con `UserProfilePage` (pestañas)
- [ ] Reutilización del componente `Calendar` existente

### **Base de Datos**
- [ ] Posible adición de campo `deadline_date` a `property_sale_offers`
- [ ] Optimización de consultas con índices apropiados

## 🚀 Criterios de Aceptación

### **Funcionalidad Básica**
- [ ] Usuario puede ver calendario en su perfil
- [ ] Se muestran visitas agendadas correctamente
- [ ] Se muestran contratos pendientes de firma
- [ ] Se muestran ofertas con plazos (una vez implementado deadline_date)

### **Interfaz de Usuario**
- [ ] Calendario se ve correctamente en todas las vistas
- [ ] Eventos tienen colores e íconos apropiados
- [ ] Modal de detalles funciona correctamente
- [ ] Interface es responsive

### **Performance**
- [ ] Carga inicial en menos de 3 segundos
- [ ] Navegación fluida entre vistas
- [ ] Actualización en tiempo real (futuro)

## 🎯 Alcance de la Fase 1

Esta fase se enfoca únicamente en:
1. ✅ Análisis completo de fuentes de datos
2. ✅ Definición detallada de requerimientos
3. ⏳ Diseño de arquitectura (próxima tarea)
4. ⏳ Creación de documentación técnica

**No incluye implementación de código aún.**

