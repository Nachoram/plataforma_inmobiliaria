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

interface PostulationDetailDrawerProps {
  postulation: Postulation | null;
  isOpen: boolean;
  onClose: () => void;
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

export const PostulationDetailDrawer: React.FC<PostulationDetailDrawerProps> = ({
  postulation,
  isOpen,
  onClose
}) => {
  if (!postulation) return null;

  return (
    <>
      {/* OVERLAY */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* DRAWER */}
      <div
        className={`
          fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl
          max-h-[90vh] overflow-y-auto z-50
          md:static md:rounded-none md:max-h-none
          transition-transform duration-300
          ${isOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
        `}
      >
        {/* HEADER */}
        <div className="sticky top-0 flex items-center justify-between h-14 bg-white border-b px-4 md:hidden">
          <button onClick={onClose} className="p-2">▼</button>
          <h2 className="font-bold">Detalles</h2>
          <div className="w-8" />
        </div>

        {/* CONTENIDO */}
        <div className="p-4 md:p-6 space-y-6">

          {/* SECCIÓN 1: POSTULACIÓN */}
          <section>
            <h3 className="font-bold text-lg mb-3 pb-2 border-b">
              POSTULACIÓN
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">ID:</span>
                <span className="font-medium">#{postulation.id.slice(0, 8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Estado:</span>
                <StatusBadge status={postulation.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Score:</span>
                <span className="font-medium">{postulation.score}/1000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Recibida:</span>
                <span className="font-medium">{formatDate(postulation.created_at)}</span>
              </div>
            </div>
          </section>

          {/* SECCIÓN 2: PROPIEDAD */}
          <section>
            <h3 className="font-bold text-lg mb-3 pb-2 border-b">
              PROPIEDAD
            </h3>
            <div className="space-y-2 text-sm">
              <p className="font-medium">{postulation.property?.title}</p>
              <p className="text-gray-600">{postulation.property?.city}, {postulation.property?.region}</p>
              <p className="text-gray-500">3 hab | 2 baños | 120m²</p>
            </div>
          </section>

          {/* SECCIÓN 3: POSTULANTE */}
          <section>
            <h3 className="font-bold text-lg mb-3 pb-2 border-b">
              POSTULANTE
            </h3>
            <div className="space-y-2 text-sm">
              <p className="font-medium">{postulation.applicant?.name}</p>
              <p className="text-gray-600">{postulation.applicant?.email}</p>
              <p className="text-gray-500">+56912345678</p>
            </div>
          </section>

          {/* SECCIÓN 4: AVALES */}
          <section>
            <h3 className="font-bold text-lg mb-3 pb-2 border-b">
              AVALES
            </h3>
            <div className="text-sm text-gray-600">
              Sin avales registrados
            </div>
          </section>

          {/* SECCIÓN 5: INGRESOS */}
          <section>
            <h3 className="font-bold text-lg mb-3 pb-2 border-b">
              INGRESOS
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Postulantes:</span>
                <span className="font-medium">$15.000.000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avales:</span>
                <span className="font-medium">$0</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-2">
                <span>Total:</span>
                <span>$15.000.000</span>
              </div>
            </div>
          </section>

        </div>

        {/* ACCIONES FOOTER */}
        <div className="sticky bottom-0 bg-white border-t p-4 md:hidden">
          <div className="grid grid-cols-2 gap-3">
            <button className="px-4 py-3 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700">
              Aprobar
            </button>
            <button className="px-4 py-3 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700">
              Rechazar
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <button className="px-4 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
              Editor
            </button>
            <button className="px-4 py-3 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700">
              Condiciones
            </button>
          </div>
        </div>

      </div>
    </>
  );
};

export default PostulationDetailDrawer;
