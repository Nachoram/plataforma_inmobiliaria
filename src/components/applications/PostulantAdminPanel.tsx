/**
 * PostulantAdminPanel.tsx - Interfaz de AdministraciÃ³n del Postulante
 *
 * Panel de administraciÃ³n individual para postulantes, con vista tipo dashboard
 * que permite gestionar postulaciones, mensajes, contratos y solicitudes.
 */

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MessageSquare,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Building,
  MapPin,
  Calendar,
  DollarSign,
  User,
  Eye,
  Edit3,
  X,
  Paperclip
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { CustomButton } from '../common';
import ApplicationDocumentsPanel, { DocumentData } from './ApplicationDocumentsPanel';
import toast from 'react-hot-toast';

// Lazy load del formulario de ediciÃ³n
const RentalApplicationForm = React.lazy(() => import('../properties/RentalApplicationForm'));

// Import new tab components
import { PostulantInfoTab } from './PostulantInfoTab';
import { PostulantDocumentsTab } from './PostulantDocumentsTab';
import { PostulantMessagesTab } from './PostulantMessagesTab';

// Import tab components
import {
  ApplicationDetailsTab,
  MessagesTab,
  ContractTab,
  RequestsTab
} from './PostulantTabComponents';

// ========================================================================
// INTERFACES & TYPES
// ========================================================================

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

interface RequestData {
  id: string;
  applicant_id: string;
  applicant_name: string;
  landlord_id: string;
  landlord_name: string;
  request_type: string;
  subject: string;
  description: string;
  requested_changes: any;
  attachments: any[];
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'cancelled';
  status_changed_at: string;
  response?: string;
  response_attachments?: any[];
  responded_at?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  internal_notes?: string;
}

type TabType = 'info' | 'documents' | 'messages';

// ========================================================================
// MAIN COMPONENT
// ========================================================================

