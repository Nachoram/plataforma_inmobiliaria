import React from 'react';

// ========================================================================
// INTERFACES & TYPES
// ========================================================================

interface Postulation {
  id: string;
  status: string;
  score?: number;
  created_at: string;
  property?: {
    title: string;
    city: string;
    region: string;
  };
  applicant?: {
    name: string;
    email: string;
  };
}

interface PostulationCardProps {
  postulation: Postulation;
  onSelect: (postulation: Postulation) => void;
  isSelected?: boolean;
}

// ========================================================================
// COMPONENTS
// ========================================================================

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Aprobado':
        return { bg: 'bg-green-100', text: 'text-green-800', icon: '🟢' };
      case 'En Revisión':
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '🟡' };
      case 'Rechazado':
        return { bg: 'bg-red-100', text: 'text-red-800', icon: '🔴' };
      case 'Info Solicitada':
        return { bg: 'bg-orange-100', text: 'text-orange-800', icon: '🟠' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', icon: '⚪' };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <span className="mr-1">{config.icon}</span>
      {status}
    </span>
  );
};

// ========================================================================
// UTILS
// ========================================================================

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

// ========================================================================
// MAIN COMPONENT
// ========================================================================

export const PostulationCard: React.FC<PostulationCardProps> = ({
  postulation,
  onSelect,
  isSelected
}) => {
  return (
    <div
      onClick={() => onSelect(postulation)}
      className={`
        border-2 rounded-lg p-4 mb-3 cursor-pointer
        transition-all duration-200 hover:shadow-sm
        ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
      `}
    >
      {/* HEADER: ID + Indicador */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-sm md:text-base">
          Postulación #{postulation.id.slice(0, 8)}
        </h3>
        <span className="text-2xl text-gray-400">›</span>
      </div>

      {/* ESTADO + SCORE */}
      <div className="flex items-center gap-2 mb-3">
        <StatusBadge status={postulation.status} />
        <span className="text-sm text-gray-600">
          Score: {postulation.score || 'N/A'}
        </span>
      </div>

      {/* PROPIEDAD */}
      <div className="mb-2 text-sm text-gray-700">
        <p className="font-medium truncate">
          {postulation.property?.title || 'Propiedad'}
        </p>
        <p className="text-xs text-gray-500">
          {postulation.property?.city}, {postulation.property?.region}
        </p>
      </div>

      {/* POSTULANTE */}
      <div className="mb-3 text-sm">
        <p className="font-medium text-gray-700">
          {postulation.applicant?.name || 'Postulante'}
        </p>
        <p className="text-xs text-gray-500">
          {postulation.applicant?.email || 'N/A'}
        </p>
      </div>

      {/* FECHA */}
      <div className="text-xs text-gray-400 border-t pt-2">
        Recibida: {formatDate(postulation.created_at)}
      </div>
    </div>
  );
};
