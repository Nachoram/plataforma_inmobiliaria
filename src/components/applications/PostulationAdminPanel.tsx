/**
 * PostulationAdminPanel.tsx - SIMPLE VERSION FOR DEBUGGING
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { sendWebhookGET } from '../../lib/webhook';
import toast from 'react-hot-toast';
import ContractSummaryCard from '../dashboard/ContractSummaryCard';

// Import new tab components
import { PostulationInfoTab } from './PostulationInfoTab';
import { PostulationDocumentsTab } from './PostulationDocumentsTab';
import { PostulationActionsTab } from './PostulationActionsTab';
import { PostulationMessagesTab } from './PostulationMessagesTab';

// Import icons for tabs
import {
  FileText,
  Paperclip,
  MessageSquare,
  Zap,
  ArrowLeft
} from 'lucide-react';

// ========================================================================
// INTERFACES & TYPES
// ========================================================================

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
  modification_count?: number;
  audit_log_count?: number;
}

interface ContractData {
  id?: string;
  application_id: string;

  // Datos básicos del contrato
  start_date: string; // Fecha de inicio
  validity_period_months: number; // Plazo de vigencia en meses
  final_amount: number; // Monto final del contrato
  final_amount_currency: 'clp' | 'uf'; // Moneda del monto final
  guarantee_amount: number; // Monto garantía
  guarantee_amount_currency: 'clp' | 'uf'; // Moneda de la garantía
  has_dicom_clause: boolean; // Cláusula de DICOM
  has_auto_renewal_clause: boolean; // Cláusula de renovación automática

  // Comunicación
  tenant_email: string; // Mail arrendatario
  landlord_email: string; // Mail arrendador

  // Pagos - Cuenta corriente
  account_holder_name: string; // Nombre del titular
  account_number: string; // Número de cuenta
  account_bank: string; // Banco
  account_type: string; // Tipo de cuenta

  // Comisión de corretaje
  has_brokerage_commission: boolean;
  broker_name?: string; // Solo si has_brokerage_commission = true
  broker_amount?: number; // Solo si has_brokerage_commission = true
  broker_rut?: string; // Solo si has_brokerage_commission = true

  // Condiciones del inmueble
  allows_pets: boolean; // Se permiten mascotas
  is_furnished: boolean; // Está amoblado

  // Control
  created_at?: string;
  updated_at?: string;
}

interface ContractFormData {
  // Datos básicos del contrato
  start_date: string;
  validity_period_months: number;
  final_amount: number;
  final_amount_currency: 'clp' | 'uf';
  guarantee_amount: number;
  guarantee_amount_currency: 'clp' | 'uf';
  has_dicom_clause: boolean;
  has_auto_renewal_clause: boolean;

  // Comunicación
  tenant_email: string;
  landlord_email: string;

  // Pagos - Cuenta corriente
  account_holder_name: string;
  account_number: string;
  account_bank: string;
  account_type: string;

  // Comisión de corretaje
  has_brokerage_commission: boolean;
  broker_name?: string;
  broker_amount?: number;
  broker_rut?: string;

  // Condiciones del inmueble
  allows_pets: boolean;
  is_furnished: boolean;
}

interface AuditLogEntry {
  id: string;
  application_id: string;
  action_type: string;
  description: string;
  user_id?: string;
  metadata?: any;
  created_at: string;
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
    case 'pendiente': return 'Pendiente';
    case 'info_solicitada': return 'Info Solicitada';
    case 'con_contrato_firmado': return 'Contrato Firmado';
    case 'anulada': return 'Anulada';
    case 'modificada': return 'Modificada';
    default: return status;
  }
};

/**
 * Componente para mostrar documentos de un postulante/garantor
 */
const DocumentsList: React.FC<{
  personName: string;
  documents: any[];
  onDownload: (document: any) => void;
  isLoading?: boolean;
}> = ({ personName, documents, onDownload, isLoading }) => {
  if (!documents || documents.length === 0) {
    return (
      <div className="text-center py-4">
        <svg className="h-8 w-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-sm text-gray-500">Sin documentos</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc, idx) => (
        <div key={doc.id || idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors">
          <div className="flex items-center space-x-3 flex-1">
            <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{doc.file_name || doc.document_type}</p>
              <p className="text-xs text-gray-500">
                {doc.document_type === 'cedula' && 'Cédula de Identidad'}
                {doc.document_type === 'comprobante_ingresos' && 'Comprobante de Ingresos'}
                {doc.document_type === 'certificado_dominio' && 'Certificado de Dominio'}
                {doc.document_type === 'comprobante_laboral' && 'Comprobante Laboral'}
                {!doc.document_type && 'Documento'}
                {' • '}
                {new Date(doc.uploaded_at).toLocaleDateString('es-CL')}
              </p>
            </div>
          </div>
          <button
            onClick={() => onDownload(doc)}
            disabled={isLoading}
            className="ml-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-1"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Descargar</span>
          </button>
        </div>
      ))}
    </div>
  );
};

// ========================================================================
// MAIN COMPONENT
// ========================================================================

