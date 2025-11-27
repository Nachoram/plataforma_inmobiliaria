/**
 * usePostulationData.ts - Custom hook para manejar la carga de datos de postulaciones
 *
 * Extraído de PostulationAdminPanel para mejorar la separación de responsabilidades
 * y facilitar testing y reutilización.
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Interfaces (extraídas del componente principal)
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

interface UsePostulationDataResult {
  postulation: PostulationData | null;
  contractData: ContractData | null;
  loading: boolean;
  error: string | null;
  hasRealScore: boolean;
  refetch: () => Promise<void>;
}

export const usePostulationData = (applicationId: string | undefined): UsePostulationDataResult => {
  const [postulation, setPostulation] = useState<PostulationData | null>(null);
  const [contractData, setContractData] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasRealScore, setHasRealScore] = useState(false);

  const fetchPostulationData = async () => {
    if (!applicationId) {
      setError('ID de aplicación no proporcionado');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🎯 [usePostulationData] Iniciando carga de datos para:', applicationId);

      // 1. Obtener datos básicos de la aplicación con propiedad
      const { data: applicationData, error: applicationError } = await supabase
        .from('applications')
        .select(`
          id,
          property_id,
          status,
          message,
          score,
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

      // 2. Obtener postulantes (application_applicants)
      let applicantsData: any[] = [];
      try {
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
          console.warn('⚠️ Tabla application_applicants no disponible:', applicantsError.message);
          // Fallback con datos simulados
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
        } else {
          applicantsData = applicants?.map(applicant => ({
            ...applicant,
            display_name: applicant.entity_type === 'natural'
              ? `${applicant.first_name || ''} ${applicant.paternal_last_name || ''} ${applicant.maternal_last_name || ''}`.trim()
              : applicant.company_name || 'Empresa sin nombre',
            display_income: applicant.entity_type === 'natural'
              ? applicant.monthly_income_clp || 0
              : applicant.net_monthly_income_clp || 0
          })) || [];
        }
      } catch (error) {
        console.warn('⚠️ Error accediendo a application_applicants:', error);
        applicantsData = [];
      }

      // 3. Obtener avales (application_guarantors)
      let guarantorsData: any[] = [];
      try {
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
          console.warn('⚠️ Tabla application_guarantors no disponible:', guarantorsError.message);
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
        guarantorsData = [];
      }

      // 4. Cargar datos del contrato
      let loadedContractData: ContractData | null = null;
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

        if (!contractError && contract && contract.length > 0) {
          loadedContractData = contract[0];
          hasContract = true;
          contractSigned = contract[0]?.status === 'signed';
        }
      } catch (error) {
        console.warn('⚠️ Error cargando datos del contrato:', error);
      }

      // Contadores adicionales
      try {
        const { count: modCount } = await supabase
          .from('application_modifications')
          .select('*', { count: 'exact', head: true })
          .eq('application_id', applicationId);
        modificationCount = modCount || 0;
      } catch (error) {
        modificationCount = 0;
      }

      try {
        const { count: auditCountResult } = await supabase
          .from('application_audit_log')
          .select('*', { count: 'exact', head: true })
          .eq('application_id', applicationId);
        auditCount = auditCountResult || 0;
      } catch (error) {
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
        applicants: applicantsData,
        guarantors: guarantorsData,
        has_contract: hasContract,
        contract_signed: contractSigned,
        modification_count: modificationCount,
        audit_log_count: auditCount
      };

      setHasRealScore(!!applicationData.score);
      setContractData(loadedContractData);
      setPostulation(postulationData);

      console.log('✅ [usePostulationData] Datos cargados exitosamente');

    } catch (error: any) {
      console.error('❌ Error en fetchPostulationData:', error);
      setError('Error al cargar los datos de la postulación');
    } finally {
      setLoading(false);
    }
  };

  // Función para recargar datos
  const refetch = async () => {
    await fetchPostulationData();
  };

  useEffect(() => {
    if (applicationId) {
      fetchPostulationData();
    }
  }, [applicationId]);

  return {
    postulation,
    contractData,
    loading,
    error,
    hasRealScore,
    refetch
  };
};
