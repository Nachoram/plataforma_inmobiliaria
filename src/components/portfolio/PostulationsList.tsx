import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Mail, Phone, DollarSign, Briefcase, UserCheck, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Postulation {
  id: string;
  applicant_id: string;
  status: string;
  created_at: string;
  message: string | null;
  application_characteristic_id: string | null;
  applicant_name: string;
  applicant_email: string | null;
  applicant_phone: string | null;
  guarantor_name: string | null;
  guarantor_email: string | null;
  guarantor_phone: string | null;
  guarantor_characteristic_id: string | null;
}

interface PostulationsListProps {
  postulations?: Postulation[];
  propertyId?: string;
}

const PostulationsList: React.FC<PostulationsListProps> = ({ postulations: propPostulations, propertyId }) => {
  const navigate = useNavigate();
  const [postulations, setPostulations] = useState<Postulation[]>(propPostulations || []);
  const [loading, setLoading] = useState(!propPostulations && !!propertyId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPostulation, setSelectedPostulation] = useState<Postulation | null>(null);

  // Si no se pasaron postulaciones pero sí un propertyId, cargarlas
  React.useEffect(() => {
    console.log('🔍 [PostulationsList] Props recibidos:', { propPostulations, propertyId });
    
    if (!propPostulations && propertyId) {
      console.log('🔍 [PostulationsList] Cargando postulaciones para property:', propertyId);
      const fetchPostulations = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('applications')
            .select(`
              id,
              applicant_id,
              status,
              created_at,
              message,
              application_characteristic_id,
              profiles!applicant_id (
                first_name,
                paternal_last_name,
                maternal_last_name,
                email,
                phone
              ),
              guarantors!guarantor_id (
                full_name,
                contact_email,
                contact_phone,
                rut,
                guarantor_characteristic_id
              )
            `)
            .eq('property_id', propertyId)
            .order('created_at', { ascending: false });

          console.log('🔍 [PostulationsList] Respuesta DB:', { data, error });

          if (!error && data) {
            const formattedPostulations: Postulation[] = data.map((app: any) => ({
              id: app.id,
              applicant_id: app.applicant_id,
              status: app.status,
              created_at: app.created_at,
              message: app.message,
              application_characteristic_id: app.application_characteristic_id,
              applicant_name: app.profiles
                ? `${app.profiles.first_name} ${app.profiles.paternal_last_name} ${app.profiles.maternal_last_name || ''}`.trim()
                : 'Sin nombre',
              applicant_email: app.profiles?.email || null,
              applicant_phone: app.profiles?.phone || null,
              guarantor_name: app.guarantors?.full_name || null,
              guarantor_email: app.guarantors?.contact_email || null,
              guarantor_phone: app.guarantors?.contact_phone || null,
              guarantor_characteristic_id: app.guarantors?.guarantor_characteristic_id || null,
            }));
            console.log('✅ [PostulationsList] Postulaciones formateadas:', formattedPostulations);
            setPostulations(formattedPostulations);
          } else {
            console.error('❌ [PostulationsList] Error o sin datos:', error);
          }
        } catch (error) {
          console.error('❌ [PostulationsList] Error en catch:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchPostulations();
    } else if (propPostulations) {
      console.log('✅ [PostulationsList] Usando postulaciones de props:', propPostulations);
      setPostulations(propPostulations);
    } else {
      console.warn('⚠️ [PostulationsList] Sin postulaciones ni propertyId');
    }
  }, [propPostulations, propertyId]);

  const handleViewDetails = (postulation: Postulation) => {
    navigate(`/postulation/${postulation.id}/admin`);
  };

  const handleViewModal = (postulation: Postulation) => {
    setSelectedPostulation(postulation);
    setIsModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'aprobada':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rechazada':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pendiente':
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'aprobada':
        return 'Aprobada';
      case 'rechazada':
        return 'Rechazada';
      case 'pendiente':
      default:
        return 'Pendiente';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
        <span className="ml-3 text-gray-600">Cargando postulaciones...</span>
      </div>
    );
  }

  if (postulations.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-2">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-gray-500">No hay postulaciones para esta propiedad aún.</p>
      </div>
    );
  }

  return (
    <div className="postulations-container">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Postulaciones ({postulations.length})
      </h3>

      {/* Tabla de postulaciones */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Postulante
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {postulations.map((postulation) => (
              <tr key={postulation.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-xs">
                        {postulation.applicant_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{postulation.applicant_name}</div>
                      {postulation.applicant_email && (
                        <div className="text-xs text-gray-500">{postulation.applicant_email}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {new Date(postulation.created_at).toLocaleDateString('es-CL', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(postulation.status)}`}>
                    {getStatusLabel(postulation.status)}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewModal(postulation)}
                      className="inline-flex items-center px-3 py-2 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:bg-gray-700 transition-all duration-200"
                      title="Ver Detalles"
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Ver
                    </button>
                    <button
                      onClick={() => handleViewDetails(postulation)}
                      className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
                      title="Administrar Postulación"
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Administrar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Detalles */}
      {isModalOpen && selectedPostulation && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-indigo-600 via-blue-600 to-blue-700 px-6 py-8 rounded-t-2xl">
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors bg-white/10 rounded-full p-2 hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </button>
              
              <div className="flex flex-col md:flex-row items-center md:items-start space-y-3 md:space-y-0 md:space-x-4">
                {/* Avatar */}
                <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center shadow-2xl border-4 border-white/30">
                  <span className="text-blue-600 font-bold text-3xl">
                    {selectedPostulation.applicant_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                </div>
                
                {/* Info */}
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-3xl font-bold text-white mb-2">{selectedPostulation.applicant_name}</h2>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                    <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full border-2 shadow-lg ${getStatusColor(selectedPostulation.status)}`}>
                      {getStatusLabel(selectedPostulation.status)}
                    </span>
                  </div>
                  <p className="text-blue-100 mt-2 text-sm">
                    Postulación recibida el {new Date(selectedPostulation.created_at).toLocaleDateString('es-CL', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Sección del Postulante */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 shadow-md border border-blue-100">
                  <div className="flex items-center mb-4 pb-3 border-b border-blue-200">
                    <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
                      <span className="text-white text-xl">👤</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 ml-3">Perfil del Postulante</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {selectedPostulation.applicant_email && (
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-blue-600" />
                          <div className="flex-1">
                            <label className="text-xs font-semibold text-gray-500 uppercase block">Email</label>
                            <p className="text-sm text-gray-900 mt-1">{selectedPostulation.applicant_email}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {selectedPostulation.applicant_phone && (
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-green-600" />
                          <div className="flex-1">
                            <label className="text-xs font-semibold text-gray-500 uppercase block">Teléfono</label>
                            <p className="text-sm text-gray-900 mt-1">{selectedPostulation.applicant_phone}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedPostulation.message && (
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="flex items-start space-x-2">
                          <FileText className="h-4 w-4 text-purple-600 mt-1" />
                          <div className="flex-1">
                            <label className="text-xs font-semibold text-gray-500 uppercase block">Mensaje</label>
                            <p className="text-sm text-gray-900 mt-1">{selectedPostulation.message}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sección del Aval */}
                {selectedPostulation.guarantor_name && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 shadow-md border border-green-100">
                    <div className="flex items-center mb-4 pb-3 border-b border-green-200">
                      <div className="h-10 w-10 bg-green-600 rounded-xl flex items-center justify-center shadow-md">
                        <span className="text-white text-xl">🛡️</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 ml-3">Datos del Aval</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="flex items-center space-x-2">
                          <UserCheck className="h-4 w-4 text-green-600" />
                          <div className="flex-1">
                            <label className="text-xs font-semibold text-gray-500 uppercase block">Nombre</label>
                            <p className="text-sm font-semibold text-gray-900 mt-1">{selectedPostulation.guarantor_name}</p>
                          </div>
                        </div>
                      </div>
                      
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <div className="flex items-start space-x-2">
                        <FileText className="h-4 w-4 text-gray-600 mt-1" />
                        <div className="flex-1">
                          <label className="text-xs font-semibold text-gray-500 uppercase block">Nota</label>
                          <p className="text-sm text-gray-700 mt-1">Datos de contacto del aval disponibles en documentación adjunta</p>
                        </div>
                      </div>
                    </div>
                    </div>
                  </div>
                )}
              </div>


              {/* Footer */}
              <div className="flex justify-center mt-6 pt-4 border-t-2 border-gray-200">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors shadow-md"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostulationsList;
