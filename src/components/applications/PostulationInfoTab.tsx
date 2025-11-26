/**
 * PostulationInfoTab.tsx
 *
 * Componente que centraliza toda la información de la postulación.
 * Incluye: header con status/score, resumen financiero, tarjeta de contrato,
 * listado de postulantes y avales.
 *
 * @since 2025-11-26
 */

import React from 'react';
import RentalContractConditionsForm from '../dashboard/RentalContractConditionsForm';
import {
  Settings,
  Mail,
  Phone,
  DollarSign,
  Briefcase,
  FileText,
  UserCheck,
  Calendar,
  MapPin,
  Building,
  TrendingUp
} from 'lucide-react';
import ContractSummaryCard from '../dashboard/ContractSummaryCard';

interface PostulantProfile {
  email: string;
  phone: string;
  income: number;
  employment: string;
}

interface GuarantorInfo {
  name: string;
  email: string;
  phone: string;
  income: number;
}

interface PostulationData {
  id: string;
  property_id: string;
  status: string;
  score?: number;
  message: string;
  created_at: string;
  updated_at: string;
  property: {
    id: string;
    address_street?: string;
    address_number?: string;
    address_commune?: string;
    price_clp?: number;
    listing_type?: string;
  };
  applicants: any[];
  guarantors: any[];
  has_contract_conditions?: boolean;
  has_contract?: boolean;
  contract_signed?: boolean;
}

interface ContractData {
  id?: string;
  application_id: string;
  start_date: string;
  validity_period_months: number;
  final_amount: number;
  final_amount_currency: 'clp' | 'uf';
  guarantee_amount: number;
  guarantee_amount_currency: 'clp' | 'uf';
  has_dicom_clause: boolean;
  has_auto_renewal_clause: boolean;
  tenant_email: string;
  landlord_email: string;
  guarantor_email?: string;
  account_holder_name: string;
  account_number: string;
  account_bank: string;
  account_type: string;
  has_brokerage_commission: boolean;
  broker_name?: string;
  broker_amount?: number;
  broker_rut?: string;
  allows_pets: boolean;
  is_furnished: boolean;
  status?: string;
  created_at?: string;
  approved_at?: string;
  signed_contract_url?: string;
  contract_html?: string;
  owner_signed_at?: Date | null;
  tenant_signed_at?: Date | null;
  guarantor_signed_at?: Date | null;
}

interface ApplicantDocument {
  id: string;
  document_name: string;
  document_type: string;
  status: string;
}

interface GuarantorDocument {
  id: string;
  document_name: string;
  document_type: string;
  status: string;
}

interface PostulationInfoTabProps {
  postulation: PostulationData;
  contractData: ContractData | null;
  applicantsDocuments: Record<string, ApplicantDocument[]>;
  guarantorsDocuments: Record<string, GuarantorDocument[]>;
  showContractForm: boolean;
  onToggleContractForm: () => void;
  onSaveContract?: (data: any) => Promise<void>;
  savingContract?: boolean;
  onRefreshContract?: () => Promise<void>;
  contractManuallyGenerated?: boolean;
}

// ========================================================================
// HELPER FUNCTIONS
// ========================================================================

const formatPriceCLP = (price: number): string => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(price);
};

const getScoreColor = (score: number): string => {
  if (score >= 750) return 'text-green-600 bg-green-50 border-green-200';
  if (score >= 650) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  return 'text-red-600 bg-red-50 border-red-200';
};

const getStatusBadge = (status: string): string => {
  switch (status) {
    case 'aprobada': return 'bg-green-100 text-green-800 border-green-200';
    case 'rechazada': return 'bg-red-100 text-red-800 border-red-200';
    case 'pendiente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'aprobada': return 'Aprobada';
    case 'rechazada': return 'Rechazada';
    case 'pendiente': return 'En Revisión';
    case 'info_solicitada': return 'Info Solicitada';
    case 'con_contrato_firmado': return 'Con Contrato Firmado';
    case 'anulada': return 'Anulada';
    case 'modificada': return 'Modificada';
    default: return status;
  }
};

// ========================================================================
// MAIN COMPONENT
// ========================================================================

