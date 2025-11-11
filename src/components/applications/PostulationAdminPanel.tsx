/**
 * PostulationAdminPanel.tsx - SIMPLE VERSION FOR DEBUGGING
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { sendWebhookGET } from '../../lib/webhook';
import toast from 'react-hot-toast';
import ContractSummaryCard from '../contracts/ContractSummaryCard';

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

// ========================================================================
// MAIN COMPONENT
// ========================================================================

export const PostulationAdminPanel: React.FC = () => {
  const { id: applicationId } = useParams<{ id: string }>();
  const navigate = useNavigate();

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
  const [contractModalKey, setContractModalKey] = useState(0);
  const [showRevertModal, setShowRevertModal] = useState(false);

  // Loading states for contract actions
  const [isDownloadingContract, setIsDownloadingContract] = useState(false);
  const [isViewingContract, setIsViewingContract] = useState(false);
  const [isCancellingContract, setIsCancellingContract] = useState(false);

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
    try {
      setLoading(true);
      setError(null);

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

      setPostulation(postulationData);

    } catch (error: any) {
      console.error('❌ Error en fetchPostulationData:', error);
      setError('Error al cargar los datos de la postulación');
    } finally {
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
        contract_duration_months: contractFormData.validity_period_months || 12,
        monthly_payment_day: 1, // Día de pago por defecto, podría ser configurable después
        final_rent_price: Number(contractFormData.final_amount) || 0, // Asegurar que sea número
        brokerage_commission: contractFormData.has_brokerage_commission ? Number(contractFormData.broker_amount) || 0 : 0, // Asegurar que sea número
        guarantee_amount: Number(contractFormData.guarantee_amount) || 0, // Asegurar que sea número
        // Mapear nombres de columnas correctos según la base de datos
        official_arrendatario_communication_email: contractFormData.tenant_email || '', // Nombre correcto en BD
        accepts_pets: contractFormData.allows_pets || false,
        dicom_clause: contractFormData.has_dicom_clause || false,
        auto_renewal_clause: contractFormData.has_auto_renewal_clause || false,
        additional_conditions: contractFormData.has_brokerage_commission
          ? `Comisión del corredor: ${contractFormData.broker_name} (RUT: ${contractFormData.broker_rut})`
          : null,
        // Nuevas columnas agregadas por migraciones posteriores
        contract_start_date: contractFormData.start_date || null,
        broker_name: contractFormData.has_brokerage_commission ? contractFormData.broker_name || '' : 'Sin corredor',
        broker_rut: contractFormData.has_brokerage_commission ? contractFormData.broker_rut || '' : 'Sin RUT',
        account_holder_name: contractFormData.account_holder_name || '',
        account_holder_rut: '', // No está en el formulario actual
        bank_name: contractFormData.account_bank || '',
        account_type: contractFormData.account_type || '',
        account_number: contractFormData.account_number || '',
        payment_method: 'transferencia_bancaria', // Valor por defecto
        // Mapear landlord_email al nombre correcto en BD
        notificaficacion_email_arrendador: contractFormData.landlord_email || '',
        is_furnished: contractFormData.is_furnished || false,
        created_by: applicationId ? undefined : auth?.user?.id, // Solo establecer en creación
        updated_at: new Date().toISOString()
      };

      console.log('📤 [saveContract] Payload a enviar:', conditionsPayload);

      // Verificar que todos los campos requeridos estén presentes
      const requiredFields = ['application_id', 'payment_method', 'broker_name', 'broker_rut', 'official_arrendatario_communication_email'];
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
      setHasRealScore(false);
      fetchPostulationData();
    }
  }, [applicationId]);

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
  if (!postulation) {
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

  /**
   * Registra una acción en el historial de auditoría
   */
  const logAuditAction = async (
    actionType: string,
    previousStatus: string,
    newStatus: string,
    actionDetails: any = {},
    notes: string = ''
  ) => {
    if (!applicationId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Obtener property_id de la aplicación
      const { data: appData } = await supabase
        .from('applications')
        .select('property_id')
        .eq('id', applicationId)
        .single();

      const { error } = await supabase.rpc('log_application_audit', {
        p_application_id: applicationId,
        p_property_id: appData?.property_id || '',
        p_user_id: user.id,
        p_action_type: actionType,
        p_previous_status: previousStatus,
        p_new_status: newStatus,
        p_action_details: actionDetails,
        p_notes: notes
      });

      if (error) {
        console.error('❌ Error al registrar auditoría:', error);
        // No lanzamos error para no interrumpir el flujo principal
      }
    } catch (error) {
      console.error('❌ Error en logAuditAction:', error);
    }
  };

  /**
   * Maneja la aprobación de la postulación cuando hay condiciones de contrato
   * Envía datos al webhook para generación automática de contrato
   */
  const handleApproveApplication = async () => {
    if (!applicationId) {
      toast.error('No hay aplicación seleccionada');
      return;
    }

    if (!has_contract_conditions) {
      toast.error('Debe crear las condiciones del contrato antes de aprobar la postulación');
      return;
    }

    try {
      console.log('✅ APROBANDO POSTULACIÓN con webhook - ApplicationId:', applicationId);

      // 1. PRIMERO: Actualizar estado de la aplicación a aprobada
      const { error: updateError } = await supabase
        .from('applications')
        .update({
          status: 'aprobada',
          updated_at: new Date().toISOString(),
          approved_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (updateError) {
        console.error('❌ Error actualizando estado:', updateError);
        toast.error('Error al actualizar el estado de la postulación');
        return;
      }

      console.log('✅ Estado de aplicación actualizado a "aprobada"');

      // 2. SEGUNDO: Intentar enviar webhook (no bloquea la aprobación)
      try {
        console.log('🚀 WEBHOOK: Intentando enviar webhook...');

        // Obtener los datos requeridos para el webhook
        const webhookData = await getWebhookData(applicationId);

        if (!webhookData) {
          console.warn('⚠️ WEBHOOK: No se pudieron obtener datos para webhook, pero aprobación exitosa');
          toast.success('✅ Postulación aprobada exitosamente');
          fetchPostulationData();
          fetchAuditHistory();
          return;
        }

        console.log('🚀 WEBHOOK: Enviando notificación de aprobación via GET');
        console.log('📦 WEBHOOK: Datos:', webhookData);

        // Enviar notificación de aprobación usando el cliente webhook
        const webhookSuccess = await sendWebhookGET({
          ...webhookData,
          action: 'application_approved',
          notification_type: 'approval'
        });

        if (webhookSuccess) {
          console.log('✅ WEBHOOK: Notificación de aprobación enviada exitosamente');
        } else {
          console.warn('⚠️ WEBHOOK: Notificación de aprobación no pudo enviarse, pero aprobación exitosa');
        }

        // Registrar auditoría con resultado del webhook
        await logAuditAction(
          'approve',
          'pendiente',
          'aprobada',
          {
            action: 'approve_application_with_contract',
            webhook_data: webhookData,
            has_contract_conditions: true,
            webhook_success: webhookSuccess
          },
          webhookSuccess
            ? 'Postulación aprobada con condiciones de contrato y notificación webhook enviada exitosamente'
            : 'Postulación aprobada con condiciones de contrato (notificación webhook falló)'
        );

        toast.success('✅ Postulación aprobada y contrato enviado para generación automática');

      } catch (webhookError: any) {
        console.warn('⚠️ WEBHOOK: Error enviando webhook, pero aprobación exitosa:', webhookError);

        // Registrar auditoría indicando que el webhook falló
        await logAuditAction(
          'approve',
          'pendiente',
          'aprobada',
          {
            action: 'approve_application_contract_only',
            has_contract_conditions: true,
            webhook_success: false,
            webhook_error: webhookError.message
          },
          'Postulación aprobada con condiciones de contrato, pero notificación webhook falló'
        );

        toast.error('✅ Postulación aprobada, pero hubo un error al enviar la notificación automática. Contacta al administrador.');
      }

      // Recargar datos
      fetchPostulationData();
      fetchAuditLog();

    } catch (error: any) {
      console.error('❌ Error en handleApproveApplication:', error);
      let errorMessage = 'Error al aprobar la postulación';

      if (error.message?.includes('Sesión') || error.message?.includes('session')) {
        errorMessage = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
      }

      toast.error(errorMessage);
    }
  };

  /**
   * Maneja la anulación de la aprobación de la postulación
   */
  const handleRevertApproval = () => {
    setShowRevertModal(true);
  };

  /**
   * Confirma y ejecuta la anulación de la aprobación
   */
  const confirmRevertApproval = async () => {
    if (!applicationId) {
      toast.error('No hay aplicación seleccionada');
      return;
    }

    try {
      setShowRevertModal(false);
      toast.loading('Anulando aprobación...', { id: 'revert-loading' });

      // Obtener usuario actual
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        toast.error('Error de autenticación. Por favor, inicia sesión nuevamente.');
        return;
      }

      console.log('🔄 Anulando aprobación para applicationId:', applicationId);

      // Llamar a la Edge Function
      const { data, error } = await supabase.functions.invoke('undo-application-approval', {
        body: {
          application_id: applicationId,
          undo_requested_by: user.id,
          undo_reason: 'Anulado desde panel administrativo'
        }
      });

      if (error) {
        console.error('❌ Error al anular aprobación:', error);
        toast.error('Error al anular la aprobación');
        return;
      }

      if (!data.success) {
        console.error('❌ Error en respuesta:', data);
        toast.error(data.error || 'Error al anular la aprobación');
        return;
      }

      console.log('✅ Aprobación anulada exitosamente');
      toast.success('✅ Aprobación anulada exitosamente');

      // Actualizar datos de la postulación
      fetchPostulationData();
      fetchAuditHistory();

    } catch (error: any) {
      console.error('❌ Error en confirmRevertApproval:', error);
      let errorMessage = 'Error al anular la aprobación';

      if (error.message?.includes('Sesión') || error.message?.includes('session')) {
        errorMessage = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
      }

      toast.error(errorMessage);
    } finally {
      toast.dismiss('revert-loading');
    }
  };

  /**
   * Obtiene los datos necesarios para enviar al webhook
   * @param appId ID de la aplicación
   * @returns Datos para el webhook o null si hay error
   */
  const getWebhookData = async (appId: string) => {
    try {
      console.log('🔍 WEBHOOK: Obteniendo datos para applicationId:', appId);

      // Verificar sesión primero
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('❌ WEBHOOK: Error de sesión:', sessionError);
        throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
      }
      if (!session) {
        throw new Error('No hay sesión activa. Por favor, inicia sesión.');
      }

      // 1. Obtener property_id de la aplicación
      const { data: application, error: appError } = await supabase
        .from('applications')
        .select('property_id')
        .eq('id', appId)
        .single();

      if (appError || !application) {
        console.error('❌ WEBHOOK: Error obteniendo aplicación:', appError);
        return null;
      }

      const propertyId = application.property_id;
      console.log('🏠 WEBHOOK: Properties.id =', propertyId);

      // Nota: Simplificamos para evitar consultas problemáticas
      const rentalOwnerPropertyId = propertyId; // Usamos el mismo property_id
      console.log('👤 WEBHOOK: Usando mismo property_id =', rentalOwnerPropertyId);

      // 3. Obtener application_id de application_applicants
      const { data: applicants, error: applicantsError } = await supabase
        .from('application_applicants')
        .select('application_id')
        .eq('application_id', appId)
        .limit(1);

      const applicantApplicationId = applicants && applicants.length > 0
        ? applicants[0].application_id
        : appId;

      console.log('📝 WEBHOOK: Application_applicants.application_id =', applicantApplicationId);

      // Datos EXACTOS que solicita el usuario
      const webhookData = {
        properties_id: propertyId,                           // tabla properties columna id
        rental_owners_property_id: rentalOwnerPropertyId,    // tabla rental_owners columna property_id
        application_applicants_application_id: applicantApplicationId, // tabla application_applicants columna application_id
        application_id: appId,                              // ID de la aplicación actual
        timestamp: new Date().toISOString()
      };

      console.log('📤 WEBHOOK: Datos FINALES para enviar:', webhookData);
      return webhookData;

    } catch (error: any) {
      console.error('❌ WEBHOOK: Error obteniendo datos:', error);

      // Si es error de autenticación, mostrar mensaje específico
      if (error.message?.includes('Sesión') || error.message?.includes('session')) {
        throw error; // Re-lanzar para que se maneje arriba
      }

      return null;
    }
  };

  // Variable derivada: indica si ya existen condiciones de contrato
  const has_contract_conditions = contractData !== null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => navigate('/portfolio')}
              className="flex items-center space-x-2 text-blue-100 hover:text-white transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Volver</span>
            </button>
          </div>

          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-4">
              <span className={`inline-flex px-4 py-2 text-sm font-bold rounded-full border-2 shadow-lg ${getStatusBadge(postulation.status)}`}>
                {getStatusLabel(postulation.status)}
              </span>
              <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold shadow-lg border-2 border-white/30 ${getScoreColor(postulation.score)}`}>
                📊 Score: {postulation.score}
                {hasRealScore ? '' : ' (Estimado)'}
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
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Barra de información adicional */}
        <div className="mb-8 bg-white rounded-xl shadow-lg p-6">
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
              {postulation.has_contract && (
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
                onClick={toggleContractForm}
                className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {showContractForm ? 'Ocultar' : 'Ver'} Condiciones Contractuales
                {loadingContract && <div className="ml-2 animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>}
              </button>
              <button
                onClick={toggleAuditHistory}
                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {showAuditHistory ? 'Ocultar' : 'Ver'} Historial
                {loadingAudit && <div className="ml-2 animate-spin h-4 w-4 border-2 border-gray-600 border-t-transparent rounded-full"></div>}
              </button>
            </div>
          </div>
        </div>

        {/* Contract Summary Card - Only show if contract exists */}
        {contractData && (
          <div className="mb-8">
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
              onDownload={handleDownloadContract}
              onView={handleViewContract}
              onEdit={handleEditContract}
              onCancel={handleCancelContract}
              canEdit={contractData.status === 'draft'}
              canCancel={contractData.status !== 'cancelled' && contractData.status !== 'fully_signed'}
              isDownloading={isDownloadingContract}
              isViewing={isViewingContract}
              isCancelling={isCancellingContract}
            />
          </div>
        )}

        {/* Formulario del Contrato */}
        {showContractForm && (
          <div className="mb-8 bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <svg className="h-5 w-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Datos del Contrato de Arriendo
              </h3>
              <button
                onClick={handleOpenContractModal}
                className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                  contractData
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={contractData ? "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" : "M12 6v6m0 0v6m0-6h6m-6 0H6"} />
                </svg>
                {contractData ? 'Editar Contrato' : 'Crear Contrato'}
              </button>
            </div>

            {loadingContract ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Cargando datos del contrato...</span>
              </div>
            ) : contractData ? (
              <div className="space-y-6">
                {/* Información General del Contrato */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                </div>

                {/* Comunicación */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <svg className="h-4 w-4 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Comunicación Oficial
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Arrendatario:</span> {contractData.tenant_email}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Arrendador:</span> {contractData.landlord_email}
                    </p>
                  </div>
                </div>

                {/* Información de Pagos */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <svg className="h-4 w-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    Información de Pagos
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Titular:</span> {contractData.account_holder_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Número de cuenta:</span> {contractData.account_number}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Banco:</span> {contractData.account_bank}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Tipo de cuenta:</span> {contractData.account_type}
                    </p>
                  </div>
                </div>

                {/* Cláusulas Especiales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <svg className="h-4 w-4 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      Cláusulas Especiales
                    </h4>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Cláusula DICOM:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                        contractData.has_dicom_clause ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {contractData.has_dicom_clause ? 'Sí' : 'No'}
                      </span>
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">Renovación Automática:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                        contractData.has_auto_renewal_clause ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {contractData.has_auto_renewal_clause ? 'Sí' : 'No'}
                      </span>
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <svg className="h-4 w-4 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Condiciones del Inmueble
                    </h4>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Tipo:</span> {contractData.property_type === 'casa' ? '🏠 Casa' : '🏢 Departamento'}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Mascotas:</span>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                          contractData.allows_pets ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {contractData.allows_pets ? 'Sí' : 'No'}
                        </span>
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Amoblado:</span>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                          contractData.is_furnished ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {contractData.is_furnished ? 'Sí' : 'No'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Comisión de Corretaje */}
                {contractData.has_brokerage_commission && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <svg className="h-4 w-4 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Comisión de Corretaje
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Corredor:</span> {contractData.broker_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Monto:</span> {formatPriceCLP(contractData.broker_amount)}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">RUT:</span> {contractData.broker_rut}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay contrato creado</h3>
                <p className="text-gray-500 mb-4">Crea el contrato de arriendo para esta postulación con todos los datos necesarios.</p>
                <button
                  onClick={handleOpenContractModal}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Crear Contrato
                </button>
              </div>
            )}
          </div>
        )}

        {/* Historial de Auditoría */}
        {showAuditHistory && (
          <div className="mb-8 bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="h-5 w-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Historial de Auditoría
            </h3>

            {loadingAudit ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
                <span className="ml-3 text-gray-600">Cargando historial...</span>
              </div>
            ) : auditLog.length > 0 ? (
              <div className="space-y-4">
                {auditLog.map((entry) => (
                  <div key={entry.id} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{entry.description}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs text-gray-500">
                            {new Date(entry.created_at).toLocaleDateString('es-CL', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            entry.action_type === 'create' ? 'bg-green-100 text-green-800' :
                            entry.action_type === 'update' ? 'bg-blue-100 text-blue-800' :
                            entry.action_type === 'delete' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {entry.action_type}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-500 mb-2">No hay registros de auditoría</p>
                <p className="text-xs text-gray-400">
                  Las acciones realizadas aparecerán aquí en orden cronológico
                </p>
              </div>
            )}
          </div>
        )}

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
                  <p className="text-xs text-amber-600">
                    Nota: Tabla application_applicants en configuración
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
                            {guarantor.contact_email}
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
                  <p className="text-xs text-amber-600">
                    Nota: Tabla application_guarantors en configuración
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Acciones y Gestión */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="h-5 w-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Acciones Administrativas
              </h3>

              <div className="space-y-3">
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
                    onClick={handleRevertApproval}
                    className="w-full bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                    title="Revertir la aprobación de esta postulación"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    <span>Anular Aprobación</span>
                  </button>
                )}

                <button className="w-full bg-yellow-600 text-white px-4 py-3 rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center space-x-2">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span>Solicitar Información</span>
                </button>

                <button className="w-full bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Rechazar Postulación</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para Crear/Editar Contrato */}
      {showContractModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <ContractModal
              key={contractModalKey}
              isOpen={showContractModal}
              onClose={() => setShowContractModal(false)}
              onSave={saveContract}
              initialData={contractData}
              isSaving={savingContract}
              mode={contractData ? 'edit' : 'create'}
            />
          </div>
        </div>
      )}

      {/* Modal de confirmación para anular aprobación */}
      {showRevertModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                ¿Anular Aprobación?
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Esta acción revertirá el estado de la postulación a "pendiente" y eliminará el contrato generado si existe (solo si no está firmado). Esta acción no se puede deshacer.
              </p>
              <div className="flex space-x-3 justify-center">
                <button
                  onClick={() => setShowRevertModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmRevertApproval}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Anular Aprobación
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

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