import React from 'react';
import {
  FileText,
  Download,
  Eye,
  Edit3,
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  DollarSign,
  Mail,
  User,
  Users,
  Loader
} from 'lucide-react';
import { formatPriceCLP } from '../../lib/supabase';

interface ContractSummaryCardProps {
  // Contract data
  status: string;
  createdAt: string;
  approvedAt?: string;
  finalAmount?: number;
  finalAmountCurrency?: 'clp' | 'uf';
  guaranteeAmount?: number;
  guaranteeAmountCurrency?: 'clp' | 'uf';
  startDate?: string;
  validityPeriodMonths?: number;
  landlordEmail?: string;
  tenantEmail?: string;
  guarantorEmail?: string;

  // Signature data
  signatures: {
    owner: Date | null;
    tenant: Date | null;
    guarantor: Date | null;
  };

  // Contract files
  contractUrl?: string;
  signedContractUrl?: string;
  contractHtml?: string;

  // Actions
  onDownload?: () => void;
  onView?: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
  onOpenEditor?: () => void; // NEW: Opens contract canvas editor

  // Contract ID for editor
  contractId?: string;

  // Permissions
  canEdit?: boolean;
  canCancel?: boolean;

  // Loading states
  isDownloading?: boolean;
  isViewing?: boolean;
  isCancelling?: boolean;
}