export const PostulantAdminPanel: React.FC = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stats
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);

  // Edit mode
  const [showEditForm, setShowEditForm] = useState(false);

  // Contract management states
  const [contractData, setContractData] = useState<any>(null);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showContractForm, setShowContractForm] = useState(false);
  const [savingContract, setSavingContract] = useState(false);
  const [contractManuallyGenerated, setContractManuallyGenerated] = useState(false);

  // Loading states for contract actions
  const [isDownloadingContract, setIsDownloadingContract] = useState(false);
  const [isViewingContract, setIsViewingContract] = useState(false);
  const [isCancellingContract, setIsCancellingContract] = useState(false);
  const [loadingContract, setLoadingContract] = useState(false);

  // ========================================================================
  // DATA FETCHING
  // ========================================================================

  useEffect(() => {
    if (user && applicationId) {
      fetchApplicationData();
    }
  }, [user, applicationId]);

  const fetchApplicationData = async () => {
    if (!user || !applicationId) return;

    setLoading(true);
    setError(null);

    try {
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

      if (appError) throw appError;
      if (!appData) {
        setError('PostulaciÃ³n no encontrada o no tienes permisos para verla');
        return;
      }

      // Map applicants and guarantors to include a combined last_name for the UI
      const formattedData = {
        ...appData,
        application_applicants: appData.application_applicants?.map((app: any) => ({
          ...app,
          last_name: `${app.paternal_last_name || ''} ${app.maternal_last_name || ''}`.trim()
        })),
        application_guarantors: appData.application_guarantors?.map((guar: any) => ({
          ...guar,
          email: guar.contact_email, // Map contact_email to email for consistency
          last_name: `${guar.paternal_last_name || ''} ${guar.maternal_last_name || ''}`.trim()
        }))
      };

      setApplication(formattedData);

      // Fetch documents
      const { data: docsData, error: docsError } = await supabase
        .from('application_documents')
        .select('*')
        .eq('application_id', applicationId);
      
      if (docsError) {
        console.error('Error fetching documents:', docsError);
      } else {
        setDocuments(docsData || []);
      }

      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .rpc('get_application_messages', {
          p_application_id: applicationId,
          p_user_id: user.id
        });

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
      } else {
        setMessages(messagesData || []);
        const unreadCount = messagesData?.filter((m: MessageData) =>
          !m.is_read && m.recipient_id === user.id
        ).length || 0;
        setUnreadMessages(unreadCount);
      }

      // Fetch requests
      const { data: requestsData, error: requestsError } = await supabase
        .rpc('get_application_requests', {
          p_application_id: applicationId,
          p_user_id: user.id
        });

      if (requestsError) {
        console.error('Error fetching requests:', requestsError);
      } else {
        setRequests(requestsData || []);
        const pendingCount = requestsData?.filter((r: RequestData) =>
          r.status === 'pending' || r.status === 'under_review'
        ).length || 0;
        setPendingRequests(pendingCount);
      }

    } catch (err) {
      console.error('Error fetching application data:', err);
      setError('Error al cargar los datos de la postulaciÃ³n');
    } finally {
      setLoading(false);
    }
  };

  // ========================================================================
  // CONTRACT MANAGEMENT FUNCTIONS
  // ========================================================================

  // FunciÃ³n para ver el contrato
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

  // FunciÃ³n para descargar el contrato
  const handleDownloadContract = async () => {
    if (!contractData?.id) {
      toast.error('No hay contrato disponible para descargar');
      return;
    }

    setIsDownloadingContract(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('SesiÃ³n expirada. Por favor, inicia sesiÃ³n nuevamente.');
        return;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
      const response = await fetch(`${supabaseUrl}/functions/v1/download-contract?contract_id=${contractData.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al descargar el contrato');
      }

      const contentType = response.headers.get('content-type');
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `contrato_${application?.id.slice(-8)}`;

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

  // FunciÃ³n para cancelar contrato (placeholder)
  const handleCancelContract = () => {
    toast.info('Funcionalidad de cancelar contrato en desarrollo');
  };

  // FunciÃ³n para guardar contrato (placeholder)
  const saveContract = async (data: any) => {
    toast.info('Funcionalidad de guardar contrato en desarrollo');
  };

  // FunciÃ³n para refrescar datos de contrato (placeholder)
  const refreshContractData = () => {
    fetchApplicationData();
  };

  // ========================================================================
  // UTILITY FUNCTIONS
  // ========================================================================

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
      case 'en_revision': return 'En RevisiÃ³n';
      default: return 'Pendiente';
    }
  };

  const canEditApplication = () => {
    return application?.status === 'pendiente' || application?.status === 'en_revision';
  };

  const canViewContract = () => {
    return application?.status === 'aprobada' || application?.status === 'finalizada' || application?.status === 'modificada';
  };

  // ========================================================================
  // TAB CONTENT RENDERER
  // ========================================================================

  const renderTabContent = () => {
    console.log('ðŸŽ¯ renderTabContent: Renderizando pestaÃ±a:', activeTab);

    switch (activeTab) {
      case 'info':
        return (
          <PostulantInfoTab
            postulation={application}
            contractData={contractData}
            applicantsDocuments={[]}
            guarantorsDocuments={[]}
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
        );
      case 'documents':
        return (
          <PostulantDocumentsTab
            applicationId={application.id}
            postulants={application.application_applicants || []}
            guarantors={application.application_guarantors || []}
            property={application.properties}
            documents={documents}
            onDocumentUploaded={() => fetchApplicationData()}
            onDocumentDeleted={() => fetchApplicationData()}
          />
        );
      case 'messages':
        return <PostulantMessagesTab messages={messages} application={application} onRefresh={fetchApplicationData} />;
      default:
        return (
          <PostulantInfoTab
            postulation={application}
            contractData={contractData}
            applicantsDocuments={[]}
            guarantorsDocuments={[]}
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
        );
    }
  };

  // ========================================================================
  // LOADING & ERROR STATES
  // ========================================================================

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        <p className="text-gray-600 mt-4">Cargando panel de administraciÃ³n...</p>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-400 mr-3" />
            <h3 className="text-lg font-medium text-red-800">Error</h3>
          </div>
          <p className="mt-2 text-red-700">{error || 'PostulaciÃ³n no encontrada'}</p>
          <div className="mt-4">
            <CustomButton
              variant="primary"
              onClick={() => navigate('/my-applications')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Volver a Mis Postulaciones</span>
            </CustomButton>
          </div>
        </div>
      </div>
    );
  }

  // ========================================================================
  // EDIT FORM HANDLERS
  // ========================================================================

  const handleEditSuccess = () => {
    setShowEditForm(false);
    fetchApplicationData(); // Refresh data
    toast.success('PostulaciÃ³n actualizada correctamente');
  };

  const handleEditCancel = () => {
    setShowEditForm(false);
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  // Show edit form
  if (showEditForm && application) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-6">
          <CustomButton
            variant="secondary"
            onClick={() => setShowEditForm(false)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver al Panel</span>
          </CustomButton>
        </div>

        <Suspense fallback={
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
            <span className="ml-3 text-gray-600">Cargando formulario de ediciÃ³n...</span>
          </div>
        }>
          <RentalApplicationForm
            property={application.properties}
            editMode={true}
            existingApplicationId={application.id}
            onSuccess={handleEditSuccess}
            onCancel={handleEditCancel}
          />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Panel Indicator */}
      <div className="h-1 bg-gradient-to-r from-blue-600 to-blue-700"></div>

      {/* Header Navigation (similar to PostulationAdminPanel) */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            <button
              onClick={() => navigate('/my-applications')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span className="font-medium">Volver a Mis Postulaciones</span>
            </button>
            <div className="text-sm text-gray-500">
              Postulación #{application.id.slice(-8)}
            </div>
          </div>

          {/* Tabs */}
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex space-x-8 overflow-x-auto">
              {[
                { id: 'info', label: 'Información y Acciones', icon: FileText },
                { id: 'documents', label: 'Documentos', icon: Paperclip, count: documents.length },
                { id: 'messages', label: 'Mensajes', icon: MessageSquare, count: unreadMessages }
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
    </div>
  );
};

// ========================================================================
// MAIN COMPONENT
// ========================================================================

