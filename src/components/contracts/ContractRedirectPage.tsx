import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft, ExternalLink } from 'lucide-react';

export const ContractRedirectPage: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
            <FileText className="h-8 w-8 text-blue-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Gestión de Contratos
          </h1>

          <p className="text-gray-600 mb-6 leading-relaxed">
            La gestión de contratos se realiza ahora directamente desde la administración de postulaciones.
            Desde allí puedes crear, editar y gestionar todos los contratos relacionados con las postulaciones.
          </p>

          <div className="space-y-4">
            <Link
              to="/my-applications"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Ir a Mis Postulaciones
            </Link>

            <p className="text-sm text-gray-500">
              Si necesitas acceso directo a contratos por motivos administrativos,
              contacta al equipo de soporte.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