const ContractSummaryCard: React.FC<ContractSummaryCardProps> = ({
  status,
  createdAt,
  approvedAt,
  finalAmount = 0,
  finalAmountCurrency = 'clp',
  guaranteeAmount = 0,
  guaranteeAmountCurrency = 'clp',
  startDate = '',
  validityPeriodMonths = 12,
  landlordEmail = '',
  tenantEmail = '',
  guarantorEmail,
  signatures = { owner: null, tenant: null, guarantor: null },
  contractUrl,
  signedContractUrl,
  contractHtml,
  onDownload,
  onView,
  onEdit,
  onCancel,
  onOpenEditor,
  contractId,
  canEdit = false,
  canCancel = false,
  isDownloading = false,
  isViewing = false,
  isCancelling = false
}) => {
  // Helper functions
  const getStatusBadge = (contractStatus: string) => {
    const statusConfig = {
      draft: {
        label: 'Borrador',
        color: 'bg-gray-100 text-gray-800 border-gray-300',
        icon: Clock
      },
      approved: {
        label: 'Aprobado',
        color: 'bg-blue-100 text-blue-800 border-blue-300',
        icon: CheckCircle
      },
      sent_to_signature: {
        label: 'En Firma',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        icon: Clock
      },
      partially_signed: {
        label: 'Parcialmente Firmado',
        color: 'bg-orange-100 text-orange-800 border-orange-300',
        icon: Clock
      },
      fully_signed: {
        label: 'Firmado',
        color: 'bg-green-100 text-green-800 border-green-300',
        icon: CheckCircle
      },
      cancelled: {
        label: 'Cancelado',
        color: 'bg-red-100 text-red-800 border-red-300',
        icon: AlertTriangle
      }
    };

    const config = statusConfig[contractStatus as keyof typeof statusConfig] || statusConfig.draft;
    const IconComponent = config.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}>
        <IconComponent className="h-4 w-4 mr-1" />
        {config.label}
      </span>
    );
  };

  const getSignatureStatus = (signedAt: Date | null) => {
    if (signedAt) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Firmado
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <Clock className="h-3 w-3 mr-1" />
        Pendiente
      </span>
    );
  };

  const formatCurrency = (amount: number, currency: 'clp' | 'uf') => {
    if (currency === 'uf') {
      return `${amount} UF`;
    }
    return formatPriceCLP(amount);
  };

  const calculateEndDate = (startDate: string, months: number) => {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + months);
    return end.toLocaleDateString('es-CL');
  };

  const hasContractFile = contractUrl || signedContractUrl || contractHtml;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg border border-blue-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6 text-white" />
            <h3 className="text-lg font-semibold text-white">Contrato Generado</h3>
          </div>
          {getStatusBadge(status)}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Status and Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Calendar className="h-4 w-4 text-blue-600 mr-2" />
              Fechas del Contrato
            </h4>
            <div className="space-y-2 text-sm text-gray-600">
              <p><span className="font-medium">Creado:</span> {new Date(createdAt).toLocaleDateString('es-CL')}</p>
              {approvedAt && (
                <p><span className="font-medium">Aprobado:</span> {new Date(approvedAt).toLocaleDateString('es-CL')}</p>
              )}
              <p><span className="font-medium">Inicio:</span> {startDate ? new Date(startDate).toLocaleDateString('es-CL') : 'No definida'}</p>
              <p><span className="font-medium">Término:</span> {startDate ? calculateEndDate(startDate, validityPeriodMonths) : 'No definida'}</p>
              <p><span className="font-medium">Duración:</span> {validityPeriodMonths} meses</p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <DollarSign className="h-4 w-4 text-green-600 mr-2" />
              Montos del Contrato
            </h4>
            <div className="space-y-2 text-sm text-gray-600">
              <p><span className="font-medium">Monto arriendo:</span> {formatCurrency(finalAmount, finalAmountCurrency)}</p>
              <p><span className="font-medium">Monto garantía:</span> {formatCurrency(guaranteeAmount, guaranteeAmountCurrency)}</p>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <Users className="h-4 w-4 text-purple-600 mr-2" />
            Estado de Firmas
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-700 mb-2">Propietario</div>
              {getSignatureStatus(signatures.owner)}
              {signatures.owner && (
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(signatures.owner).toLocaleDateString('es-CL')}
                </div>
              )}
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-gray-700 mb-2">Arrendatario</div>
              {getSignatureStatus(signatures.tenant)}
              {signatures.tenant && (
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(signatures.tenant).toLocaleDateString('es-CL')}
                </div>
              )}
            </div>
            {guarantorEmail && (
              <div className="text-center">
                <div className="text-sm font-medium text-gray-700 mb-2">Aval</div>
                {getSignatureStatus(signatures.guarantor)}
                {signatures.guarantor && (
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(signatures.guarantor).toLocaleDateString('es-CL')}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <Mail className="h-4 w-4 text-blue-600 mr-2" />
            Información de Contacto
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <p><span className="font-medium">Arrendador:</span> {landlordEmail}</p>
            <p><span className="font-medium">Arrendatario:</span> {tenantEmail}</p>
            {guarantorEmail && (
              <p className="md:col-span-2"><span className="font-medium">Aval:</span> {guarantorEmail}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <User className="h-4 w-4 text-gray-600 mr-2" />
            Acciones Disponibles
          </h4>
          <div className="flex flex-wrap gap-3">
            {/* PRIMARY ACTION: Open Editor - Prominent styling */}
            {contractId && onOpenEditor && (
              <button
                onClick={onOpenEditor}
                className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg hover:from-orange-700 hover:to-amber-700 transition-all duration-200 font-semibold text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5"
                title="Editar el contrato asociado a esta postulación"
              >
                <Edit3 className="h-5 w-5 mr-2" />
                Abrir Editor
              </button>
            )}

            {hasContractFile && onView && (
              <button
                onClick={onView}
                disabled={isViewing}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                title="Ver contrato completo"
              >
                {isViewing ? (
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                {isViewing ? 'Cargando...' : 'Ver Contrato'}
              </button>
            )}

            {(signedContractUrl || contractUrl) && onDownload && (
              <button
                onClick={onDownload}
                disabled={isDownloading}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                title="Descargar contrato"
              >
                {isDownloading ? (
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {isDownloading ? 'Descargando...' : 'Descargar'}
              </button>
            )}

            {canEdit && status === 'draft' && onEdit && (
              <button
                onClick={onEdit}
                className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
                title="Editar contrato"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Editar
              </button>
            )}

            {canCancel && status !== 'cancelled' && status !== 'fully_signed' && onCancel && (
              <button
                onClick={onCancel}
                disabled={isCancelling}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                title="Cancelar contrato"
              >
                {isCancelling ? (
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <AlertTriangle className="h-4 w-4 mr-2" />
                )}
                {isCancelling ? 'Cancelando...' : 'Cancelar'}
              </button>
            )}
          </div>

          {!hasContractFile && (
            <p className="text-sm text-gray-500 mt-2">
              El contrato está siendo generado. Las opciones de visualización estarán disponibles próximamente.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContractSummaryCard;
