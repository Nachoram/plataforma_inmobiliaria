import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, Mail, CheckCircle, XCircle, AlertCircle, Edit } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface ScheduledVisit {
  id: string;
  visit_request_id: string;
  property_id: string;
  scheduled_date: string;
  scheduled_time_slot: string;
  visitor_name: string;
  visitor_email: string;
  visitor_phone: string;
  visit_purpose: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  check_in_time?: string;
  check_out_time?: string;
  visit_notes?: string;
  created_at: string;
}

interface ScheduledVisitsManagerProps {
  propertyId?: string; // Opcional - si no se especifica, muestra todas las propiedades del usuario
}

export const ScheduledVisitsManager: React.FC<ScheduledVisitsManagerProps> = ({ propertyId }) => {
  const { user } = useAuth();
  const [visits, setVisits] = useState<ScheduledVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'confirmed' | 'completed'>('all');

  useEffect(() => {
    if (user) {
      loadScheduledVisits();
    }
  }, [user, propertyId]);

  const loadScheduledVisits = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('scheduled_visits')
        .select('*')
        .eq('property_owner_id', user?.id)
        .order('scheduled_date', { ascending: false });

      if (propertyId) {
        query = query.eq('property_id', propertyId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setVisits(data || []);
    } catch (error) {
      console.error('Error loading scheduled visits:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateVisitStatus = async (visitId: string, newStatus: ScheduledVisit['status']) => {
    try {
      const { error } = await supabase
        .from('scheduled_visits')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', visitId);

      if (error) throw error;

      // Actualizar el estado local
      setVisits(prev => prev.map(visit =>
        visit.id === visitId ? { ...visit, status: newStatus } : visit
      ));

      // También actualizar el visit_request correspondiente
      const visit = visits.find(v => v.id === visitId);
      if (visit) {
        const requestStatus = newStatus === 'confirmed' ? 'confirmed' :
                             newStatus === 'cancelled' ? 'rejected' : 'pending';

        await supabase
          .from('visit_requests')
          .update({ status: requestStatus })
          .eq('id', visit.visit_request_id);
      }

    } catch (error) {
      console.error('Error updating visit status:', error);
      alert('Error al actualizar el estado de la visita');
    }
  };

  const filteredVisits = visits.filter(visit => {
    if (filter === 'all') return true;
    return visit.status === filter;
  });

  const getStatusColor = (status: ScheduledVisit['status']) => {
    switch (status) {
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no_show': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: ScheduledVisit['status']) => {
    switch (status) {
      case 'scheduled': return 'Agendada';
      case 'confirmed': return 'Confirmada';
      case 'in_progress': return 'En Progreso';
      case 'completed': return 'Completada';
      case 'cancelled': return 'Cancelada';
      case 'no_show': return 'No Asistió';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Cargando visitas agendadas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Calendar className="h-6 w-6 mr-3 text-blue-600" />
            Visitas Agendadas
          </h2>
          <p className="text-gray-600 mt-1">
            Gestiona todas las visitas confirmadas para tus propiedades
          </p>
        </div>

        {/* Filtros */}
        <div className="flex space-x-2">
          {(['all', 'scheduled', 'confirmed', 'completed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'Todas' :
               status === 'scheduled' ? 'Agendadas' :
               status === 'confirmed' ? 'Confirmadas' : 'Completadas'}
              ({visits.filter(v => status === 'all' || v.status === status).length})
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Visitas */}
      {filteredVisits.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filter === 'all' ? 'No hay visitas agendadas' : `No hay visitas ${filter}`}
          </h3>
          <p className="text-gray-600">
            {filter === 'all'
              ? 'Las visitas confirmadas aparecerán aquí'
              : `No hay visitas en estado "${filter}"`
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredVisits.map((visit) => (
            <div key={visit.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Fecha y Hora */}
                  <div className="flex items-center space-x-4 mb-3">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span className="font-medium">
                        {new Date(visit.scheduled_date).toLocaleDateString('es-CL', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>
                        {visit.scheduled_time_slot === 'flexible'
                          ? 'Horario flexible'
                          : visit.scheduled_time_slot.replace('-', ':00 - ') + ':00'
                        }
                      </span>
                    </div>
                  </div>

                  {/* Información del Visitante */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-sm text-gray-900">{visit.visitor_name}</span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-sm text-gray-900">{visit.visitor_email}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-sm text-gray-900">{visit.visitor_phone}</span>
                    </div>
                  </div>

                  {/* Estado y Acciones */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(visit.status)}`}>
                        {getStatusText(visit.status)}
                      </span>

                      {visit.visit_notes && (
                        <span className="text-xs text-gray-500 italic">
                          "{visit.visit_notes}"
                        </span>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="flex space-x-2">
                      {visit.status === 'scheduled' && (
                        <button
                          onClick={() => updateVisitStatus(visit.id, 'confirmed')}
                          className="flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Confirmar
                        </button>
                      )}

                      {visit.status === 'confirmed' && (
                        <button
                          onClick={() => updateVisitStatus(visit.id, 'in_progress')}
                          className="flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Clock className="h-4 w-4 mr-1" />
                          Iniciar
                        </button>
                      )}

                      {visit.status === 'in_progress' && (
                        <button
                          onClick={() => updateVisitStatus(visit.id, 'completed')}
                          className="flex items-center px-3 py-1 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Completar
                        </button>
                      )}

                      {(visit.status === 'scheduled' || visit.status === 'confirmed') && (
                        <button
                          onClick={() => updateVisitStatus(visit.id, 'cancelled')}
                          className="flex items-center px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Estadísticas */}
      {visits.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{visits.length}</div>
              <div className="text-sm text-gray-600">Total Visitas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {visits.filter(v => v.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-600">Completadas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {visits.filter(v => v.status === 'scheduled' || v.status === 'confirmed').length}
              </div>
              <div className="text-sm text-gray-600">Pendientes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {visits.filter(v => v.status === 'cancelled' || v.status === 'no_show').length}
              </div>
              <div className="text-sm text-gray-600">Canceladas</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
