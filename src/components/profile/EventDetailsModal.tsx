import React from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle,
  X,
  ExternalLink
} from 'lucide-react';
import { UserCalendarEvent } from '../../hooks/useUserCalendar';
import format from 'date-fns/format';
import es from 'date-fns/locale/es';

interface EventDetailsModalProps {
  event: UserCalendarEvent;
  onClose: () => void;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ event, onClose }) => {
  // Iconos por tipo de evento
  const getEventIcon = (type: UserCalendarEvent['eventType']) => {
    switch (type) {
      case 'visit': return <CalendarIcon className="h-6 w-6" />;
      case 'closing': return <CheckCircle className="h-6 w-6" />;
      case 'deadline': return <AlertTriangle className="h-6 w-6" />;
      case 'negotiation': return <Clock className="h-6 w-6" />;
      default: return <Clock className="h-6 w-6" />;
    }
  };

  // Etiquetas por tipo de evento
  const getEventTypeLabel = (type: UserCalendarEvent['eventType']) => {
    switch (type) {
      case 'visit': return 'Visita Agendada';
      case 'closing': return 'Firma de Contrato';
      case 'deadline': return 'Fecha Límite';
      case 'negotiation': return 'Negociación Activa';
      default: return type;
    }
  };

  // Descripción extendida por tipo
  const getEventTypeDescription = (type: UserCalendarEvent['eventType']) => {
    switch (type) {
      case 'visit':
        return 'Visita programada con un interesado en la propiedad. Incluye inspección o evaluación.';
      case 'closing':
        return 'Proceso de firma de contrato de arriendo. Requiere atención inmediata para completar la transacción.';
      case 'deadline':
        return 'Fecha límite importante que requiere acción. No debe ser postergada.';
      case 'negotiation':
        return 'Negociación activa en proceso. Requiere seguimiento continuo.';
      default:
        return 'Evento del calendario inmobiliario.';
    }
  };

  // Prioridad en español con colores
  const getPriorityInfo = (priority: UserCalendarEvent['priority']) => {
    switch (priority) {
      case 'urgent':
        return {
          label: 'Urgente',
          color: 'bg-red-100 text-red-800 border-red-200',
          description: 'Requiere atención inmediata'
        };
      case 'high':
        return {
          label: 'Alta',
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          description: 'Importante y prioritario'
        };
      case 'normal':
        return {
          label: 'Normal',
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          description: 'Atención regular'
        };
      case 'low':
        return {
          label: 'Baja',
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          description: 'Puede esperar'
        };
      default:
        return {
          label: priority,
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          description: 'Sin especificar'
        };
    }
  };

  // Estado del evento
  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      'scheduled': { label: 'Programado', color: 'bg-blue-100 text-blue-800' },
      'confirmed': { label: 'Confirmado', color: 'bg-green-100 text-green-800' },
      'tentative': { label: 'Tentativo', color: 'bg-yellow-100 text-yellow-800' },
      'cancelled': { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
      'completed': { label: 'Completado', color: 'bg-green-100 text-green-800' },
      'pending': { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
      'sent_to_signature': { label: 'Enviado a Firma', color: 'bg-blue-100 text-blue-800' },
      'partially_signed': { label: 'Parcialmente Firmado', color: 'bg-orange-100 text-orange-800' },
    };

    return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  };

  // Tipo de entidad relacionada
  const getEntityTypeInfo = (entityType: string) => {
    const entityMap: Record<string, { label: string; description: string }> = {
      'scheduled_visit': {
        label: 'Visita Programada',
        description: 'Visita agendada con interesado en la propiedad'
      },
      'rental_contract': {
        label: 'Contrato de Arriendo',
        description: 'Contrato de arriendo en proceso de firma'
      },
      'property_sale_offer': {
        label: 'Oferta de Compra',
        description: 'Oferta de compra para propiedad en venta'
      }
    };

    return entityMap[entityType] || {
      label: entityType.replace('_', ' '),
      description: 'Entidad relacionada con el evento'
    };
  };

  const priorityInfo = getPriorityInfo(event.priority);
  const statusInfo = getStatusInfo(event.status);
  const entityInfo = getEntityTypeInfo(event.relatedEntityType);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${event.color}20`, color: event.color }}
            >
              {getEventIcon(event.eventType)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Detalles del Evento</h3>
              <p className="text-sm text-gray-600">{getEventTypeLabel(event.eventType)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenido Principal */}
        <div className="space-y-6">
          {/* Título y Descripción */}
          <div>
            <h4 className="text-xl font-semibold text-gray-900 mb-2">{event.title}</h4>
            <p className="text-gray-600">{event.description}</p>
            <p className="text-sm text-gray-500 mt-2">{getEventTypeDescription(event.eventType)}</p>
          </div>

          {/* Información de Fecha y Hora */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Clock className="h-5 w-5 text-gray-600" />
              <span className="font-medium text-gray-900">Fecha y Hora</span>
            </div>
            <div className="ml-8">
              <div className="text-lg font-semibold text-gray-900">
                {format(event.startDate, 'PPP', { locale: es })}
              </div>
              {event.allDay ? (
                <div className="text-sm text-gray-600 mt-1">Todo el día</div>
              ) : (
                <div className="text-sm text-gray-600 mt-1">
                  {format(event.startDate, 'HH:mm')} - {format(event.endDate, 'HH:mm')}
                </div>
              )}
            </div>
          </div>

          {/* Ubicación */}
          {event.location && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <MapPin className="h-5 w-5 text-gray-600" />
                <span className="font-medium text-gray-900">Ubicación</span>
              </div>
              <div className="ml-8">
                <p className="text-gray-700">{event.location}</p>
              </div>
            </div>
          )}

          {/* Metadatos del Evento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Prioridad */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-700 mb-2">Prioridad</div>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${priorityInfo.color}`}>
                {priorityInfo.label}
              </div>
              <p className="text-xs text-gray-600 mt-2">{priorityInfo.description}</p>
            </div>

            {/* Estado */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-700 mb-2">Estado</div>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                {statusInfo.label}
              </div>
            </div>
          </div>

          {/* Información de la Entidad Relacionada */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="text-sm font-medium text-blue-900 mb-2">Entidad Relacionada</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">Tipo:</span>
                <span className="text-sm font-medium text-blue-900">{entityInfo.label}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">ID:</span>
                <span className="text-xs font-mono text-blue-800 bg-blue-100 px-2 py-1 rounded">
                  {event.relatedEntityId.substring(0, 8)}...
                </span>
              </div>
              <p className="text-xs text-blue-700 mt-2">{entityInfo.description}</p>
            </div>
          </div>

          {/* Información Técnica (solo en desarrollo) */}
          {process.env.NODE_ENV === 'development' && (
            <details className="bg-gray-100 rounded-lg p-4">
              <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                Información Técnica (Desarrollo)
              </summary>
              <div className="mt-3 space-y-2 text-xs font-mono">
                <div><strong>ID:</strong> {event.id}</div>
                <div><strong>Tipo:</strong> {event.eventType}</div>
                <div><strong>Color:</strong> {event.color}</div>
                <div><strong>Creado:</strong> {format(event.createdAt, 'PPP p', { locale: es })}</div>
                <div><strong>Actualizado:</strong> {format(event.updatedAt, 'PPP p', { locale: es })}</div>
              </div>
            </details>
          )}
        </div>

        {/* Footer con acciones */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cerrar
          </button>
          {/* Futuras acciones: Ver entidad relacionada, editar, etc. */}
        </div>
      </div>
    </div>
  );
};
