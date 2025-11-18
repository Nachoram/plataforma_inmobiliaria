import React, { useState } from 'react';
import {
  Clock,
  User,
  FileText,
  CheckCircle,
  XCircle,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  Settings,
  Filter,
  Calendar,
  Search,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { SaleOffer, OfferTimeline, UserRole } from '../types';

interface OfferTimelineTabProps {
  offer: SaleOffer;
  userRole: UserRole | null;
  timeline: OfferTimeline[];
  onUpdateOffer: (status: SaleOffer['status'], extraData?: any) => Promise<void>;
  onAddTimelineEvent: (eventData: any) => Promise<void>;
  onRefreshData: () => Promise<void>;
}

const OfferTimelineTab: React.FC<OfferTimelineTabProps> = ({
  offer,
  userRole,
  timeline,
  onUpdateOffer,
  onAddTimelineEvent,
  onRefreshData
}) => {

  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================

  const [searchTerm, setSearchTerm] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  // ========================================================================
  // FILTERS AND SEARCH
  // ========================================================================

  const filteredTimeline = timeline.filter(event => {
    const matchesSearch = event.event_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.event_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.triggered_by_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = eventTypeFilter === 'all' || event.event_type.includes(eventTypeFilter);

    return matchesSearch && matchesType;
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // ========================================================================
  // UI HELPERS
  // ========================================================================

  const getEventIcon = (eventType: string) => {
    if (eventType.includes('oferta')) {
      return eventType.includes('creada') ? <FileText className="w-5 h-5" /> :
             eventType.includes('aceptada') ? <CheckCircle className="w-5 h-5" /> :
             eventType.includes('rechazada') ? <XCircle className="w-5 h-5" /> :
             <TrendingUp className="w-5 h-5" />;
    }

    if (eventType.includes('documento')) {
      return <FileText className="w-5 h-5" />;
    }

    if (eventType.includes('tarea')) {
      return <CheckCircle className="w-5 h-5" />;
    }

    if (eventType.includes('solicitud') || eventType.includes('formal')) {
      return <Settings className="w-5 h-5" />;
    }

    if (eventType.includes('comunicacion')) {
      return <MessageSquare className="w-5 h-5" />;
    }

    return <Clock className="w-5 h-5" />;
  };

  const getEventColor = (eventType: string) => {
    if (eventType.includes('creada') || eventType.includes('aceptada') || eventType.includes('validado') || eventType.includes('completada')) {
      return 'bg-green-100 border-green-200 text-green-800';
    }

    if (eventType.includes('rechazada') || eventType.includes('rechazado')) {
      return 'bg-red-100 border-red-200 text-red-800';
    }

    if (eventType.includes('contraoferta') || eventType.includes('actualizada') || eventType.includes('modificada')) {
      return 'bg-blue-100 border-blue-200 text-blue-800';
    }

    if (eventType.includes('solicitada') || eventType.includes('pendiente')) {
      return 'bg-yellow-100 border-yellow-200 text-yellow-800';
    }

    return 'bg-gray-100 border-gray-200 text-gray-800';
  };

  const getEventTypeLabel = (eventType: string) => {
    const labels: Record<string, string> = {
      'oferta_creada': 'Oferta Creada',
      'oferta_aceptada': 'Oferta Aceptada',
      'oferta_rechazada': 'Oferta Rechazada',
      'contraoferta': 'Contraoferta',
      'documento_solicitado': 'Documento Solicitado',
      'documento_subido': 'Documento Subido',
      'documento_validado': 'Documento Validado',
      'tarea_creada': 'Tarea Creada',
      'tarea_actualizada': 'Tarea Actualizada',
      'tarea_completada': 'Tarea Completada',
      'solicitud_formal_creada': 'Solicitud Formal',
      'solicitud_formal_actualizada': 'Solicitud Actualizada',
      'comunicacion': 'Comunicación',
    };

    return labels[eventType] || eventType.replace('_', ' ').toUpperCase();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'seller': return 'bg-purple-100 text-purple-800';
      case 'buyer': return 'bg-blue-100 text-blue-800';
      case 'admin': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'seller': return 'Vendedor';
      case 'buyer': return 'Comprador';
      case 'admin': return 'Admin';
      default: return role;
    }
  };

  const toggleEventExpansion = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Hoy';
    } else if (diffDays === 2) {
      return 'Ayer';
    } else if (diffDays <= 7) {
      return `Hace ${diffDays - 1} días`;
    } else {
      return date.toLocaleDateString('es-CL', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ========================================================================
  // GROUP EVENTS BY DATE
  // ========================================================================

  const groupedEvents = filteredTimeline.reduce((groups, event) => {
    const date = new Date(event.created_at).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(event);
    return groups;
  }, {} as Record<string, OfferTimeline[]>);

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Historial de Actividad</h2>
          <p className="text-gray-600">Timeline completo de eventos y acciones en esta oferta</p>
        </div>

        <div className="text-sm text-gray-500">
          {timeline.length} evento{timeline.length !== 1 ? 's' : ''} registrado{timeline.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar en el historial..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="w-full lg:w-48">
            <select
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos los tipos</option>
              <option value="oferta">Ofertas</option>
              <option value="documento">Documentos</option>
              <option value="tarea">Tareas</option>
              <option value="solicitud">Solicitudes</option>
              <option value="comunicacion">Comunicaciones</option>
            </select>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-8">
        {Object.keys(groupedEvents).length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay actividad registrada</h3>
            <p className="text-gray-600">
              Los eventos de esta oferta aparecerán aquí cuando ocurran acciones relevantes
            </p>
          </div>
        ) : (
          Object.entries(groupedEvents).map(([dateString, events]) => (
            <div key={dateString} className="relative">
              {/* Date Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {formatDate(events[0].created_at)}
                </h3>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              {/* Events for this date */}
              <div className="space-y-4 ml-6">
                {events.map((event, index) => (
                  <div key={event.id} className="relative">
                    {/* Timeline line */}
                    {index < events.length - 1 && (
                      <div className="absolute left-6 top-12 w-px h-full bg-gray-200"></div>
                    )}

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <div
                        className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => toggleEventExpansion(event.id)}
                      >
                        <div className="flex items-start gap-4">
                          {/* Event Icon */}
                          <div className={`p-3 rounded-lg border-2 ${getEventColor(event.event_type)}`}>
                            {getEventIcon(event.event_type)}
                          </div>

                          {/* Event Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 mb-1">
                                  {event.event_title}
                                </h4>

                                <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
                                  <span>{formatTime(event.created_at)}</span>
                                  <span>•</span>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(event.triggered_by_role)}`}>
                                    {getRoleLabel(event.triggered_by_role)}
                                  </span>
                                  <span>•</span>
                                  <span>{getEventTypeLabel(event.event_type)}</span>
                                </div>

                                {event.event_description && (
                                  <p className="text-gray-700 text-sm mb-3">
                                    {expandedEvents.has(event.id)
                                      ? event.event_description
                                      : event.event_description.length > 100
                                        ? `${event.event_description.substring(0, 100)}...`
                                        : event.event_description
                                    }
                                  </p>
                                )}

                                {/* Related Data */}
                                {event.related_data && Object.keys(event.related_data).length > 0 && (
                                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-3">
                                    <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                                      Detalles
                                    </h5>
                                    <div className="space-y-1">
                                      {Object.entries(event.related_data).map(([key, value]) => (
                                        <div key={key} className="flex justify-between text-xs">
                                          <span className="text-gray-600 capitalize">
                                            {key.replace('_', ' ')}:
                                          </span>
                                          <span className="text-gray-900 font-medium">
                                            {typeof value === 'boolean' ? (value ? 'Sí' : 'No') : String(value)}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Expand/Collapse Button */}
                              {(event.event_description || (event.related_data && Object.keys(event.related_data).length > 0)) && (
                                <button className="text-gray-400 hover:text-gray-600 transition-colors">
                                  {expandedEvents.has(event.id) ? (
                                    <ChevronDown className="w-5 h-5" />
                                  ) : (
                                    <ChevronRight className="w-5 h-5" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OfferTimelineTab;
