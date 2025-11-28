/**
 * useContractActions.ts - Custom hook para manejar acciones relacionadas con contratos
 *
 * Extraído de PostulationAdminPanel para centralizar toda la lógica de contratos
 * y facilitar testing y reutilización.
 */

import { useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

// Interfaces
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

interface ContractFormData {
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
  account_holder_rut?: string;
  has_brokerage_commission: boolean;
  broker_name?: string;
  broker_amount?: number;
  broker_rut?: string;
  allows_pets: boolean;
  is_furnished: boolean;
}

interface UseContractActionsResult {
  // Estados
  contractData: ContractData | null;
  showContractForm: boolean;
  showContractModal: boolean;
  savingContract: boolean;
  loadingContract: boolean;
  contractModalKey: number;
  contractManuallyGenerated: boolean;
  isDownloadingContract: boolean;
  isViewingContract: boolean;
  isCancellingContract: boolean;

  // Setters
  setContractData: (data: ContractData | null) => void;
  setShowContractForm: (show: boolean) => void;
  setShowContractModal: (show: boolean) => void;
  setContractManuallyGenerated: (generated: boolean) => void;

  // Acciones
  handleOpenContractModal: () => void;
  handleViewContract: () => Promise<void>;
  handleDownloadContract: () => Promise<void>;
  handleEditContract: () => void;
  handleCancelContract: () => Promise<void>;
  saveContract: (contractFormData: ContractFormData) => Promise<void>;
  fetchContractData: () => Promise<void>;
  refreshContractData: () => Promise<void>;
}

export const useContractActions = (
  applicationId: string | undefined,
  postulationData: any
): UseContractActionsResult => {
  // Estados
  const [contractData, setContractData] = useState<ContractData | null>(null);
  const [showContractForm, setShowContractForm] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [savingContract, setSavingContract] = useState(false);
  const [loadingContract, setLoadingContract] = useState(false);
  const [contractModalKey, setContractModalKey] = useState(0);
  const [contractManuallyGenerated, setContractManuallyGenerated] = useState(false);
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        return;
      }

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

      if (response.status === 302) {
        const redirectUrl = response.headers.get('Location');
        if (redirectUrl) {
          window.open(redirectUrl, '_blank');
          toast.success('Contrato abierto en nueva pestaña');
          return;
        }
      }

      const contentType = response.headers.get('content-type');
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `contrato_${postulationData?.id?.slice(-8) || 'unknown'}`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      if (contentType?.includes('text/html')) {
        filename += '.html';
      } else {
        filename += '.pdf';
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
    if (!contractData?.id) {
      toast.error('No hay contrato para cancelar');
      return;
    }

    setIsCancellingContract(true);
    try {
      // TODO: Implementar lógica de cancelación
      toast.info('Funcionalidad de cancelación en desarrollo');
    } catch (error) {
      console.error('Error cancelando contrato:', error);
      toast.error('Error al cancelar el contrato');
    } finally {
      setIsCancellingContract(false);
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

  // Función para guardar contrato
  const saveContract = async (contractFormData: ContractFormData) => {
    if (!applicationId) return;

    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      setSavingContract(true);

      console.log('🔍 [saveContract] Form data recibida:', contractFormData);

      const conditionsPayload = {
        application_id: applicationId,
        contract_duration_months: contractFormData.validity_period_months || 12,
        monthly_payment_day: 1,
        final_rent_price: Number(contractFormData.final_amount) || 0,
        brokerage_commission: contractFormData.has_brokerage_commission ? Number(contractFormData.broker_amount) || 0 : 0,
        guarantee_amount: Number(contractFormData.guarantee_amount) || 0,
        notification_email: contractFormData.landlord_email || '',
        accepts_pets: contractFormData.allows_pets || false,
        dicom_clause: contractFormData.has_dicom_clause || false,
        additional_conditions: contractFormData.has_brokerage_commission
          ? `Comisión del corredor: ${contractFormData.broker_name} (RUT: ${contractFormData.broker_rut})`
          : null,
        broker_name: contractFormData.has_brokerage_commission ? contractFormData.broker_name || '' : 'Sin corredor',
        broker_rut: contractFormData.has_brokerage_commission ? contractFormData.broker_rut || '' : 'Sin RUT',
        contract_start_date: contractFormData.start_date || null,
        bank_name: contractFormData.account_bank || '',
        account_type: contractFormData.account_type || '',
        account_number: contractFormData.account_number || '',
        account_holder_name: contractFormData.account_holder_name || '',
        account_holder_rut: contractFormData.account_holder_rut || '',
        payment_method: 'transferencia_bancaria',
        updated_at: new Date().toISOString()
      };

      console.log('📤 [saveContract] Payload a enviar:', conditionsPayload);

      // Validar campos requeridos
      const requiredFields = ['application_id', 'payment_method', 'broker_name', 'broker_rut', 'notification_email'];
      const missingFields = requiredFields.filter(field => !conditionsPayload[field as keyof typeof conditionsPayload]);

      if (missingFields.length > 0) {
        console.error('❌ [saveContract] Campos requeridos faltantes:', missingFields);
        throw new Error(`Campos requeridos faltantes: ${missingFields.join(', ')}`);
      }

      if (typeof conditionsPayload.final_rent_price !== 'number' || isNaN(conditionsPayload.final_rent_price)) {
        console.error('❌ [saveContract] final_rent_price no es un número válido:', conditionsPayload.final_rent_price);
        throw new Error('El precio final del arriendo debe ser un número válido');
      }

      // Verificar si ya existen condiciones
      const { data: existingConditions, error: checkError } = await supabase
        .from('rental_contract_conditions')
        .select('id')
        .eq('application_id', applicationId)
        .limit(1);

      if (checkError && checkError.code !== 'PGRST116') {
        console.warn('⚠️ Error verificando condiciones existentes:', checkError);
      }

      let result;
      if (existingConditions && existingConditions.length > 0) {
        result = await supabase
          .from('rental_contract_conditions')
          .update(conditionsPayload)
          .eq('application_id', applicationId)
          .select()
          .single();
      } else {
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

      // Actualizar estado local
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
        has_auto_renewal_clause: contractFormData.has_auto_renewal_clause,
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setContractData(mockContractData);
      setShowContractModal(false);
      setShowContractForm(false);

      toast.success('Condiciones del contrato guardadas exitosamente');
      console.log('✅ [saveContract] Condiciones guardadas exitosamente');

    } catch (error) {
      console.error('❌ Error guardando contrato:', error);
      toast.error(error instanceof Error ? error.message : 'Error al guardar las condiciones del contrato');
    } finally {
      setSavingContract(false);
    }
  };

  // Función para refrescar datos del contrato
  const refreshContractData = async () => {
    console.log('🔄 Refrescando datos del contrato...');
    await fetchContractData();
  };

  return {
    // Estados
    contractData,
    showContractForm,
    showContractModal,
    savingContract,
    loadingContract,
    contractModalKey,
    contractManuallyGenerated,
    isDownloadingContract,
    isViewingContract,
    isCancellingContract,

    // Setters
    setContractData,
    setShowContractForm,
    setShowContractModal,
    setContractManuallyGenerated,

    // Acciones
    handleOpenContractModal,
    handleViewContract,
    handleDownloadContract,
    handleEditContract,
    handleCancelContract,
    saveContract,
    fetchContractData,
    refreshContractData
  };
};


