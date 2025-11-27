/**
 * PostulantInfoTab.tsx - Información y Acciones para Postulantes
 *
 * Componente que combina información de la postulación con acciones específicas
 * para que el postulante pueda gestionar su solicitud de alquiler.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Edit3,
  X,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Send,
  MessageSquare,
  Trash2,
  Upload,
  Download
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { CustomButton } from '../../common';
import { supabase } from '../../../lib/supabase';
import { postulantValidations } from '../../../lib/postulantValidations';
import toast from 'react-hot-toast';

interface ApplicationData {
  id: string;
  property_id: string;
  applicant_id: string;
  status: 'pendiente' | 'en_revision' | 'aprobada' | 'rechazada' | 'finalizada' | 'modificada';
  message: string | null;
  created_at: string;
  updated_at: string;
  score?: number;
  application_characteristic_id?: string | null;
  has_contract_conditions?: boolean;
  has_contract?: boolean;
  contract_signed?: boolean;
  modification_count?: number;
  audit_log_count?: number;
  properties: {
    id: string;
    address_street: string;
    address_number?: string;
    address_commune: string;
    price_clp: number;
    listing_type: string;
    owner_id: string;
  };
  applicants?: any[];
  guarantors?: any[];
  application_applicants?: any[];
  application_guarantors?: any[];
}

interface PostulantInfoTabProps {
  postulation: ApplicationData;
  contractData?: any;
  applicantsDocuments?: Record<string, any[]>;
  guarantorsDocuments?: Record<string, any[]>;
  showContractForm?: boolean;
  onToggleContractForm?: () => void;
  onDownloadContract?: () => void;
  onViewContract?: () => void;
  onEditContract?: () => void;
  onCancelContract?: () => void;
  onOpenContractModal?: () => void;
  onSaveContract?: (data: any) => Promise<void>;
  onRefreshContract?: () => void;
  contractManuallyGenerated?: boolean;
  isDownloadingContract?: boolean;
  isViewingContract?: boolean;
  isCancellingContract?: boolean;
  loadingContract?: boolean;
  savingContract?: boolean;
}

export const PostulantInfoTab: React.FC<PostulantInfoTabProps> = ({
  postulation,
  contractData,
  applicantsDocuments = {},
  guarantorsDocuments = {},
  showContractForm,
  onToggleContractForm,
  onDownloadContract,
  onViewContract,
  onEditContract,
  onCancelContract,
  onOpenContractModal,
  onSaveContract,
  onRefreshContract,
  contractManuallyGenerated,
  isDownloadingContract,
  isViewingContract,
  isCancellingContract,
  loadingContract,
  savingContract
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Funciones de utilidad
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprobada': return 'bg-green-100 text-green-800';
      case 'rechazada': return 'bg-red-100 text-red-800';
      case 'finalizada': return 'bg-blue-100 text-blue-800';
      case 'modificada': return 'bg-amber-100 text-amber-800';
      case 'en_revision': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'aprobada': return 'Aprobada';
      case 'rechazada': return 'Rechazada';
      case 'finalizada': return 'Finalizada';
      case 'modificada': return 'Modificada';
      case 'en_revision': return 'En Revisión';
      default: return 'Pendiente';
    }
  };

  const canCancelApplication = () => {
    return postulation?.status === 'pendiente' || postulation?.status === 'en_revision';
  };

  const canViewContract = () => {
    return postulation?.status === 'aprobada' || postulation?.status === 'finalizada' || postulation?.status === 'modificada';
  };

  const canEditApplication = () => {
    return postulation?.status === 'pendiente' || postulation?.status === 'en_revision';
  };

  // Función para cancelar postulación
  const handleCancelApplication = async () => {
    // Validate cancellation
    const validation = await postulantValidations.validateApplicationCancellation(
      postulation.id,
      cancelReason
    );

    if (!validation.isValid) {
      toast.error(validation.error || 'Error de validación');
      return;
    }

    setCancelling(true);
    try {
      const { error } = await supabase.rpc('cancel_application_by_applicant', {
        p_application_id: postulation.id,
        p_reason: postulantValidations.sanitizeInput(cancelReason.trim(), 500)
      });

      if (error) throw error;

      toast.success('Postulación cancelada correctamente');
      setShowCancelModal(false);
      setCancelReason('');
      // Refresh data
      window.location.reload();
    } catch (error) {
      console.error('Error canceling application:', error);
      toast.error(error instanceof Error ? error.message : 'Error al cancelar la postulación');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Información de la Postulación */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FileText className="h-5 w-5 text-blue-600 mr-2" />
          Información de la Postulación
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status Card */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Estado Actual</h4>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(postulation.status)}`}>
                {getStatusLabel(postulation.status)}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Última actualización: {new Date(postulation.updated_at).toLocaleDateString('es-CL')}
            </p>
          </div>

          {/* Property Info Card */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Propiedad Postulada</h4>
            <div className="space-y-2">
              <p className="text-sm text-gray-700 font-medium">
                {postulation.properties.address_street} {postulation.properties.address_number || ''}
              </p>
              <p className="text-sm text-gray-600">{postulation.properties.address_commune}</p>
              <p className="text-sm font-semibold text-blue-700">
                {formatPrice(postulation.properties.price_clp)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Estado del Contrato */}
      {canViewContract() && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="h-5 w-5 text-green-600 mr-2" />
            Estado del Contrato
          </h3>

          {contractData ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                <h4 className="text-lg font-medium text-green-800">Contrato Disponible</h4>
              </div>
              <p className="text-green-700 mb-4">
                Tu contrato ha sido generado y está listo para revisión.
              </p>
              <div className="flex gap-3">
                {onViewContract && (
                  <CustomButton
                    variant="primary"
                    onClick={onViewContract}
                    disabled={isViewingContract}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {isViewingContract ? 'Cargando...' : 'Ver Contrato'}
                  </CustomButton>
                )}
                {onDownloadContract && (
                  <CustomButton
                    variant="outline"
                    onClick={onDownloadContract}
                    disabled={isDownloadingContract}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {isDownloadingContract ? 'Descargando...' : 'Descargar PDF'}
                  </CustomButton>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <Clock className="h-5 w-5 text-yellow-400 mr-3" />
                <h4 className="text-lg font-medium text-yellow-800">Contrato en Preparación</h4>
              </div>
              <p className="text-yellow-700">
                El contrato está siendo preparado por el arrendador. Te notificaremos cuando esté disponible.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Panel de Acciones del Postulante */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Edit3 className="h-5 w-5 text-purple-600 mr-2" />
          Acciones Disponibles
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Editar Postulación */}
          {canEditApplication() && (
            <CustomButton
              variant="outline"
              className="w-full flex items-center justify-start space-x-2 h-auto p-4"
              onClick={() => navigate(`/property/${postulation.property_id}/apply?edit=${postulation.id}`)}
            >
              <Edit3 className="h-5 w-5 text-blue-600" />
              <div className="text-left">
                <div className="font-medium">Editar Postulación</div>
                <div className="text-xs text-gray-500">Modificar datos enviados</div>
              </div>
            </CustomButton>
          )}

          {/* Ver Propiedad */}
          <CustomButton
            variant="outline"
            className="w-full flex items-center justify-start space-x-2 h-auto p-4"
            onClick={() => navigate(`/property/${postulation.property_id}`)}
          >
            <Eye className="h-5 w-5 text-green-600" />
            <div className="text-left">
              <div className="font-medium">Ver Propiedad</div>
              <div className="text-xs text-gray-500">Detalles completos</div>
            </div>
          </CustomButton>

          {/* Solicitar Documentos */}
          <CustomButton
            variant="outline"
            className="w-full flex items-center justify-start space-x-2 h-auto p-4"
            onClick={() => toast.info('Funcionalidad en desarrollo')}
          >
            <Send className="h-5 w-5 text-orange-600" />
            <div className="text-left">
              <div className="font-medium">Solicitar Documentos</div>
              <div className="text-xs text-gray-500">Pedir docs adicionales</div>
            </div>
          </CustomButton>

          {/* Solicitar Información */}
          <CustomButton
            variant="outline"
            className="w-full flex items-center justify-start space-x-2 h-auto p-4"
            onClick={() => toast.info('Funcionalidad en desarrollo')}
          >
            <MessageSquare className="h-5 w-5 text-indigo-600" />
            <div className="text-left">
              <div className="font-medium">Solicitar Información</div>
              <div className="text-xs text-gray-500">Pedir aclaraciones</div>
            </div>
          </CustomButton>

          {/* Cancelar Postulación */}
          {canCancelApplication() && (
            <CustomButton
              variant="outline"
              className="w-full flex items-center justify-start space-x-2 h-auto p-4 border-red-300 text-red-700 hover:bg-red-50"
              onClick={() => setShowCancelModal(true)}
            >
              <X className="h-5 w-5 text-red-600" />
              <div className="text-left">
                <div className="font-medium">Cancelar Postulación</div>
                <div className="text-xs text-red-500">Retirar solicitud</div>
              </div>
            </CustomButton>
          )}
        </div>
      </div>

      {/* Modal de Cancelación */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Cancelar Postulación
                  </h3>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">
                  ¿Estás seguro de que quieres cancelar esta postulación?
                  Esta acción no se puede deshacer.
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Razón de cancelación *
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Explica por qué cancelas la postulación..."
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3">
                <CustomButton
                  variant="secondary"
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancelReason('');
                  }}
                  disabled={cancelling}
                >
                  Cancelar
                </CustomButton>
                <CustomButton
                  variant="danger"
                  onClick={handleCancelApplication}
                  disabled={cancelling || !cancelReason.trim()}
                >
                  {cancelling ? 'Cancelando...' : 'Confirmar Cancelación'}
                </CustomButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
