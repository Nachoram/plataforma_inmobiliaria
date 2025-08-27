import React, { useState, useEffect } from 'react';
import { Check, X, Clock, Mail, Calendar, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface ApplicationWithDetails {
  id: string;
  property_id: string;
  applicant_id: string;
  message: string | null;
  status: 'pendiente' | 'aprobada' | 'rechazada';
  created_at: string;
  property: {
    address: string;
    city: string;
    price: number;
    listing_type: string;
  };
  applicant: {
    full_name: string | null;
    contact_email: string | null;
    contact_phone: string | null;
  };
}

export const ApplicationsPage: React.FC = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user]);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          property:properties!inner(address, city, price, listing_type),
          applicant:profiles!applications_applicant_id_fkey(full_name, contact_email, contact_phone)
        `)
        .eq('properties.owner_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId: string, status: 'aprobada' | 'rechazada') => {
    setUpdating(applicationId);
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status })
        .eq('id', applicationId);

      if (error) throw error;

      setApplications(applications.map(app =>
        app.id === applicationId ? { ...app, status } : app
      ));
    } catch (error) {
      console.error('Error updating application:', error);
    } finally {
      setUpdating(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprobada': return 'bg-green-100 text-green-800';
      case 'rechazada': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aprobada': return <Check className="h-4 w-4" />;
      case 'rechazada': return <X className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Postulaciones Recibidas</h1>
        <p className="text-gray-600">
          Gestiona las postulaciones de arriendo para tus propiedades
        </p>
      </div>

      {applications.length === 0 ? (
        <div className="text-center py-12">
          <Mail className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay postulaciones aún</h3>
          <p className="text-gray-500">
            Las postulaciones de arriendo aparecerán aquí cuando alguien se interese en tus propiedades.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((application) => (
            <div key={application.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {application.property.address}
                    </h3>
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{application.property.city}</span>
                      <span className="mx-2">•</span>
                      <span>{formatPrice(application.property.price)}/mes</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full flex items-center space-x-1 ${getStatusColor(application.status)}`}>
                      {getStatusIcon(application.status)}
                      <span>{application.status.charAt(0).toUpperCase() + application.status.slice(1)}</span>
                    </span>
                  </div>
                </div>

                {/* Applicant Information */}
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Información del Postulante</h4>
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="text-gray-500">Nombre: </span>
                      <span className="font-medium">{application.applicant.full_name || 'No especificado'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Email: </span>
                      <span className="font-medium">{application.applicant.contact_email}</span>
                    </div>
                    {application.applicant.contact_phone && (
                      <div>
                        <span className="text-gray-500">Teléfono: </span>
                        <span className="font-medium">{application.applicant.contact_phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Message */}
                {application.message && (
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
                    <h4 className="font-medium text-blue-900 mb-2">Mensaje del Postulante</h4>
                    <p className="text-blue-700 text-sm whitespace-pre-wrap">
                      {application.message}
                    </p>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>Recibida el {formatDate(application.created_at)}</span>
                  </div>

                  {application.status === 'pendiente' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => updateApplicationStatus(application.id, 'rechazada')}
                        disabled={updating === application.id}
                        className="px-3 py-1.5 text-sm border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                      >
                        Rechazar
                      </button>
                      <button
                        onClick={() => updateApplicationStatus(application.id, 'aprobada')}
                        disabled={updating === application.id}
                        className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        {updating === application.id ? 'Procesando...' : 'Aprobar'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};