# 📅 Guía de Usuario: Calendario de Actividades

## 🎯 **¿Qué es el Calendario de Actividades?**

El **Calendario de Actividades** es una nueva funcionalidad en tu perfil que te permite visualizar y gestionar todas tus actividades inmobiliarias importantes en un solo lugar. Ya no necesitas buscar en diferentes secciones para recordar tus visitas, firmas o plazos.

## 📍 **¿Dónde está?**

1. Ve a tu perfil: `https://tu-app.com/perfil`
2. Busca las pestañas en la parte superior
3. Haz click en **"Calendario de Actividades"**

![Pestañas del perfil](https://via.placeholder.com/600x100/3B82F6/FFFFFF?text=Mi+Perfil+%7C+Calendario+de+Actividades)

## 📊 **¿Qué veo en el calendario?**

### **Estadísticas Rápidas**
En la parte superior verás tarjetas con estadísticas de tus actividades:

- 🔵 **Visitas**: Número de visitas programadas
- 🟢 **Firmas**: Contratos pendientes de firma
- 🔴 **Plazos**: Fechas límite importantes
- 🟠 **Total**: Todas tus actividades activas

### **Vista del Calendario**
- **Vista mensual** por defecto (puedes cambiar a semanal o diaria)
- **Navegación** entre meses con flechas
- **Botón "Hoy"** para volver al mes actual
- **Eventos coloreados** según el tipo de actividad

### **Panel Lateral**
- **Eventos del día seleccionado** (al hacer click en una fecha)
- **Próximos eventos** (los siguientes 7 días)
- **Leyenda de colores** con explicación

## 🎨 **Colores de las Actividades**

| Color | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| 🔵 Azul | Visitas | Visitas programadas a propiedades | "Visita: Casa en Las Condes" |
| 🟢 Verde | Firmas | Contratos pendientes de firma | "Firma contrato: Depto. en Providencia" |
| 🔴 Rojo | Plazos | Fechas límite importantes | "Plazo oferta: Casa en Vitacura" |
| 🟠 Naranja | Negociaciones | Ofertas en proceso | "Negociación activa: Local comercial" |

## 📅 **Cómo usar el calendario**

### **Navegar por Fechas**
1. **Flecha izquierda** ⬅️ : Mes anterior
2. **Flecha derecha** ➡️ : Mes siguiente
3. **Botón "Hoy"** : Volver al mes actual
4. **Click en fecha** : Ver eventos de ese día

### **Ver Detalles de un Evento**
1. **Click en un evento** en el calendario
2. Se abre un **modal con información completa**:
   - Título y descripción detallada
   - Fecha y hora exacta
   - Ubicación (si aplica)
   - Prioridad del evento
   - Tipo de entidad relacionada

### **Filtrar Eventos**
1. **Click en "Filtros"** para expandir opciones
2. **Selecciona tipos** de eventos que quieres ver
3. **Elige prioridades** (Baja, Normal, Alta, Urgente)
4. Los filtros se aplican **automáticamente**

## 🔍 **Tipos de Eventos Detallados**

### **🔵 Visitas Agendadas**
- **Cuándo aparece**: Cuando tienes visitas programadas como propietario
- **Información incluye**: Propiedad, fecha, hora, visitante, propósito
- **Colores por propósito**:
  - Inspección: Prioridad Alta
  - Tasación: Prioridad Normal
  - Negociación: Prioridad Normal

### **🟢 Firmas de Contratos**
- **Cuándo aparece**: Cuando tienes contratos enviados a firma
- **Estados posibles**: Pendiente firma propietario/arrendatario/garante
- **Prioridad**: Siempre Alta (requiere acción inmediata)

### **🔴 Plazos de Ofertas**
- **Cuándo aparece**: Cuando tienes ofertas con fecha límite
- **Información incluye**: Monto de la oferta, comprador, fecha límite
- **Prioridad automática**:
  - Urgente: Menos de 3 días
  - Alta: Menos de 7 días
  - Normal: Más de 7 días

### **🟠 Negociaciones Activas**
- **Cuándo aparece**: Ofertas en proceso de negociación
- **Incluye**: Ofertas en revisión, con contraofertas, etc.
- **Prioridad**: Normal (seguimiento regular)

## ⚙️ **Configuración y Personalización**

### **Actualizar Datos**
- **Botón "Actualizar"** recarga todos los eventos
- Útil cuando sabes que hay cambios recientes
- Los datos se refrescan automáticamente al cambiar de pestaña

### **Vista Preferida**
- **Mes**: Vista general (recomendada)
- **Semana**: Vista detallada semanal
- **Día**: Vista horaria del día
- **Agenda**: Lista cronológica de eventos

## ❓ **Preguntas Frecuentes**

### **¿Por qué veo "Modo Desarrollo"?**
Si ves un banner amarillo diciendo "Modo Desarrollo", significa que:
- La Edge Function de Supabase no está desplegada aún
- Se están mostrando datos de ejemplo para testing
- Los datos reales aparecerán una vez desplegada la función

### **¿Los eventos se actualizan automáticamente?**
- Sí, los eventos se cargan automáticamente al abrir la sección
- Usa el botón "Actualizar" para forzar una recarga
- Los filtros se aplican en tiempo real

### **¿Puedo crear eventos manualmente?**
Actualmente, los eventos se crean automáticamente desde:
- Visitas programadas en propiedades
- Contratos enviados a firma
- Ofertas con fechas límite

La creación manual de eventos estará disponible en futuras versiones.

### **¿Cómo contacto soporte?**
Si encuentras problemas o tienes preguntas:
1. Verifica que estés usando la versión más reciente
2. Revisa la documentación técnica en el repositorio
3. Contacta al equipo de desarrollo

## 📱 **Uso en Dispositivos Móviles**

### **Responsive Design**
- **Pantalla completa**: Layout de 3 columnas
- **Tablet**: Adaptación inteligente
- **Móvil**: Calendario prioritario + navegación touch

### **Gestos Recomendados**
- **Swipe horizontal**: Navegar entre meses
- **Tap en fecha**: Ver eventos del día
- **Tap en evento**: Abrir detalles
- **Scroll**: Navegar por listas largas

## 🔄 **Actualizaciones y Mejoras**

### **Próximas Funcionalidades**
- ⏰ **Recordatorios automáticos** por email/push
- 📤 **Sincronización** con Google Calendar/Outlook
- ➕ **Creación manual** de eventos personalizados
- 👥 **Invitaciones** a múltiples participantes
- 📊 **Estadísticas avanzadas** de actividades

### **Versiones Recientes**
- ✅ **v1.0**: Calendario básico con eventos automáticos
- 🔄 **Próximas**: Recordatorios y sincronización externa

## 🎯 **Consejos para Usar el Calendario**

### **Mejores Prácticas**
1. **Revisa diariamente** los eventos urgentes (rojos)
2. **Usa filtros** para enfocarte en tipos específicos
3. **Actualiza regularmente** para ver cambios recientes
4. **Planifica con anticipación** usando la vista mensual

### **Organización Recomendada**
- **Mañanas**: Revisa eventos del día
- **Fines de semana**: Planifica semana siguiente
- **Después de cerrar tratos**: Verifica contratos pendientes
- **Semanal**: Revisa todas las ofertas activas

---

**¡El Calendario de Actividades está diseñado para hacer tu trabajo más eficiente y organizado!**

¿Tienes preguntas sobre alguna funcionalidad específica? Revisa la documentación técnica o contacta al equipo de soporte. 🚀