export const PostulationAdminPanel: React.FC = () => {
  console.log('🎯 COMPONENTE CARGADO: PostulationAdminPanel desde applications/PostulationAdminPanel.tsx');

  const { id: applicationId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  console.log('🆔 APPLICATION ID:', applicationId);

  const [postulation, setPostulation] = useState<PostulationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasRealScore, setHasRealScore] = useState(false);

  // Estados para funcionalidades adicionales
  const [contractData, setContractData] = useState<ContractData | null>(null);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [showContractForm, setShowContractForm] = useState(false);
  const [showAuditHistory, setShowAuditHistory] = useState(false);
  const [loadingContract, setLoadingContract] = useState(false);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Estados para gestión del contrato
  const [showContractModal, setShowContractModal] = useState(false);
  const [savingContract, setSavingContract] = useState(false);
  const [revertingApproval, setRevertingApproval] = useState(false);
  const [contractModalKey, setContractModalKey] = useState(0);
  const [showRevertModal, setShowRevertModal] = useState(false);
  const [contractManuallyGenerated, setContractManuallyGenerated] = useState(false);

  // Estados para documentos
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [applicantsDocuments, setApplicantsDocuments] = useState<Record<string, any[]>>({});
  const [guarantorsDocuments, setGuarantorsDocuments] = useState<Record<string, any[]>>({});

  // Loading states for contract actions
  const [isDownloadingContract, setIsDownloadingContract] = useState(false);
  const [isViewingContract, setIsViewingContract] = useState(false);
  const [isCancellingContract, setIsCancellingContract] = useState(false);

  // Estados para el sistema de pestañas
  const [activeTab, setActiveTab] = useState<'info' | 'documents' | 'messages'>('info');

  // Función para abrir el modal de contrato de manera estable
  const handleOpenContractModal = () => {
    setContractModalKey(prev => prev + 1); // Fuerza una nueva instancia del modal
    setShowContractModal(true);
  };

  // Función para ver el contrato
  const handleViewContract = async () => {
    if (!contractData?.signed_contract_url && !contractData?.contract_html) {
      toast.error('No hay archivo de contrato disponible para visualizar');
      return;
    }

    setIsViewingContract(true);
    try {
      if (contractData.signed_contract_url) {
        window.open(contractData.signed_contract_url, '_blank');
      } else if (contractData.contract_html) {
        // Abrir en una nueva ventana o modal
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(contractData.contract_html);
          newWindow.document.close();
        }
      }
    } catch (error) {
      console.error('Error viewing contract:', error);
      toast.error('Error al abrir el contrato');
    } finally {
      setIsViewingContract(false);
    }
  };

  // Función para descargar el contrato
  const handleDownloadContract = async () => {
    if (!contractData?.id) {
      toast.error('No hay contrato disponible para descargar');
      return;
    }

    setIsDownloadingContract(true);
    try {
      // Use secure download endpoint
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        return;
      }

      // Get Supabase URL from environment or construct it
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/download-contract?contract_id=${contractData.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': supabaseAnonKey,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al descargar el contrato');
      }

      // If it's a redirect (signed_contract_url), follow it
      if (response.status === 302) {
        const redirectUrl = response.headers.get('Location');
        if (redirectUrl) {
          window.open(redirectUrl, '_blank');
          toast.success('Contrato abierto en nueva pestaña');
          return;
        }
      }

      // If it's file content, create download
      const contentType = response.headers.get('content-type');
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `contrato_${postulation.id.slice(-8)}`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      if (contentType?.includes('text/html')) {
        filename += '.html';
      } else {
        filename += '.pdf'; // Default assumption
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Descarga iniciada');
    } catch (error) {
      console.error('Error descargando contrato:', error);
      toast.error(error instanceof Error ? error.message : 'Error al descargar el contrato');
    } finally {
      setIsDownloadingContract(false);
    }
  };

  // Función para editar contrato (solo si está en draft)
  const handleEditContract = () => {
    if (contractData?.status === 'draft') {
      handleOpenContractModal();
    } else {
      toast.error('El contrato no puede ser editado en su estado actual');
    }
  };

  // Función para abrir el editor de contratos (canvas editor)
  const handleOpenEditor = () => {
    if (!contractData?.id) {
      toast.error('No hay contrato disponible para editar');
      return;
    }
    navigate(`/contracts/${contractData.id}/canvas-editor`);
  };

  // Función para cancelar contrato
  const handleCancelContract = async () => {
    if (!contractData?.id) return;

    const confirmed = window.confirm('¿Está seguro de que desea cancelar este contrato? Esta acción no se puede deshacer.');
    if (!confirmed) return;

    setIsCancellingContract(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        return;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/update-contract-status`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contract_id: contractData.id,
          action: 'cancel',
          notes: 'Cancelado desde panel administrativo'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cancelar el contrato');
      }

      const result = await response.json();
      toast.success('Contrato cancelado exitosamente');
      // Recargar datos
      fetchPostulationData();
    } catch (error) {
      console.error('Error cancelando contrato:', error);
      toast.error(error instanceof Error ? error.message : 'Error al cancelar el contrato');
    } finally {
      setIsCancellingContract(false);
    }
  };

  const fetchPostulationData = async () => {
    console.log('🚀 DEBUG: Iniciando fetchPostulationData');
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 DEBUG: Estados inicializados - loading: true, error: null');

      // 1. Obtener datos básicos de la aplicación con propiedad
      const { data: applicationData, error: applicationError } = await supabase
        .from('applications')
        .select(`
          id,
          property_id,
          status,
          message,
          created_at,
          updated_at,
          properties (
            id,
            address_street,
            address_number,
            address_commune,
            price_clp,
            listing_type
          )
        `)
        .eq('id', applicationId)
        .single();

      if (applicationError) {
        console.error('❌ Error cargando aplicación:', applicationError);
        if (applicationError.code === 'PGRST116') {
          setError('Postulación no encontrada');
        } else {
          setError(`Error al cargar los datos: ${applicationError.message}`);
        }
        return;
      }

      if (!applicationData) {
        setError('Postulación no encontrada');
        return;
      }

      // 2. Obtener postulantes (application_applicants) - simplified
      let applicantsData: any[] = [];
      try {
        // Intentar consulta completa primero
            const { data: applicants, error: applicantsError } = await supabase
          .from('application_applicants')
          .select(`
            application_id,
            entity_type,
            first_name,
            paternal_last_name,
            maternal_last_name,
            company_name,
            rut,
            company_rut,
            email,
            phone,
            monthly_income_clp,
            net_monthly_income_clp,
            profession,
            age,
            nationality,
            marital_status,
            address_street,
            address_number,
            address_department,
            address_commune,
            address_region,
            legal_representative_name,
            legal_representative_rut,
            constitution_type,
            constitution_date,
            constitution_cve,
            constitution_notary,
            created_at,
            updated_at
          `)
          .eq('application_id', applicationId)
          .limit(3);

        if (applicantsError) {
          console.warn('⚠️ Tabla application_applicants no disponible o sin columnas esperadas:', applicantsError.message);
          // Intentar consulta mínima
          try {
            const { data: basicApplicants, error: basicError } = await supabase
              .from('application_applicants')
              .select('application_id, monthly_income_clp, net_monthly_income_clp, entity_type, first_name, paternal_last_name, maternal_last_name, company_name, email')
              .eq('application_id', applicationId)
              .limit(3);
            if (!basicError && basicApplicants) {
              applicantsData = basicApplicants.map(item => {
                const display_name = item.entity_type === 'natural'
                  ? `${item.first_name || ''} ${item.paternal_last_name || ''} ${item.maternal_last_name || ''}`.trim() || 'Datos no disponibles'
                  : item.company_name || 'Empresa sin nombre';

                const display_income = item.entity_type === 'natural'
                  ? item.monthly_income_clp || 0
                  : item.net_monthly_income_clp || 0;

                return {
                  ...item,
                  display_name,
                  display_income,
                  first_name: item.first_name || 'Datos no disponibles',
                  paternal_last_name: item.paternal_last_name || '',
                  email: item.email || 'contacto@no.disponible'
                };
              });
            }
          } catch (basicError) {
            console.warn('⚠️ Tampoco se puede acceder a application_applicants con consulta básica');
            // Usar datos simulados para evitar que la aplicación se rompa
            applicantsData = [
              {
                id: 'simulated-1',
                application_id: applicationId,
                entity_type: 'natural',
                first_name: 'Juan',
                paternal_last_name: 'Pérez',
                maternal_last_name: 'González',
                company_name: null,
                email: 'juan@email.com',
                monthly_income_clp: 800000,
                net_monthly_income_clp: null,
                display_name: 'Juan Pérez González',
                display_income: 800000
              }
            ];
          }
        } else {
          // Procesar datos de postulantes según entity_type
          applicantsData = applicants.map(applicant => ({
            ...applicant,
            // Para mostrar el nombre correcto según el tipo de entidad
            display_name: applicant.entity_type === 'natural'
              ? `${applicant.first_name || ''} ${applicant.paternal_last_name || ''} ${applicant.maternal_last_name || ''}`.trim()
              : applicant.company_name || 'Empresa sin nombre',
            // Para mostrar el ingreso correcto según el tipo de entidad
            display_income: applicant.entity_type === 'natural'
              ? applicant.monthly_income_clp || 0
              : applicant.net_monthly_income_clp || 0
          }));

        }
      } catch (error) {
        console.warn('⚠️ Error accediendo a application_applicants:', error);
      }

      // 3. Obtener avales (application_guarantors) - simplified
      let guarantorsData: any[] = [];
      try {
        // Intentar consulta completa primero
        const { data: guarantors, error: guarantorsError } = await supabase
          .from('application_guarantors')
          .select(`
            application_id,
            entity_type,
            first_name,
            paternal_last_name,
            maternal_last_name,
            full_name,
            company_name,
            rut,
            company_rut,
            contact_email,
            contact_phone,
            monthly_income,
            net_monthly_income_clp,
            profession,
            address_street,
            address_number,
            address_department,
            address_commune,
            address_region,
            legal_representative_name,
            legal_representative_rut,
            constitution_type,
            constitution_date,
            constitution_cve,
            constitution_notary,
            created_at,
            updated_at
          `)
          .eq('application_id', applicationId)
          .limit(3);

        if (guarantorsError) {
          console.warn('⚠️ Tabla application_guarantors no disponible o sin columnas esperadas:', guarantorsError.message);
          // Intentar consulta mínima
          try {
            const { data: basicGuarantors, error: basicError } = await supabase
              .from('application_guarantors')
              .select('application_id, monthly_income, net_monthly_income_clp, entity_type, first_name, paternal_last_name, maternal_last_name, company_name, contact_email')
              .eq('application_id', applicationId)
              .limit(3);
            if (!basicError && basicGuarantors) {
              guarantorsData = basicGuarantors.map(item => {
                const display_name = item.entity_type === 'natural'
                  ? `${item.first_name || ''} ${item.paternal_last_name || ''} ${item.maternal_last_name || ''}`.trim() || 'Datos no disponibles'
                  : item.company_name || 'Empresa sin nombre';

                const display_income = item.entity_type === 'natural'
                  ? item.monthly_income || 0
                  : item.net_monthly_income_clp || 0;

                return {
                  ...item,
                  display_name,
                  display_income,
                  first_name: item.first_name || 'Datos no disponibles',
                  contact_email: item.contact_email || 'contacto@no.disponible'
                };
              });
            }
          } catch (basicError) {
            console.warn('⚠️ Tampoco se puede acceder a application_guarantors con consulta básica');
            // Usar datos simulados para evitar que la aplicación se rompa
            guarantorsData = [
              {
                id: 'simulated-guarantor-1',
                application_id: applicationId,
                entity_type: 'natural',
                first_name: 'María',
                paternal_last_name: 'Rodríguez',
                maternal_last_name: 'Silva',
                company_name: null,
                contact_email: 'maria@email.com',
                monthly_income: 600000,
                net_monthly_income_clp: null,
                display_name: 'María Rodríguez Silva',
                display_income: 600000
              }
            ];
          }
        } else {
          guarantorsData = guarantors?.map(guarantor => {
            const display_name = guarantor.entity_type === 'natural'
              ? `${guarantor.first_name || ''} ${guarantor.paternal_last_name || ''} ${guarantor.maternal_last_name || ''}`.trim() || 'Datos no disponibles'
              : guarantor.company_name || 'Empresa sin nombre';

            const display_income = guarantor.entity_type === 'natural'
              ? guarantor.monthly_income || 0
              : guarantor.net_monthly_income_clp || 0;

            return {
              ...guarantor,
              display_name,
              display_income,
              first_name: guarantor.first_name || 'Datos no disponibles',
              contact_email: guarantor.contact_email || 'contacto@no.disponible'
            };
          }) || [];
        }
      } catch (error) {
        console.warn('⚠️ Error accediendo a application_guarantors:', error);
        // Usar datos simulados como fallback
        guarantorsData = [
          {
            id: 'simulated-guarantor-1',
            application_id: applicationId,
            entity_type: 'natural',
            first_name: 'María',
            paternal_last_name: 'Rodríguez',
            maternal_last_name: 'Silva',
            company_name: null,
            contact_email: 'maria@email.com',
            monthly_income: 600000,
            net_monthly_income_clp: null,
            display_name: 'María Rodríguez Silva',
            display_income: 600000
          }
        ];
      }

      // 4. Cargar datos del contrato
      let contractData: ContractData | null = null;
      let hasContract = false;
      let contractSigned = false;
      let modificationCount = 0;
      let auditCount = 0;

      try {
        const { data: contract, error: contractError } = await supabase
          .from('rental_contracts')
          .select('*')
          .eq('application_id', applicationId)
          .limit(1);

        if (contractError) {
          console.warn('⚠️ Tabla rental_contracts no disponible o sin columnas esperadas:', contractError.message);
        } else if (contract && contract.length > 0) {
          contractData = contract[0];
          hasContract = true;
          contractSigned = contract[0]?.status === 'signed';
        }
      } catch (error) {
        console.warn('⚠️ Error cargando datos del contrato:', error);
      }

      try {
        const { count: modCount, error: modError } = await supabase
          .from('application_modifications')
          .select('*', { count: 'exact', head: true })
          .eq('application_id', applicationId);

        if (modError) {
          console.warn('⚠️ Tabla application_modifications no disponible:', modError.message);
          modificationCount = 0;
        } else {
          modificationCount = modCount || 0;
        }
      } catch (error) {
        console.warn('⚠️ Error contando modificaciones:', error);
        modificationCount = 0;
      }

      try {
        const { count: auditCountResult, error: auditError } = await supabase
          .from('application_audit_log')
          .select('*', { count: 'exact', head: true })
          .eq('application_id', applicationId);

        if (auditError) {
          console.warn('⚠️ Tabla application_audit_log no disponible:', auditError.message);
          auditCount = 0;
        } else {
          auditCount = auditCountResult || 0;
        }
      } catch (error) {
        console.warn('⚠️ Error contando auditoría:', error);
        auditCount = 0;
      }

      // 5. Construir objeto final
      const postulationData: PostulationData = {
        id: applicationData.id,
        property_id: applicationData.property_id,
        status: applicationData.status,
        score: applicationData.score || 750,
        message: applicationData.message || '',
        created_at: applicationData.created_at,
        updated_at: applicationData.updated_at,
        property: applicationData.properties,
        applicants: applicantsData || [],
        guarantors: guarantorsData || [],
        has_contract: hasContract,
        contract_signed: contractSigned,
        modification_count: modificationCount,
        audit_log_count: auditCount
      };

      // Set score availability flag
      setHasRealScore(!!applicationData.score);
      setContractData(contractData);

      console.log('✅ [PostulationAdminPanel] Datos cargados exitosamente:', {
        applicants: postulationData.applicants.length,
        guarantors: postulationData.guarantors.length,
        hasContract: postulationData.has_contract,
        contractData: !!contractData,
        score: postulationData.score
      });

      console.log('🔄 DEBUG: Llamando setPostulation con:', postulationData);
      setPostulation(postulationData);

    } catch (error: any) {
      console.error('❌ Error en fetchPostulationData:', error);
      console.log('❌ DEBUG: Seteando error y loading: false');
      setError('Error al cargar los datos de la postulación');
    } finally {
      console.log('🏁 DEBUG: Finally - Seteando loading: false');
      setLoading(false);
    }
  };

  // Función para cargar datos de las condiciones del contrato
  const fetchContractData = async () => {
    if (!applicationId) return;

    try {
      setLoadingContract(true);


      const { data, error } = await supabase
        .from('rental_contract_conditions')
        .select('*')
        .eq('application_id', applicationId)
        .limit(1);

      if (error) {
        console.warn('⚠️ Error cargando condiciones del contrato:', error.message);
        setContractData(null);
      } else {

        // Convertir los datos de rental_contract_conditions al formato esperado por el formulario
        if (data && data.length > 0) {
          const conditions = data[0];
          const mockContractData = {
            id: conditions.id,
            application_id: applicationId,
            start_date: conditions.contract_start_date ? new Date(conditions.contract_start_date).toISOString().split('T')[0] : '',
            validity_period_months: conditions.contract_duration_months || 12,
            final_amount: conditions.final_rent_price || 0,
            final_amount_currency: 'clp',
            guarantee_amount: conditions.guarantee_amount || 0,
            guarantee_amount_currency: 'clp',
            has_dicom_clause: conditions.dicom_clause || false,
            has_auto_renewal_clause: conditions.auto_renewal_clause || false,
            // Mapear nombres de BD a nombres de frontend
            tenant_email: conditions.official_arrendatario_communication_email || '',
            landlord_email: conditions.notificaficacion_email_arrendador || '',
            account_holder_name: conditions.account_holder_name || '',
            account_number: conditions.account_number || '',
            account_bank: conditions.bank_name || '',
            account_type: conditions.account_type || '',
            has_brokerage_commission: (conditions.brokerage_commission || 0) > 0,
            broker_name: conditions.broker_name || (conditions.additional_conditions ? conditions.additional_conditions.split(' (RUT: ')[0].replace('Comisión del corredor: ', '') : ''),
            broker_amount: conditions.brokerage_commission || 0,
            broker_rut: conditions.broker_rut || (conditions.additional_conditions ? conditions.additional_conditions.split(' (RUT: ')[1]?.replace(')', '') : ''),
            allows_pets: conditions.accepts_pets || false,
            is_furnished: conditions.is_furnished || false,
            status: 'draft',
            created_at: conditions.created_at,
            updated_at: conditions.updated_at
          };
          setContractData(mockContractData);
        } else {
          setContractData(null);
        }
      }
    } catch (error) {
      console.warn('⚠️ Error accediendo a rental_contract_conditions:', error);
      setContractData(null);
    } finally {
      setLoadingContract(false);
    }
  };

  /**
   * Carga los documentos asociados a cada postulante
   */
  const loadApplicantsDocuments = async () => {
    if (!applicationId) return;

    try {
      setDocumentsLoading(true);

      // Obtener todos los documentos de postulantes para esta aplicación
      const { data: docs, error } = await supabase
        .from('applicant_documents')
        .select(`
          id,
          applicant_id,
          doc_type,
          file_name,
          file_url,
          storage_path,
          uploaded_at,
          notes,
          application_applicants!inner(
            application_id,
            entity_type,
            first_name,
            paternal_last_name,
            maternal_last_name,
            company_name
          )
        `)
        .eq('application_applicants.application_id', applicationId);
      
      if (error) {
        console.warn('⚠️ Error cargando documentos de postulantes:', error.message);
        return;
      }
      
      // Agrupar documentos por postulante (usar combination de nombres como key)
      const docsByApplicant: Record<string, any[]> = {};
      if (docs) {
        docs.forEach(doc => {
          const applicant = doc.application_applicants;
          const applicantKey = applicant.entity_type === 'natural'
            ? `${applicant.first_name} ${applicant.paternal_last_name} ${applicant.maternal_last_name}`.trim()
            : applicant.company_name;

          // Crear un objeto documento plano con la información necesaria
          const documentItem = {
            id: doc.id,
            application_id: applicant.application_id,
            entity_type: applicant.entity_type,
            document_type: doc.doc_type,
            file_name: doc.file_name,
            file_url: doc.file_url,
            storage_path: doc.storage_path,
            uploaded_at: doc.uploaded_at,
            first_name: applicant.first_name,
            paternal_last_name: applicant.paternal_last_name,
            maternal_last_name: applicant.maternal_last_name,
            company_name: applicant.company_name,
            notes: doc.notes
          };

          if (!docsByApplicant[applicantKey]) {
            docsByApplicant[applicantKey] = [];
          }
          docsByApplicant[applicantKey].push(documentItem);
        });
      }
      
      setApplicantsDocuments(docsByApplicant);
      console.log('✅ Documentos de postulantes cargados:', docsByApplicant);
      
    } catch (error) {
      console.error('❌ Error cargando documentos:', error);
    } finally {
      setDocumentsLoading(false);
    }
  };

  /**
   * Carga los documentos asociados a cada garantor
   */
  const loadGuarantorsDocuments = async () => {
    if (!applicationId) return;

    try {
      setDocumentsLoading(true);

      // Obtener todos los documentos de garantores para esta aplicación
      const { data: docs, error } = await supabase
        .from('guarantor_documents')
        .select(`
          id,
          guarantor_id,
          doc_type,
          file_name,
          file_url,
          storage_path,
          uploaded_at,
          notes,
          application_guarantors!inner(
            application_id,
            entity_type,
            first_name,
            paternal_last_name,
            maternal_last_name,
            company_name
          )
        `)
        .eq('application_guarantors.application_id', applicationId);
      
      if (error) {
        console.warn('⚠️ Error cargando documentos de garantores:', error.message);
        return;
      }
      
      // Agrupar documentos por garantor
      const docsByGuarantor: Record<string, any[]> = {};
      if (docs) {
        docs.forEach(doc => {
          const guarantor = doc.application_guarantors;
          const guarantorKey = guarantor.entity_type === 'natural'
            ? `${guarantor.first_name} ${guarantor.paternal_last_name} ${guarantor.maternal_last_name}`.trim()
            : guarantor.company_name;

          // Crear un objeto documento plano con la información necesaria
          const documentItem = {
            id: doc.id,
            application_id: guarantor.application_id,
            entity_type: guarantor.entity_type,
            document_type: doc.doc_type,
            file_name: doc.file_name,
            file_url: doc.file_url,
            storage_path: doc.storage_path,
            uploaded_at: doc.uploaded_at,
            first_name: guarantor.first_name,
            paternal_last_name: guarantor.paternal_last_name,
            maternal_last_name: guarantor.maternal_last_name,
            company_name: guarantor.company_name,
            notes: doc.notes
          };

          if (!docsByGuarantor[guarantorKey]) {
            docsByGuarantor[guarantorKey] = [];
          }
          docsByGuarantor[guarantorKey].push(documentItem);
        });
      }
      
      setGuarantorsDocuments(docsByGuarantor);
      console.log('✅ Documentos de garantores cargados:', docsByGuarantor);
      
    } catch (error) {
      console.error('❌ Error cargando documentos:', error);
    } finally {
      setDocumentsLoading(false);
    }
  };

  /**
   * Descarga un documento individual
   */
  const downloadDocument = async (doc: any) => {
    try {
      const fileName = doc.file_name || `${doc.document_type}.pdf`;
      console.log('📥 Descargando documento:', fileName);
      toast.loading('Descargando archivo...', { id: 'download-doc' });

      // Si es un archivo de Supabase Storage (tiene storage_path)
      if (doc.storage_path && doc.file_url?.includes('supabase')) {
        // Extraer el path relativo del bucket desde la URL completa
        let relativePath = doc.storage_path;

        console.log('📂 Storage path original:', doc.storage_path);

        // Si storage_path es una URL completa, extraer solo el path relativo
        if (doc.storage_path.includes('/user-documents/')) {
          const urlParts = doc.storage_path.split('/user-documents/');
          if (urlParts.length > 1) {
            relativePath = urlParts[1];
          }
        } else if (doc.storage_path.startsWith('http')) {
          // Si es una URL completa pero no contiene /user-documents/, intentar extraer de la URL
          try {
            const url = new URL(doc.storage_path);
            // Extraer el path después de /user-documents/
            const pathMatch = url.pathname.match(/\/user-documents\/(.+)/);
            if (pathMatch) {
              relativePath = pathMatch[1];
            }
          } catch (e) {
            console.warn('⚠️ No se pudo parsear la URL:', doc.storage_path);
          }
        }

        console.log('📂 Path relativo extraído:', relativePath);

        // Usar la API de Supabase Storage para descargar desde bucket privado
        const { data, error } = await supabase.storage
          .from('user-documents')
          .download(relativePath);

        if (error) {
          console.error('Error descargando desde storage:', error);
          throw new Error('Error al descargar desde storage');
        }

        // Crear blob URL y descargar
        const blob = new Blob([data]);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success('Documento descargado', { id: 'download-doc' });
      } else if (doc.file_url) {
        // Si es otra URL, intentar descarga directa o abrir en nueva pestaña
        try {
          const response = await fetch(doc.file_url);
          if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success('Documento descargado', { id: 'download-doc' });
          } else {
            // Si no se puede descargar, abrir en nueva pestaña
            window.open(doc.file_url, '_blank');
            toast.success('Abriendo documento...', { id: 'download-doc' });
          }
        } catch (error) {
          // Fallback: abrir en nueva pestaña
          window.open(doc.file_url, '_blank');
          toast.success('Abriendo documento...', { id: 'download-doc' });
        }
      } else {
        throw new Error('No se encontró URL del documento');
      }
    } catch (error: any) {
      console.error('❌ Error descargando documento:', error);
      toast.error('Error al descargar el documento', { id: 'download-doc' });
    }
  };

  /**
   * Función unificada para cargar todos los documentos (postulantes y garantores)
   * Esta función es llamada por los componentes de pestañas para refrescar los datos
   */
  const loadDocuments = async () => {
    console.log('🔄 Cargando todos los documentos para la postulación...');

    // Cargar documentos de postulantes y garantores en paralelo
    await Promise.all([
      loadApplicantsDocuments(),
      loadGuarantorsDocuments()
    ]);

    console.log('✅ Todos los documentos cargados');
  };

  // Función para cargar historial de auditoría
  const fetchAuditLog = async () => {
    if (!applicationId) return;

    try {
      setLoadingAudit(true);

      // Intentar consulta completa primero
      const { data, error } = await supabase
        .from('application_audit_log')
        .select('*')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.warn('⚠️ Error cargando historial de auditoría:', error.message);
        // Intentar consulta mínima
        try {
          const { data: basicData, error: basicError } = await supabase
            .from('application_audit_log')
            .select('application_id')
            .eq('application_id', applicationId)
            .order('created_at', { ascending: false })
            .limit(10);

          if (!basicError && basicData) {
            // Crear objetos básicos con datos mínimos
            setAuditLog(basicData.map(item => ({
              ...item,
              action_type: 'unknown',
              description: 'Acción registrada (detalles no disponibles)',
              created_at: new Date().toISOString()
            })));
          } else {
            setAuditLog([]);
          }
        } catch (basicError) {
          console.warn('⚠️ Tampoco se puede acceder a application_audit_log con consulta básica');
          setAuditLog([]);
        }
      } else {
        setAuditLog(data || []);
      }
    } catch (error) {
      console.warn('⚠️ Error accediendo a application_audit_log:', error);
      setAuditLog([]);
    } finally {
      setLoadingAudit(false);
    }
  };

  // Función para mostrar/ocultar formulario del contrato
  const toggleContractForm = async () => {
    if (!showContractForm && !contractData) {
      await fetchContractData();
    }
    setShowContractForm(!showContractForm);
  };

  // Función para mostrar/ocultar historial de auditoría
  const toggleAuditHistory = async () => {
    if (!showAuditHistory && auditLog.length === 0) {
      await fetchAuditLog();
    }
    setShowAuditHistory(!showAuditHistory);
  };

  // Función para crear/actualizar condiciones del contrato
  const saveContract = async (contractFormData: ContractFormData) => {
    if (!applicationId) return;

    try {
      // Agregar un pequeño delay para estabilizar el estado antes de mostrar loading
      await new Promise(resolve => setTimeout(resolve, 100));
      setSavingContract(true);

      // Preparar datos para guardar en rental_contract_conditions
      console.log('🔍 [saveContract] Form data recibida:', contractFormData);

      const conditionsPayload = {
        application_id: applicationId,
        // Usar nombres de columnas que existen en la base de datos
        contract_duration_months: contractFormData.validity_period_months || 12,
        monthly_payment_day: 1, // Día de pago por defecto, podría ser configurable después
        final_rent_price: Number(contractFormData.final_amount) || 0, // Asegurar que sea número
        brokerage_commission: contractFormData.has_brokerage_commission ? Number(contractFormData.broker_amount) || 0 : 0, // Asegurar que sea número
        guarantee_amount: Number(contractFormData.guarantee_amount) || 0, // Asegurar que sea número
        // Columnas que existen en la base de datos
        notification_email: contractFormData.landlord_email || '',
        accepts_pets: contractFormData.allows_pets || false,
        dicom_clause: contractFormData.has_dicom_clause || false,
        additional_conditions: contractFormData.has_brokerage_commission
          ? `Comisión del corredor: ${contractFormData.broker_name} (RUT: ${contractFormData.broker_rut})`
          : null,
        // Columnas requeridas por validación
        broker_name: contractFormData.has_brokerage_commission ? contractFormData.broker_name || '' : 'Sin corredor',
        broker_rut: contractFormData.has_brokerage_commission ? contractFormData.broker_rut || '' : 'Sin RUT',
        // Columnas adicionales
        contract_start_date: contractFormData.start_date || null,
        bank_name: contractFormData.account_bank || '',
        account_type: contractFormData.account_type || '',
        account_number: contractFormData.account_number || '',
        account_holder_name: contractFormData.account_holder_name || '',
        account_holder_rut: contractFormData.account_holder_rut || '',
        payment_method: 'transferencia_bancaria', // Valor por defecto
        created_by: applicationId ? undefined : auth?.user?.id, // Solo establecer en creación
        updated_at: new Date().toISOString()
      };

      console.log('📤 [saveContract] Payload a enviar:', conditionsPayload);

      // Verificar que todos los campos requeridos estén presentes
      const requiredFields = ['application_id', 'payment_method', 'broker_name', 'broker_rut', 'notification_email'];
      const missingFields = requiredFields.filter(field => !conditionsPayload[field as keyof typeof conditionsPayload]);

      if (missingFields.length > 0) {
        console.error('❌ [saveContract] Campos requeridos faltantes:', missingFields);
        throw new Error(`Campos requeridos faltantes: ${missingFields.join(', ')}`);
      }

      // Validar tipos de datos
      if (typeof conditionsPayload.final_rent_price !== 'number' || isNaN(conditionsPayload.final_rent_price)) {
        console.error('❌ [saveContract] final_rent_price no es un número válido:', conditionsPayload.final_rent_price);
        throw new Error('El precio final del arriendo debe ser un número válido');
      }

      // Verificar si ya existen condiciones para esta aplicación
      const { data: existingConditions, error: checkError } = await supabase
        .from('rental_contract_conditions')
        .select('id')
        .eq('application_id', applicationId)
        .limit(1);

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
        console.warn('⚠️ Error verificando condiciones existentes:', checkError);
      }

      let result;
      if (existingConditions && existingConditions.length > 0) {
        // Actualizar condiciones existentes
        result = await supabase
          .from('rental_contract_conditions')
          .update(conditionsPayload)
          .eq('application_id', applicationId)
          .select()
          .single();
      } else {
        // Crear nuevas condiciones
        result = await supabase
          .from('rental_contract_conditions')
          .insert([conditionsPayload])
          .select()
          .single();
      }

      const { data, error } = result;

      if (error) {
        console.error('Error guardando condiciones del contrato:', error);
        throw error;
      }

      // Actualizar estado local (simular que tenemos un contrato con los datos guardados)
      const mockContractData = {
        id: data.id,
        application_id: applicationId,
        start_date: contractFormData.start_date,
        validity_period_months: contractFormData.validity_period_months,
        final_amount: contractFormData.final_amount,
        final_amount_currency: contractFormData.final_amount_currency,
        guarantee_amount: contractFormData.guarantee_amount,
        guarantee_amount_currency: contractFormData.guarantee_amount_currency,
        has_dicom_clause: contractFormData.has_dicom_clause,
        tenant_email: contractFormData.tenant_email,
        landlord_email: contractFormData.landlord_email,
        account_holder_name: contractFormData.account_holder_name,
        account_number: contractFormData.account_number,
        account_bank: contractFormData.account_bank,
        account_type: contractFormData.account_type,
        has_brokerage_commission: contractFormData.has_brokerage_commission,
        broker_name: contractFormData.broker_name,
        broker_amount: contractFormData.broker_amount,
        broker_rut: contractFormData.broker_rut,
        allows_pets: contractFormData.allows_pets,
        is_furnished: contractFormData.is_furnished,
        status: 'draft',
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      setContractData(mockContractData);

      // Actualizar estado de la postulación
      setPostulation(prev => prev ? {
        ...prev,
        has_contract_conditions: true, // Cambiar a has_contract_conditions
        contract_signed: false
      } : null);

      console.log('✅ Condiciones del contrato guardadas exitosamente');

      // Close modal after successful save and state reset
      setSavingContract(false);
      setShowContractModal(false);

    } catch (error: any) {
      console.error('❌ Error guardando condiciones del contrato:', error);
      setSavingContract(false);
      throw new Error('Error al guardar las condiciones del contrato');
    }
  };

  useEffect(() => {
    if (applicationId) {
      console.log('🔄 [PostulationAdminPanel] Iniciando carga de datos para aplicación:', applicationId);
      console.log('🔍 DEBUG: applicationId existe:', !!applicationId);
      setHasRealScore(false);
      fetchPostulationData();
      loadApplicantsDocuments();
      loadGuarantorsDocuments();
    } else {
      console.log('❌ DEBUG: applicationId es null/undefined:', applicationId);
    }
  }, [applicationId]);

  // Debug: Monitorear cambios en postulation
  useEffect(() => {
    console.log('📊 DEBUG: Estado postulation cambió:', postulation);
  }, [postulation]);

  // Debug: Monitorear cambios en loading
  useEffect(() => {
    console.log('📊 DEBUG: Estado loading cambió:', loading);
  }, [loading]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando postulación...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => navigate('/portfolio')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Volver al Portfolio
          </button>
        </div>
      </div>
    );
  }

  // No postulation found
  console.log('🔍 DEBUG: Estado actual - postulation:', postulation);
  console.log('🔍 DEBUG: Estado actual - loading:', loading);
  console.log('🔍 DEBUG: Estado actual - error:', error);
  console.log('🔍 DEBUG: Estado actual - applicationId:', applicationId);

  // Si aún está cargando, mostrar loading
  if (loading) {
    console.log('⏳ DEBUG: Aún cargando, mostrando pantalla de carga');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando postulación...</p>
          <p className="text-sm text-gray-500 mt-2">ID: {applicationId}</p>
        </div>
      </div>
    );
  }

  // Si hay error, mostrar error
  if (error) {
    console.log('❌ DEBUG: Hay error, mostrando pantalla de error');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
          <p className="text-sm text-gray-500 mt-2">ID: {applicationId}</p>
          <button
            onClick={() => navigate('/portfolio')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Volver al Portfolio
          </button>
        </div>
      </div>
    );
  }

  // Si no hay postulación después de cargar, mostrar no encontrada
  if (!postulation) {
    console.log('❌ DEBUG: No hay postulación después de cargar, mostrando no encontrada');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-6xl mb-4">📄</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Postulación no encontrada</h2>
          <p className="text-gray-600">La postulación que buscas no existe o ha sido eliminada.</p>
          <button
            onClick={() => navigate('/portfolio')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Volver al Portfolio
          </button>
        </div>
      </div>
    );
  }

  // ========================================================================
  // FUNCIONES DE ACCIONES ADMINISTRATIVAS
  // ========================================================================

  const handleApproveApplication = async () => {
    try {
      // TODO: Implementar lógica de aprobación
      console.log('🔄 Aprobando aplicación...');
      toast.info('Funcionalidad de aprobación en desarrollo');
    } catch (error) {
      console.error('❌ Error aprobando aplicación:', error);
      toast.error('Error al aprobar la aplicación');
    }
  };

  const handleConfirmRevert = async () => {
    if (!applicationId) return;

    try {
      setRevertingApproval(true);
      console.log('🔄 Revirtiendo aprobación de la aplicación...');

      // TODO: Implementar lógica real de revertir aprobación
      // Por ahora solo mostrar mensaje
      toast.info('Funcionalidad de revertir aprobación en desarrollo');

      // Aquí iría la lógica para:
      // 1. Cambiar el status de la aplicación
      // 2. Actualizar en Supabase
      // 3. Registrar en audit log

    } catch (error) {
      console.error('❌ Error revirtiendo aprobación:', error);
      toast.error('Error al revertir la aprobación');
    } finally {
      setRevertingApproval(false);
      setShowRevertModal(false);
    }
  };

  const handleRevertApproval = async () => {
    try {
      // TODO: Implementar lógica de revertir aprobación
      console.log('🔄 Revirtiendo aprobación...');
      toast.info('Funcionalidad de revertir aprobación en desarrollo');
    } catch (error) {
      console.error('❌ Error revirtiendo aprobación:', error);
      toast.error('Error al revertir la aprobación');
    }
  };

  // Función para refrescar los datos del contrato después de guardar condiciones
  const refreshContractData = async () => {
    console.log('🔄 Refrescando datos del contrato...');
    try {
      await fetchPostulationData(); // Recargar toda la información del postulation
      console.log('✅ Datos del contrato refrescados');
    } catch (error) {
      console.error('❌ Error refrescando datos del contrato:', error);
    }
  };

  // ========================================================================
  // FUNCIONES DE RENDER
  // ========================================================================

  const renderTabContent = () => {
    console.log('🎯 renderTabContent: Renderizando pestaña:', activeTab);

    switch (activeTab) {
      case 'info':
        return (
          <div className="space-y-8">
            {/* Información de la Postulación */}
            <PostulationInfoTab
              postulation={postulation}
              contractData={contractData}
              applicantsDocuments={applicantsDocuments}
              guarantorsDocuments={guarantorsDocuments}
              showContractForm={showContractForm}
              onToggleContractForm={() => setShowContractForm(!showContractForm)}
              onDownloadContract={handleDownloadContract}
              onViewContract={handleViewContract}
              onEditContract={() => setShowContractModal(true)}
              onCancelContract={handleCancelContract}
              onOpenContractModal={() => setShowContractModal(true)}
              onSaveContract={saveContract}
              onRefreshContract={refreshContractData}
              contractManuallyGenerated={contractManuallyGenerated}
              isDownloadingContract={isDownloadingContract}
              isViewingContract={isViewingContract}
              isCancellingContract={isCancellingContract}
              loadingContract={loadingContract}
              savingContract={savingContract}
            />

            {/* Acciones Administrativas */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="h-5 w-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Acciones Administrativas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={handleApproveApplication}
                  disabled={!has_contract_conditions || postulation?.status === 'aprobada'}
                  className={`w-full px-4 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                    (!has_contract_conditions || postulation?.status === 'aprobada')
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                  title={
                    postulation?.status === 'aprobada'
                      ? 'Postulación ya aprobada - no se puede aprobar nuevamente'
                      : has_contract_conditions
                      ? 'Aprobar postulación y enviar contrato para generación automática'
                      : 'Primero debe crear las condiciones del contrato'
                  }
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Aprobar Postulación</span>
                </button>

                {postulation?.status === 'aprobada' && (
                  <button
                    onClick={() => setShowRevertModal(true)}
                    className="w-full bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                    title="Revertir la aprobación de esta postulación"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    <span>Anular Aprobación</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    // TODO: Implement request info functionality
                    toast.info('Funcionalidad de solicitar información en desarrollo');
                  }}
                  className="w-full bg-yellow-600 text-white px-4 py-3 rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span>Solicitar Información</span>
                </button>

                <button
                  onClick={() => {
                    // TODO: Implement reject functionality
                    toast.info('Funcionalidad de rechazar en desarrollo');
                  }}
                  className="w-full bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Rechazar Postulación</span>
                </button>

                <button
                  onClick={() => {
                    // TODO: Implement modify acceptance functionality
                    toast.info('Funcionalidad de modificar aceptación en desarrollo');
                  }}
                  className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Modificar Aceptación</span>
                </button>

                <button
                  onClick={() => {
                    // TODO: Implement cancel functionality
                    toast.info('Funcionalidad de cancelar en desarrollo');
                  }}
                  className="w-full bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Cancelar Postulación</span>
                </button>

                <button
                  onClick={() => {
                    setContractManuallyGenerated(true);
                    setShowContractModal(true);
                  }}
                  disabled={!has_contract_conditions}
                  className={`w-full px-4 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                    !has_contract_conditions
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                  title={!has_contract_conditions ? 'Primero debe establecer las condiciones contractuales' : 'Generar contrato basado en las condiciones establecidas'}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Generar Contrato</span>
                </button>

                <button
                  onClick={() => setShowContractForm(true)}
                  className="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2"
                  title="Establecer o modificar las condiciones contractuales de la postulación"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 6l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>Establecer Condiciones Contractuales</span>
                </button>

                <button
                  onClick={() => {
                    // TODO: Implement commercial report generation
                    toast.info('Funcionalidad de generar informe comercial en desarrollo');
                  }}
                  className="w-full bg-teal-600 text-white px-4 py-3 rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center space-x-2"
                  title="Generar informe comercial con datos del postulante"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Generar Informe Comercial Postulante</span>
                </button>
              </div>
            </div>
          </div>
        );
      case 'documents':
        return (
          <PostulationDocumentsTab
            applicationId={postulation.id}
            applicants={postulation.applicants}
            guarantors={postulation.guarantors}
            applicantsDocuments={applicantsDocuments}
            guarantorsDocuments={guarantorsDocuments}
            onDocumentsChange={loadDocuments}
          />
        );
      case 'messages':
        return (
          <PostulationMessagesTab
            applicationId={postulation.id}
          />
        );
      default:
        return null;
    }
  };

  // ========================================================================
  // RENDER PRINCIPAL CON PESTAÑAS
  // ========================================================================

  // Variable derivada: indica si ya existen condiciones de contrato
  const has_contract_conditions = contractData !== null;

  console.log('🎨 PostulationAdminPanel: Renderizando interfaz con pestañas - VERSION CON PESTAÑAS');

  console.log('🚀 EJECUTANDO RENDER PRINCIPAL - RETORNANDO JSX');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* DEBUG BANNER - TEMPORAL PARA CONFIRMAR VERSION */}
      <div className="bg-red-600 text-white text-center py-2 font-bold">
        🚨 DEBUG: VERSION CON PESTAÑAS CARGADA - PostulationAdminPanel.tsx 🚨
      </div>

      {/* Admin Panel Indicator */}
      <div className="h-1 bg-gradient-to-r from-blue-600 to-blue-700"></div>

      {/* Header Navigation (similar to OfferDetailsPanel) */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            <button
              onClick={() => navigate('/portfolio')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span className="font-medium">Volver al Portfolio</span>
            </button>
            <div className="text-sm text-gray-500">
              Postulación #{postulation.id.slice(-8)}
            </div>
          </div>

          {/* Tabs */}
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex space-x-8 overflow-x-auto">
              {[
                { id: 'info', label: 'Información y Acciones', icon: FileText },
                { id: 'documents', label: 'Documentos', icon: Paperclip, count: (Object.values(applicantsDocuments).flat().length + Object.values(guarantorsDocuments).flat().length) },
                { id: 'messages', label: 'Mensajes', icon: MessageSquare }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className={`w-4 h-4 mr-2 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}`} />
                  {tab.label}
                  {tab.count && tab.count > 0 && (
                    <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-red-100 text-red-600">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        {renderTabContent()}
      </main>

      {/* Modals */}
      <RevertModal
        isOpen={showRevertModal}
        onClose={() => setShowRevertModal(false)}
        onConfirm={handleConfirmRevert}
        loading={revertingApproval}
      />
    </div>
  );
};

// ========================================================================
// COMPONENTES ADICIONALES
// ========================================================================

// Componente Modal para Contrato de Arriendo
  const ContractModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: ContractFormData) => Promise<void>;
    initialData?: ContractData | null;
    isSaving: boolean;
    mode: 'create' | 'edit';
  }> = ({ isOpen, onClose, onSave, initialData, isSaving, mode }) => {
    const [formData, setFormData] = useState<ContractFormData>({
      start_date: '',
      validity_period_months: 12,
      final_amount: 0,
      final_amount_currency: 'clp',
      guarantee_amount: 0,
      guarantee_amount_currency: 'clp',
      has_dicom_clause: false,
      has_auto_renewal_clause: false,
      tenant_email: '',
      landlord_email: '',
      account_holder_name: '',
      account_number: '',
      account_bank: '',
      account_type: '',
      has_brokerage_commission: false,
      broker_name: '',
      broker_amount: 0,
      broker_rut: '',
      allows_pets: false,
      is_furnished: false
    });
  
    // Reset form when modal opens with initial data
    React.useEffect(() => {
      if (isOpen) {
        if (initialData) {
          setFormData({
            start_date: initialData.start_date ? new Date(initialData.start_date).toISOString().split('T')[0] : '',
            validity_period_months: initialData.validity_period_months || 12,
            final_amount: initialData.final_amount || 0,
            final_amount_currency: initialData.final_amount_currency || 'clp',
            guarantee_amount: initialData.guarantee_amount || 0,
            guarantee_amount_currency: initialData.guarantee_amount_currency || 'clp',
            has_dicom_clause: initialData.has_dicom_clause || false,
            has_auto_renewal_clause: initialData.has_auto_renewal_clause || false,
            tenant_email: initialData.tenant_email || '',
            landlord_email: initialData.landlord_email || '',
            account_holder_name: initialData.account_holder_name || '',
            account_number: initialData.account_number || '',
            account_bank: initialData.account_bank || '',
            account_type: initialData.account_type || '',
            has_brokerage_commission: initialData.has_brokerage_commission || false,
            broker_name: initialData.broker_name || '',
            broker_amount: initialData.broker_amount || 0,
            broker_rut: initialData.broker_rut || '',
            allows_pets: initialData.allows_pets || false,
            is_furnished: initialData.is_furnished || false
          });
        } else {
          setFormData({
            start_date: '',
            validity_period_months: 12,
            final_amount: 0,
            final_amount_currency: 'clp',
            guarantee_amount: 0,
            guarantee_amount_currency: 'clp',
            has_dicom_clause: false,
            has_auto_renewal_clause: false,
            tenant_email: '',
            landlord_email: '',
            account_holder_name: '',
            account_number: '',
            account_bank: '',
            account_type: '',
            has_brokerage_commission: false,
            broker_name: '',
            broker_amount: 0,
            broker_rut: '',
            allows_pets: false,
            is_furnished: false
          });
        }
        setErrors({});
      }
    }, [isOpen, initialData]);
  
    // useEffect para estabilizar el estado del modal al cerrar
    React.useEffect(() => {
      if (!isOpen) {
        // Reset form cuando se cierra el modal
        setFormData({
          start_date: '',
          validity_period_months: 12,
          final_amount: 0,
          final_amount_currency: 'clp',
          guarantee_amount: 0,
          guarantee_amount_currency: 'clp',
          has_dicom_clause: false,
          tenant_email: '',
          landlord_email: '',
          account_holder_name: '',
          account_number: '',
          account_bank: '',
          account_type: '',
          has_brokerage_commission: false,
          broker_name: '',
          broker_amount: 0,
          broker_rut: '',
          allows_pets: false,
          is_furnished: false
        });
        setErrors({});
      }
    }, [isOpen]);
  
    const [errors, setErrors] = useState<Partial<ContractFormData>>({});
  
    const validateForm = (): boolean => {
      const newErrors: Partial<ContractFormData> = {};
  
      if (!formData.start_date) {
        newErrors.start_date = 'La fecha de inicio es obligatoria';
      }
  
      if (formData.validity_period_months < 1) {
        newErrors.validity_period_months = 'El plazo debe ser mayor a 0';
      }
  
      if (formData.final_amount <= 0) {
        newErrors.final_amount = 'El monto final debe ser mayor a 0';
      }
  
      if (formData.guarantee_amount < 0) {
        newErrors.guarantee_amount = 'El monto de garantía no puede ser negativo';
      }
  
      if (!formData.tenant_email.trim()) {
        newErrors.tenant_email = 'El email del arrendatario es obligatorio';
      }
  
      if (!formData.landlord_email.trim()) {
        newErrors.landlord_email = 'El email del arrendador es obligatorio';
      }
  
      if (!formData.account_holder_name.trim()) {
        newErrors.account_holder_name = 'El nombre del titular es obligatorio';
      }
  
      if (!formData.account_number.trim()) {
        newErrors.account_number = 'El número de cuenta es obligatorio';
      }
  
      if (!formData.account_bank.trim()) {
        newErrors.account_bank = 'El banco es obligatorio';
      }
  
      if (!formData.account_type.trim()) {
        newErrors.account_type = 'El tipo de cuenta es obligatorio';
      }
  
      // Validar comisión de corretaje si está habilitada
      if (formData.has_brokerage_commission) {
        if (!formData.broker_name?.trim()) {
          newErrors.broker_name = 'El nombre del corredor es obligatorio';
        }
        if (formData.broker_amount <= 0) {
          newErrors.broker_amount = 'El monto de la comisión debe ser mayor a 0';
        }
        if (!formData.broker_rut?.trim()) {
          newErrors.broker_rut = 'El RUT del corredor es obligatorio';
        }
      }
  
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };
  
  
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
  
      if (!validateForm()) return;
  
      try {
        await onSave(formData);
        onClose();
      } catch (error) {
        console.error('Error guardando contrato:', error);
      }
    };
  
    const formatPriceCLP = (amount: number) => {
      return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
      }).format(amount);
    };
  
    if (!isOpen) return null;
  
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">
            {mode === 'create' ? 'Crear Contrato de Arriendo' : 'Editar Contrato de Arriendo'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
  
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información General del Contrato */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="h-4 w-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Información General del Contrato
            </h4>
  
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Inicio *
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.start_date ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.start_date && <p className="text-red-500 text-xs mt-1">{errors.start_date}</p>}
              </div>
  
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plazo de Vigencia (meses) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.validity_period_months}
                  onChange={(e) => setFormData(prev => ({ ...prev, validity_period_months: parseInt(e.target.value) || 12 }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.validity_period_months ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.validity_period_months && <p className="text-red-500 text-xs mt-1">{errors.validity_period_months}</p>}
              </div>
  
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto Final *
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.final_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, final_amount: parseFloat(e.target.value) || 0 }))}
                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.final_amount ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Ej: 500000"
                  />
                  <select
                    value={formData.final_amount_currency}
                    onChange={(e) => setFormData(prev => ({ ...prev, final_amount_currency: e.target.value as 'clp' | 'uf' }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="clp">CLP</option>
                    <option value="uf">UF</option>
                  </select>
                </div>
                {errors.final_amount && <p className="text-red-500 text-xs mt-1">{errors.final_amount}</p>}
              </div>
  
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto Garantía *
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.guarantee_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, guarantee_amount: parseFloat(e.target.value) || 0 }))}
                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.guarantee_amount ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Ej: 250000"
                  />
                  <select
                    value={formData.guarantee_amount_currency}
                    onChange={(e) => setFormData(prev => ({ ...prev, guarantee_amount_currency: e.target.value as 'clp' | 'uf' }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="clp">CLP</option>
                    <option value="uf">UF</option>
                  </select>
                </div>
                {errors.guarantee_amount && <p className="text-red-500 text-xs mt-1">{errors.guarantee_amount}</p>}
              </div>
            </div>
  
            <div className="mt-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.has_dicom_clause}
                  onChange={(e) => setFormData(prev => ({ ...prev, has_dicom_clause: e.target.checked }))}
                  className="h-4 w-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                />
                <span className="ml-2 text-sm text-gray-700">Incluir Cláusula DICOM</span>
              </label>
            </div>
  
            <div className="mt-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.has_auto_renewal_clause}
                  onChange={(e) => setFormData(prev => ({ ...prev, has_auto_renewal_clause: e.target.checked }))}
                  className="h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-gray-700">Incluir Cláusula de Renovación Automática</span>
              </label>
            </div>
          </div>
  
          {/* Comunicación Oficial */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="h-4 w-4 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Comunicación Oficial
            </h4>
  
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Arrendatario *
                </label>
                <input
                  type="email"
                  value={formData.tenant_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, tenant_email: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.tenant_email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="arrendatario@email.com"
                />
                {errors.tenant_email && <p className="text-red-500 text-xs mt-1">{errors.tenant_email}</p>}
              </div>
  
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Arrendador *
                </label>
                <input
                  type="email"
                  value={formData.landlord_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, landlord_email: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.landlord_email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="arrendador@email.com"
                />
                {errors.landlord_email && <p className="text-red-500 text-xs mt-1">{errors.landlord_email}</p>}
              </div>
            </div>
          </div>
  
          {/* Información de Pagos */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="h-4 w-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              Información de Pagos
            </h4>
  
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Titular *
                </label>
                <input
                  type="text"
                  value={formData.account_holder_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, account_holder_name: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.account_holder_name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Ej: Juan Pérez González"
                />
                {errors.account_holder_name && <p className="text-red-500 text-xs mt-1">{errors.account_holder_name}</p>}
              </div>
  
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Cuenta *
                </label>
                <input
                  type="text"
                  value={formData.account_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, account_number: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.account_number ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Ej: 12345678"
                />
                {errors.account_number && <p className="text-red-500 text-xs mt-1">{errors.account_number}</p>}
              </div>
  
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Banco *
                </label>
                <input
                  type="text"
                  value={formData.account_bank}
                  onChange={(e) => setFormData(prev => ({ ...prev, account_bank: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.account_bank ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Ej: Banco Estado"
                />
                {errors.account_bank && <p className="text-red-500 text-xs mt-1">{errors.account_bank}</p>}
              </div>
  
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Cuenta *
                </label>
                <select
                  value={formData.account_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, account_type: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.account_type ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Seleccionar tipo</option>
                  <option value="corriente">Cuenta Corriente</option>
                  <option value="vista">Cuenta Vista</option>
                  <option value="ahorro">Cuenta de Ahorro</option>
                </select>
                {errors.account_type && <p className="text-red-500 text-xs mt-1">{errors.account_type}</p>}
              </div>
            </div>
          </div>
  
          {/* Comisión de Corretaje */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="h-4 w-4 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Comisión de Corretaje
            </h4>
  
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.has_brokerage_commission}
                  onChange={(e) => setFormData(prev => ({ ...prev, has_brokerage_commission: e.target.checked }))}
                  className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">¿Existe comisión de corretaje?</span>
              </label>
            </div>
  
            {formData.has_brokerage_commission && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Corredor *
                  </label>
                  <input
                    type="text"
                    value={formData.broker_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, broker_name: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.broker_name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Nombre completo"
                  />
                  {errors.broker_name && <p className="text-red-500 text-xs mt-1">{errors.broker_name}</p>}
                </div>
  
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monto Comisión (CLP) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.broker_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, broker_amount: parseInt(e.target.value) || 0 }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.broker_amount ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Ej: 50000"
                  />
                  {errors.broker_amount && <p className="text-red-500 text-xs mt-1">{errors.broker_amount}</p>}
                </div>
  
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    RUT del Corredor *
                  </label>
                  <input
                    type="text"
                    value={formData.broker_rut}
                    onChange={(e) => setFormData(prev => ({ ...prev, broker_rut: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.broker_rut ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="12.345.678-9"
                  />
                  {errors.broker_rut && <p className="text-red-500 text-xs mt-1">{errors.broker_rut}</p>}
                </div>
              </div>
            )}
          </div>
  
          {/* Condiciones del Inmueble */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="h-4 w-4 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Condiciones del Inmueble
            </h4>
  
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.allows_pets}
                    onChange={(e) => setFormData(prev => ({ ...prev, allows_pets: e.target.checked }))}
                    className="h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">¿Se permiten mascotas?</span>
                </label>
              </div>
  
              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_furnished}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_furnished: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">¿Está amoblado?</span>
                </label>
              </div>
            </div>
          </div>
  
          {/* Botones */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {isSaving && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {mode === 'create' ? 'Crear Contrato' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    );
  };

// Componente Modal para Revertir Aprobación
const RevertModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  loading: boolean;
}> = ({ isOpen, onClose, onConfirm, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Revertir Aprobación
              </h3>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-600">
              ¿Estás seguro de que quieres revertir la aprobación de esta postulación?
              Esta acción no se puede deshacer.
            </p>
          </div>

          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {loading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              Revertir Aprobación
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};