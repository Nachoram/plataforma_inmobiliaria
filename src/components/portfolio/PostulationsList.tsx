import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface Postulation {
  id: string;
  property_id: string;
  applicant_id: string;
  status: string;
  created_at: string;
  application_characteristic_id: string;
  profiles?: {
    first_name: string;
    paternal_last_name: string;
    maternal_last_name: string;
    email: string;
    phone: string;
  };
  guarantors?: {
    first_name: string;
    paternal_last_name: string;
    maternal_last_name: string;
    email: string;
    phone: string;
  }[];
}

interface PostulationsListProps {
  propertyId: string;
}

const PostulationsList: React.FC<PostulationsListProps> = ({ propertyId }) => {
  const [postulations, setPostulations] = useState<Postulation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!propertyId) return;

    const fetchPostulations = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          property_id,
          applicant_id,
          status,
          created_at,
          application_characteristic_id,
          profiles!applicant_id(
            first_name,
            paternal_last_name,
            maternal_last_name,
            email,
            phone
          ),
          guarantors!guarantor_id(
            first_name,
            paternal_last_name,
            maternal_last_name,
            email,
            phone
          )
        `)
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching postulations:', error);
      } else {
        setPostulations(data || []);
      }
      setLoading(false);
    };

    fetchPostulations();
  }, [propertyId]);

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
    <div className="postulations-container space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Postulaciones ({postulations.length})
      </h3>

      {postulations.map((postulation) => (
        <div key={postulation.id} className="postulation-item bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">
                {postulation.profiles?.first_name} {postulation.profiles?.paternal_last_name} {postulation.profiles?.maternal_last_name}
              </h4>
              <p className="text-sm text-gray-600">{postulation.profiles?.email}</p>
              {postulation.profiles?.phone && (
                <p className="text-sm text-gray-600">{postulation.profiles?.phone}</p>
              )}
            </div>

            <div className="flex flex-col items-end space-y-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                postulation.status === 'aprobada'
                  ? 'bg-green-100 text-green-800'
                  : postulation.status === 'rechazada'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {postulation.status === 'aprobada' ? 'Aprobada' :
                 postulation.status === 'rechazada' ? 'Rechazada' :
                 'Pendiente'}
              </span>

              <span className="text-xs text-gray-500">
                {new Date(postulation.created_at).toLocaleDateString('es-CL')}
              </span>
            </div>
          </div>

          {postulation.guarantors && postulation.guarantors.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Aval:</h5>
              <div className="text-sm text-gray-600">
                {postulation.guarantors[0].first_name} {postulation.guarantors[0].paternal_last_name} {postulation.guarantors[0].maternal_last_name}
                {postulation.guarantors[0].email && (
                  <span className="block">{postulation.guarantors[0].email}</span>
                )}
                {postulation.guarantors[0].phone && (
                  <span className="block">{postulation.guarantors[0].phone}</span>
                )}
              </div>
            </div>
          )}

          <div className="mt-4 flex space-x-2">
            <button className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
              Aprobar
            </button>
            <button className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
              Rechazar
            </button>
            <button className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
              Ver Detalles
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PostulationsList;
