/**
 * usePostulantData.ts - Hook personalizado para gestión de datos de postulaciones
 *
 * Centraliza la lógica de carga, actualización y gestión de estado
 * para datos relacionados con postulaciones.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { processApplicantsData, processGuarantorsData, isValidApplication } from '../components/applications/postulant-utils';

interface PostulationData {
  id: string;
  property_id: string;
  status: string;
  score?: number;
  message: string;
  created_at: string;
  updated_at: string;
  property: any;
  applicants: any[];
  guarantors: any[];
  has_contract_conditions?: boolean;
  has_contract?: boolean;
  contract_signed?: boolean;
  modification_count?: number;
  audit_log_count?: number;
}

interface MessageData {
  id: string;
  sender_id: string;
  sender_type: 'applicant' | 'landlord';
  sender_name: string;
  recipient_id: string;
  recipient_type: 'applicant' | 'landlord';
  recipient_name: string;
  subject: string;
  message: string;
  message_type: string;
  attachments: any[];
  is_read: boolean;
  read_at?: string;
  created_at: string;
  parent_message_id?: string;
  conversation_id: string;
}

interface UsePostulantDataResult {
  // Data
  postulation: PostulationData | null;
  messages: MessageData[];
  documents: any[];
  contractData: any;

  // Loading states
  loading: boolean;
  loadingMessages: boolean;
  loadingDocuments: boolean;
  loadingContract: boolean;

  // Error states
  error: string | null;

  // Statistics
  unreadMessages: number;
  pendingRequests: number;

  // Actions
  refreshData: () => Promise<void>;
  refreshMessages: () => Promise<void>;
  refreshDocuments: () => Promise<void>;
  refreshContract: () => Promise<void>;
}

export const usePostulantData = (applicationId: string | undefined, user: any): UsePostulantDataResult => {
  // Data state
  const [postulation, setPostulation] = useState<PostulationData | null>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [contractData, setContractData] = useState<any>(null);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [loadingContract, setLoadingContract] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Statistics
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);

  // Debug logging
  console.log('🔍 [usePostulantData] Hook called with (v2):', { applicationId, userId: user?.id, timestamp: Date.now() });

  // ========================================================================
  // DATA FETCHING FUNCTIONS
  // ========================================================================

  const fetchPostulationData = useCallback(async () => {
    console.log('🚀 [usePostulantData] fetchPostulationData called');
    console.log('🔍 [usePostulantData] applicationId:', applicationId);
    console.log('👤 [usePostulantData] user:', user);

    if (!user || !applicationId) {
      console.log('⚠️ [usePostulantData] Missing user or applicationId, skipping fetch');
      return;
    }

    console.log('✅ [usePostulantData] Starting data fetch');

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 [usePostulantData] Making Supabase query...');

      // Fetch application with property details
      const { data: appData, error: appError } = await supabase
        .from('applications')
        .select(`
          *,
          properties(
            id,
            address_street,
            address_number,
            address_commune,
            price_clp,
            listing_type,
            owner_id
          ),
          application_applicants(id, first_name, paternal_last_name, maternal_last_name, email),
          application_guarantors(id, first_name, paternal_last_name, maternal_last_name, contact_email)
        `)
        .eq('id', applicationId)
        .eq('applicant_id', user.id)
        .single();

      console.log('📊 [usePostulantData] Supabase response:', { data: !!appData, error: appError });

      if (appError) {
        console.error('❌ [usePostulantData] Supabase error:', appError);
        throw appError;
      }

      if (!appData) {
        console.log('⚠️ [usePostulantData] No data returned from Supabase');
        setError('Postulación no encontrada o no tienes permisos para verla');
        setLoading(false);
        return;
      }

      console.log('✅ [usePostulantData] Data received:', appData);

      // Validate application data
      if (!isValidApplication(appData)) {
        setError('Datos de postulación inválidos');
        setLoading(false);
        return;
      }

      // Process applicants and guarantors data
      const processedApplicants = processApplicantsData(appData.application_applicants || []);
      const processedGuarantors = processGuarantorsData(appData.application_guarantors || []);

      const formattedData = {
        ...appData,
        application_applicants: processedApplicants,
        application_guarantors: processedGuarantors,
        // Keep both formats for compatibility
        applicants: processedApplicants,
        guarantors: processedGuarantors
      };

      setPostulation(formattedData);

      console.log('✅ [usePostulantData] Postulación cargada exitosamente');

    } catch (err) {
      console.error('❌ [usePostulantData] Error fetching postulation data:', err);
      setError('Error al cargar los datos de la postulación');
    } finally {
      setLoading(false);
    }
  }, [applicationId, user]);

  const fetchMessages = useCallback(async () => {
    if (!user || !applicationId) return;

    setLoadingMessages(true);

    try {
      const { data: messagesData, error: messagesError } = await supabase
        .rpc('get_application_messages', {
          p_application_id: applicationId,
          p_user_id: user.id
        });

      if (messagesError) throw messagesError;

      setMessages(messagesData || []);

      // Calculate unread messages
      const unreadCount = messagesData?.filter((m: MessageData) =>
        !m.is_read && m.recipient_id === user.id
      ).length || 0;
      setUnreadMessages(unreadCount);

      console.log('✅ [usePostulantData] Mensajes cargados exitosamente');

    } catch (error) {
      console.error('❌ [usePostulantData] Error fetching messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  }, [applicationId, user]);

  const fetchDocuments = useCallback(async () => {
    if (!applicationId) return;

    setLoadingDocuments(true);

    try {
      const { data: docsData, error: docsError } = await supabase
        .from('application_documents')
        .select('*')
        .eq('application_id', applicationId);

      if (docsError) throw docsError;

      setDocuments(docsData || []);
      console.log('✅ [usePostulantData] Documentos cargados exitosamente');

    } catch (error) {
      console.error('❌ [usePostulantData] Error fetching documents:', error);
    } finally {
      setLoadingDocuments(false);
    }
  }, [applicationId]);

  const fetchContractData = useCallback(async () => {
    if (!applicationId) return;

    setLoadingContract(true);

    try {
      // Fetch contract conditions
      const { data: conditionsData, error: conditionsError } = await supabase
        .from('rental_contract_conditions')
        .select('*')
        .eq('application_id', applicationId)
        .single();

      if (conditionsError && conditionsError.code !== 'PGRST116') {
        throw conditionsError;
      }

      if (conditionsData) {
        setContractData(conditionsData);
      } else {
        setContractData(null);
      }

      console.log('✅ [usePostulantData] Datos de contrato cargados exitosamente');

    } catch (error) {
      console.error('❌ [usePostulantData] Error fetching contract data:', error);
      setContractData(null);
    } finally {
      setLoadingContract(false);
    }
  }, [applicationId]);

  // ========================================================================
  // EFFECTS
  // ========================================================================

  // Initial data loading
  useEffect(() => {
    console.log('🔄 [usePostulantData] useEffect triggered:', { user: !!user, applicationId });

    if (user && applicationId) {
      console.log('🚀 [usePostulantData] Calling fetchPostulationData');
      fetchPostulationData();
    } else {
      console.log('⏳ [usePostulantData] Waiting for user and applicationId');
      // If we don't have the required data, set loading to false after a timeout
      const timeout = setTimeout(() => {
        if (!postulation && !error) {
          console.log('⚠️ [usePostulantData] Timeout reached, setting loading to false');
          setLoading(false);
          setError('No se pudieron cargar los datos. Verifica que estés autenticado y que la postulación existe.');
        }
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [user, applicationId, fetchPostulationData]);

  // Load related data when postulation is available
  useEffect(() => {
    if (postulation) {
      console.log('📊 [usePostulantData] Postulation loaded, fetching related data');
      fetchMessages();
      fetchDocuments();
      fetchContractData();
    }
  }, [postulation, fetchMessages, fetchDocuments, fetchContractData]);

  // ========================================================================
  // PUBLIC API
  // ========================================================================

  const refreshData = useCallback(async () => {
    await Promise.all([
      fetchPostulationData(),
      fetchMessages(),
      fetchDocuments(),
      fetchContractData()
    ]);
  }, [fetchPostulationData, fetchMessages, fetchDocuments, fetchContractData]);

  const refreshMessages = useCallback(async () => {
    await fetchMessages();
  }, [fetchMessages]);

  const refreshDocuments = useCallback(async () => {
    await fetchDocuments();
  }, [fetchDocuments]);

  const refreshContract = useCallback(async () => {
    await fetchContractData();
  }, [fetchContractData]);

  return {
    // Data
    postulation,
    messages,
    documents,
    contractData,

    // Loading states
    loading,
    loadingMessages,
    loadingDocuments,
    loadingContract,

    // Error states
    error,

    // Statistics
    unreadMessages,
    pendingRequests,

    // Actions
    refreshData,
    refreshMessages,
    refreshDocuments,
    refreshContract
  };
};
