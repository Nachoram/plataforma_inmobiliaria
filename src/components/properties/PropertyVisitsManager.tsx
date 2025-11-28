import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ScheduledVisitsManager } from './ScheduledVisitsManager';

export const PropertyVisitsManager: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Propiedad no encontrada</h2>
        <p className="text-gray-600 mb-6">La propiedad especificada no existe.</p>
        <Link to="/portfolio" className="text-blue-600 hover:text-blue-800 font-medium">
          ← Volver al portafolio
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <Link
          to={`/portfolio/property/${id}`}
          className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a la propiedad
        </Link>
      </div>

      {/* Visits Manager */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <ScheduledVisitsManager propertyId={id} />
      </div>
    </div>
  );
};