export const PostulationInfoTab: React.FC<PostulationInfoTabProps> = ({
  postulation,
  contractData,
  applicantsDocuments,
  guarantorsDocuments,
  showContractForm,
  onToggleContractForm,
  onSaveContract,
  savingContract = false,
  onRefreshContract,
  contractManuallyGenerated = false
}) => {
  // Crear selectedProfile a partir de los datos de la postulación
  const selectedProfile = React.useMemo(() => {
    const mainApplicant = postulation.applicants?.[0];
    const mainGuarantor = postulation.guarantors?.[0];

    if (!mainApplicant) return null;

    return {
      name: mainApplicant.display_name || mainApplicant.first_name || 'Sin nombre',
      rut: mainApplicant.rut,
      applicationId: postulation.id,
      applicationCharacteristicId: mainApplicant.application_applicant_id,
      guarantorName: mainGuarantor?.display_name || mainGuarantor?.first_name || null,
      guarantorRut: mainGuarantor?.rut || null,
      guarantorEmail: mainGuarantor?.email || null,
      guarantorPhone: mainGuarantor?.phone || null,
      guarantorCharacteristicId: mainGuarantor?.application_applicant_id || null,
      profile: {
        email: mainApplicant.email || '',
        phone: mainApplicant.phone || ''
      }
    };
  }, [postulation]);

  // Crear objeto property a partir de los datos de la postulación
  const property = React.useMemo(() => {
    if (!postulation.property) return null;

    return {
      id: postulation.property.id,
      address_street: postulation.property.address_street,
      address_number: postulation.property.address_number,
      address_commune: postulation.property.address_commune,
      price_clp: postulation.property.price_clp,
      property_type_characteristics_id: postulation.property.property_type_characteristics_id,
      // Agregar otros campos necesarios
      property_characteristic_id: postulation.property.property_characteristic_id,
      owner_id: postulation.property.owner_id
    };
  }, [postulation.property]);
  return (
    <div className="space-y-8">
      {/* Header con Status y Score */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg rounded-xl overflow-hidden">
        <div className="px-6 py-8">
          <div className="flex items-center space-x-4 mb-4">
            <span className={`inline-flex px-4 py-2 text-sm font-bold rounded-full border-2 shadow-lg ${getStatusBadge(postulation.status)}`}>
              {getStatusLabel(postulation.status)}
            </span>
            <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold shadow-lg border-2 border-white/30 ${getScoreColor(postulation.score || 0)}`}>
              📊 Score: {postulation.score || 'N/A'}
              {postulation.score === undefined && ' (Estimado)'}
            </span>
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">
            Postulación #{postulation.id.slice(-8)}
          </h1>
          <p className="text-blue-100 text-lg">
            {postulation.property.address_street || 'Dirección no disponible'} {postulation.property.address_number || ''}, {postulation.property.address_commune || 'Comuna no especificada'}
          </p>
          <p className="text-blue-100 mt-2">
            Recibida el {new Date(postulation.created_at).toLocaleDateString('es-CL', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>

      {/* Barra de información adicional */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center space-x-2">
              <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <span className="text-sm text-gray-600">
                {postulation.applicants.length} Postulante{postulation.applicants.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-sm text-gray-600">
                {postulation.guarantors.length} Aval{postulation.guarantors.length !== 1 ? 'es' : ''}
              </span>
            </div>

            {/* Resumen financiero */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">💰 Ingresos Totales:</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-sm font-bold text-blue-600">
                    {formatPriceCLP(postulation.applicants.reduce((sum, a) => sum + (a.display_income || 0), 0))}
                  </div>
                  <div className="text-xs text-gray-500">Postulantes</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-green-600">
                    {formatPriceCLP(postulation.guarantors.reduce((sum, g) => sum + (g.display_income || 0), 0))}
                  </div>
                  <div className="text-xs text-gray-500">Avales</div>
                </div>
                <div className="text-center border-l border-gray-300 pl-4">
                  <div className={`text-sm font-bold ${
                    (postulation.applicants.reduce((sum, a) => sum + (a.display_income || 0), 0) +
                     postulation.guarantors.reduce((sum, g) => sum + (g.display_income || 0), 0)) > 0
                      ? 'text-purple-600'
                      : 'text-gray-400'
                  }`}>
                    {formatPriceCLP(
                      postulation.applicants.reduce((sum, a) => sum + (a.display_income || 0), 0) +
                      postulation.guarantors.reduce((sum, g) => sum + (g.display_income || 0), 0)
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    Total
                    {(postulation.applicants.reduce((sum, a) => sum + (a.display_income || 0), 0) +
                      postulation.guarantors.reduce((sum, g) => sum + (g.display_income || 0), 0)) === 0 &&
                      <span className="text-amber-600"> (sin datos)</span>
                    }
                  </div>
                </div>
              </div>
            </div>

            {postulation.has_contract && contractManuallyGenerated && (
              <div className="flex items-center space-x-2">
                <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm text-gray-600">
                  {postulation.contract_signed ? 'Contrato Firmado' : 'Contrato Generado'}
                </span>
              </div>
            )}

            {(postulation.applicants.length === 0 && postulation.guarantors.length === 0) && (
              <div className="flex items-center space-x-2">
                <svg className="h-4 w-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-xs text-yellow-600">
                  Tablas en configuración
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={onToggleContractForm}
              className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {showContractForm ? 'Ocultar' : 'Ver'} Condiciones Contractuales
            </button>
          </div>
        </div>
      </div>

      {/* Contract Summary Card */}
      {contractData && (
        <div>
          <ContractSummaryCard
            status={contractData.status || 'draft'}
            createdAt={contractData.created_at || postulation.created_at}
            approvedAt={contractData.approved_at}
            finalAmount={contractData.final_amount}
            finalAmountCurrency={contractData.final_amount_currency || 'clp'}
            guaranteeAmount={contractData.guarantee_amount}
            guaranteeAmountCurrency={contractData.guarantee_amount_currency || 'clp'}
            startDate={contractData.start_date}
            validityPeriodMonths={contractData.validity_period_months}
            landlordEmail={contractData.landlord_email}
            tenantEmail={contractData.tenant_email}
            guarantorEmail={contractData.guarantor_email}
            signatures={{
              owner: contractData.owner_signed_at ? new Date(contractData.owner_signed_at) : null,
              tenant: contractData.tenant_signed_at ? new Date(contractData.tenant_signed_at) : null,
              guarantor: contractData.guarantor_signed_at ? new Date(contractData.guarantor_signed_at) : null,
            }}
            contractUrl={contractData.contract_html}
            signedContractUrl={contractData.signed_contract_url}
            contractId={contractData.id}
            onDownload={() => {}}
            onView={() => {}}
            onEdit={() => {}}
            onCancel={() => {}}
            onOpenEditor={() => {}}
            canEdit={contractData.status === 'draft'}
            canCancel={contractData.status !== 'cancelled' && contractData.status !== 'fully_signed'}
            isDownloading={false}
            isViewing={false}
            isCancelling={false}
          />
        </div>
      )}

      {/* Layout de Postulantes y Avales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Postulantes */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="h-5 w-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              Postulantes ({postulation.applicants.length})
            </h3>

            {postulation.applicants.length > 0 ? (
              <div className="space-y-3">
                {postulation.applicants.map((applicant, index) => (
                  <div key={applicant.id || index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {applicant.display_name || applicant.first_name}
                        </h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            applicant.entity_type === 'natural' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {applicant.entity_type === 'natural' ? '👤 Natural' : '🏢 Jurídica'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2 flex items-center">
                          <svg className="h-3 w-3 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {applicant.email}
                        </p>
                        {applicant.profession && applicant.entity_type === 'natural' && (
                          <p className="text-xs text-gray-500 mt-1">{applicant.profession}</p>
                        )}
                      </div>
                      <div className="text-right">
                        {applicant.display_income && applicant.display_income > 0 ? (
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                            applicant.entity_type === 'natural'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            💰 {formatPriceCLP(applicant.display_income)}
                          </div>
                        ) : (
                          <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                            {applicant.entity_type === 'natural' ? 'Sueldo no disponible' : 'Ingreso neto no disponible'}
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {applicant.entity_type === 'natural' ? 'Sueldo mensual' : 'Ingreso neto mensual'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <p className="text-gray-500 mb-2">No hay postulantes registrados</p>
                <p className="text-xs text-gray-400 mb-1">
                  Los postulantes aparecerán aquí cuando se registren en el sistema
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Avales */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="h-5 w-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Avales ({postulation.guarantors.length})
            </h3>

            {postulation.guarantors.length > 0 ? (
              <div className="space-y-3">
                {postulation.guarantors.map((guarantor, index) => (
                  <div key={guarantor.id || index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {guarantor.display_name || guarantor.first_name}
                        </h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            guarantor.entity_type === 'natural' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {guarantor.entity_type === 'natural' ? '👤 Natural' : '🏢 Jurídica'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2 flex items-center">
                          <svg className="h-3 w-3 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {guarantor.email}
                        </p>
                        {guarantor.profession && guarantor.entity_type === 'natural' && (
                          <p className="text-xs text-gray-500 mt-1">{guarantor.profession}</p>
                        )}
                      </div>
                      <div className="text-right">
                        {guarantor.display_income && guarantor.display_income > 0 ? (
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                            guarantor.entity_type === 'natural'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            💰 {formatPriceCLP(guarantor.display_income)}
                          </div>
                        ) : (
                          <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                            {guarantor.entity_type === 'natural' ? 'Sueldo no disponible' : 'Ingreso neto no disponible'}
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {guarantor.entity_type === 'natural' ? 'Sueldo mensual' : 'Ingreso neto mensual'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-gray-500 mb-2">No hay avales registrados</p>
                <p className="text-xs text-gray-400 mb-1">
                  Los avales aparecerán aquí cuando se registren en el sistema
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Información del Contrato (si está expandido) */}
        {showContractForm && (
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="h-5 w-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Datos del Contrato
              </h3>

              {contractData ? (
                <div className="space-y-4">
                  {/* Información General del Contrato */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <svg className="h-4 w-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Vigencia del Contrato
                    </h4>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Fecha de inicio:</span> {new Date(contractData.start_date).toLocaleDateString('es-CL')}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Plazo:</span> {contractData.validity_period_months} meses
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Fecha de término:</span> {
                          new Date(new Date(contractData.start_date).getTime() + contractData.validity_period_months * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('es-CL')
                        }
                      </p>
                    </div>
                  </div>

                  {/* Montos del Contrato */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <svg className="h-4 w-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      Montos del Contrato
                    </h4>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Monto final:</span> {contractData.final_amount_currency === 'uf' ? `${contractData.final_amount} UF` : formatPriceCLP(contractData.final_amount)}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Monto garantía:</span> {contractData.guarantee_amount_currency === 'uf' ? `${contractData.guarantee_amount} UF` : formatPriceCLP(contractData.guarantee_amount)}
                      </p>
                    </div>
                  </div>

                  {/* Comunicación */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <svg className="h-4 w-4 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Comunicación Oficial
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Arrendatario:</span> {contractData.tenant_email}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Arrendador:</span> {contractData.landlord_email}
                      </p>
                      {contractData.guarantor_email && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Aval:</span> {contractData.guarantor_email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                showContractForm && onSaveContract && selectedProfile && property ? (
                  <RentalContractConditionsForm
                    property={property}
                    selectedProfile={selectedProfile}
                    onSuccess={async () => {
                      // Refrescar la información del contrato antes de cerrar
                      if (onRefreshContract) {
                        await onRefreshContract();
                      }
                      if (onToggleContractForm) {
                        onToggleContractForm(); // Cerrar el formulario
                      }
                    }}
                    onClose={() => {
                      if (onToggleContractForm) {
                        onToggleContractForm(); // Cerrar el formulario
                      }
                    }}
                  />
                ) : (
                  <div className="text-center py-8">
                    <svg className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500 mb-2">No hay contrato generado</p>
                    <p className="text-xs text-gray-400">
                      El contrato aparecerá aquí cuando sea creado
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
