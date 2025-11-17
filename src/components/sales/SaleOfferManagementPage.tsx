/**
 * SaleOfferManagementPage.tsx
 *
 * Página dedicada para la gestión completa de ofertas de venta individuales.
 * Inspirada en el formato de PostulationAdminPanel pero adaptada para ofertas de venta.
 *
 * FUNCIONALIDADES:
 * - Vista completa de detalles de la oferta
 * - Gestión de documentos con descarga y autorización
 * - Historial completo de cambios
 * - Acciones administrativas avanzadas
 * - Navegación por pestañas
 *
 * @module SaleOfferManagementPage
 * @since 2025-11-14
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  Eye,
  FileText,
  Calendar,
  Settings,
  User,
  Mail,
  Phone,
  DollarSign,
  Download,
  Shield,
  ArrowLeft,
  X,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp
} from 'lucide-react';
import { supabase, SaleOfferStatus } from '../../lib/supabase';

// ========================================================================
// INTERFACES & TYPES
// ========================================================================

/**
 * Datos completos de una oferta con información extendida
 */
interface Offer {
  id: string;
  buyer_id: string;
  property_id: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone?: string;
  offer_amount: number;
  offer_amount_currency: string;
  financing_type?: string;
  message?: string;
  status: SaleOfferStatus;
  created_at: string;
  updated_at: string;
  requests_title_study: boolean;
  requests_property_inspection: boolean;
  seller_response?: string;
  seller_notes?: string;
  counter_offer_amount?: number;
  counter_offer_terms?: string;
  responded_at?: string;
}

/**
 * Documento adjunto a la oferta
 */
interface OfferDocument {
  id: string;
  offer_id: string;
  doc_type: string;
  file_name: string;
  file_url: string;
  file_size_bytes?: number;
  uploaded_at: string;
}

/**
 * Entrada de historial de la oferta
 */
interface OfferHistory {
  id: string;
  offer_id: string;
  action: string;
  details: string;
  created_at: string;
}

// ========================================================================
// UTILITY FUNCTIONS
// ========================================================================

/**
 * Formatea detalles de error para logging y debugging
 */
const formatErrorDetails = (error: any, context: string = '') => {
  const details = {
    context,
    message: error?.message || 'Error desconocido',
    code: error?.code || 'N/A',
    details: error?.details || 'Sin detalles adicionales',
    hint: error?.hint || 'Sin sugerencias',
    stack: error?.stack || 'Sin stack trace',
    statusCode: error?.statusCode || error?.status || 'N/A',
  };

  console.error(`❌ [ERROR] ${context}:`, details);
  return details;
};

/**
 * Genera un mensaje de error user-friendly
 */
const getUserFriendlyErrorMessage = (error: any, defaultMessage: string = 'Ha ocurrido un error'): string => {
  if (!error) return defaultMessage;

  const message = error.message || '';

  if (message.includes('violates check constraint')) {
    return 'Datos inválidos. Por favor verifica los campos ingresados.';
  }

  if (message.includes('violates foreign key constraint')) {
    return 'Referencia inválida. Verifica que todos los datos relacionados existan.';
  }

  if (message.includes('permission denied') || message.includes('RLS') || message.includes('policy')) {
    return 'No tienes permisos para realizar esta acción. Verifica que seas el propietario.';
  }

  if (message.includes('column') && message.includes('does not exist')) {
    return 'Error de configuración: La columna solicitada no existe en la base de datos.';
  }

  if (error.code === '404' || message.includes('not found')) {
    return 'La oferta solicitada no existe o no está disponible.';
  }

  return message || defaultMessage;
};

// ========================================================================
// MAIN COMPONENT
// ========================================================================

const SaleOfferManagementPage: React.FC = () => {
  const { id: offerId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================

  const [offer, setOffer] = useState<Offer | null>(null);
  const [documents, setDocuments] = useState<OfferDocument[]>([]);
  const [history, setHistory] = useState<OfferHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'documents' | 'history' | 'actions'>('details');
  const [documentAccessAuthorized, setDocumentAccessAuthorized] = useState(false);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // ========================================================================
  // EFFECTS
  // ========================================================================

  useEffect(() => {
    if (offerId) {
      loadOfferData();
    } else {
      toast.error('ID de oferta no válido');
      navigate('/dashboard');
    }
  }, [offerId]);

  // ========================================================================
  // DATA FETCHING FUNCTIONS
  // ========================================================================

  /**
   * Carga todos los datos de la oferta
   */
  const loadOfferData = async () => {
    if (!offerId) return;

    setLoading(true);
    try {
      await Promise.all([
        fetchOffer(),
        fetchDocuments(),
        fetchHistory()
      ]);
    } catch (error: any) {
      formatErrorDetails(error, 'loadOfferData');
      const userMessage = getUserFriendlyErrorMessage(error, 'Error al cargar los datos de la oferta');
      toast.error(userMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Carga la información básica de la oferta
   */
  const fetchOffer = async () => {
    if (!offerId) return;

    const { data: offerData, error } = await supabase
      .from('property_sale_offers')
      .select('*')
      .eq('id', offerId)
      .single();

    if (error) {
      formatErrorDetails(error, 'fetchOffer');
      throw error;
    }

    setOffer(offerData);
  };

  /**
   * Carga los documentos de la oferta
   */
  const fetchDocuments = async () => {
    if (!offerId) return;

    setIsLoadingDocuments(true);
    try {
      const { data: documentsData, error } = await supabase
        .from('property_sale_offer_documents')
        .select('*')
        .eq('offer_id', offerId)
        .order('uploaded_at', { ascending: false });

      if (error) {
        formatErrorDetails(error, 'fetchDocuments');
        throw error;
      }

      setDocuments(documentsData || []);
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  /**
   * Carga el historial de la oferta
   */
  const fetchHistory = async () => {
    if (!offerId) return;

    setIsLoadingHistory(true);
    try {
      const { data: historyData, error } = await supabase
        .from('property_sale_offer_history')
        .select('*')
        .eq('offer_id', offerId)
        .order('created_at', { ascending: false });

      if (error) {
        formatErrorDetails(error, 'fetchHistory');
        throw error;
      }

      setHistory(historyData || []);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // ========================================================================
  // ACTION FUNCTIONS
  // ========================================================================

  /**
   * Descarga un documento específico
   */
  const downloadDocument = async (document: OfferDocument) => {
    try {
      const link = document.createElement('a');
      link.href = document.file_url;
      link.download = document.file_name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Documento descargado correctamente');
    } catch (error) {
      toast.error('Error al descargar el documento');
    }
  };

  /**
   * Autoriza el acceso a documentos confidenciales
   */
  const authorizeDocumentAccess = async () => {
    if (!offer) return;

    try {
      const { error } = await supabase
        .from('property_sale_offers')
        .update({
          seller_notes: `${offer.seller_notes || ''}\n[ACCESO AUTORIZADO] ${new Date().toISOString()}`
        })
        .eq('id', offer.id);

      if (error) {
        formatErrorDetails(error, 'authorizeDocumentAccess');
        toast.error('Error al autorizar acceso');
        return;
      }

      setDocumentAccessAuthorized(true);
      toast.success('Acceso a documentos autorizado para el comprador');

      // Recargar historial
      await fetchHistory();
    } catch (error: any) {
      formatErrorDetails(error, 'authorizeDocumentAccess');
      toast.error('Error al autorizar acceso');
    }
  };

  /**
   * Actualiza el estado de la oferta
   */
  const updateOfferStatus = async (newStatus: SaleOfferStatus, notes?: string) => {
    if (!offer) return;

    try {
      const { error } = await supabase
        .from('property_sale_offers')
        .update({
          status: newStatus,
          seller_notes: notes || offer.seller_notes,
          responded_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', offer.id);

      if (error) {
        formatErrorDetails(error, 'updateOfferStatus');
        toast.error('Error al actualizar estado de la oferta');
        return;
      }

      toast.success(`Oferta ${newStatus.replace('_', ' ').toUpperCase()}`);

      // Recargar datos
      await loadOfferData();
    } catch (error: any) {
      formatErrorDetails(error, 'updateOfferStatus');
      toast.error('Error al actualizar estado');
    }
  };

  /**
   * Envía respuesta al comprador
   */
  const sendResponseToBuyer = async (response: string) => {
    if (!offer) return;

    try {
      const { error } = await supabase
        .from('property_sale_offers')
        .update({
          seller_response: response,
          responded_at: new Date().toISOString()
        })
        .eq('id', offer.id);

      if (error) {
        formatErrorDetails(error, 'sendResponseToBuyer');
        toast.error('Error al enviar respuesta');
        return;
      }

      toast.success('Respuesta enviada al comprador');

      // Recargar historial
      await fetchHistory();
    } catch (error: any) {
      formatErrorDetails(error, 'sendResponseToBuyer');
      toast.error('Error al enviar respuesta');
    }
  };

  // ========================================================================
  // UI HELPERS
  // ========================================================================

  const getStatusColor = (status: SaleOfferStatus) => {
    switch (status) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'en_revision': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'info_solicitada': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'aceptada': return 'bg-green-100 text-green-800 border-green-200';
      case 'rechazada': return 'bg-red-100 text-red-800 border-red-200';
      case 'contraoferta': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'estudio_titulo': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'finalizada': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: SaleOfferStatus) => {
    const labels: Record<SaleOfferStatus, string> = {
      pendiente: 'Pendiente',
      en_revision: 'En Revisión',
      info_solicitada: 'Info Solicitada',
      aceptada: 'Aceptada',
      rechazada: 'Rechazada',
      contraoferta: 'Contraoferta',
      estudio_titulo: 'Estudio de Título',
      finalizada: 'Finalizada',
    };
    return labels[status];
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando oferta...</p>
        </div>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Oferta no encontrada</h2>
          <p className="text-gray-600 mb-4">La oferta solicitada no existe o no tienes acceso a ella.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Volver
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Gestión de Oferta
                </h1>
                <p className="text-sm text-gray-500">
                  {offer.buyer_name} - ${offer.offer_amount?.toLocaleString('es-CL')}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${getStatusColor(offer.status)}`}>
                {getStatusLabel(offer.status)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('details')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center ${
                  activeTab === 'details'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Eye className="h-4 w-4 mr-2" />
                Detalles
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center ${
                  activeTab === 'documents'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <FileText className="h-4 w-4 mr-2" />
                Documentos ({documents.length})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center ${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Historial
              </button>
              <button
                onClick={() => setActiveTab('actions')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center ${
                  activeTab === 'actions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Settings className="h-4 w-4 mr-2" />
                Acciones
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'details' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Buyer Info */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                      <User className="h-5 w-5 mr-2 text-blue-600" />
                      Información del Comprador
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                        <User className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">{offer.buyer_name}</p>
                          <p className="text-sm text-gray-600">Comprador</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                        <Mail className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-900">{offer.buyer_email}</p>
                          <p className="text-xs text-gray-600">Email</p>
                        </div>
                      </div>
                      {offer.buyer_phone && (
                        <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                          <Phone className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-900">{offer.buyer_phone}</p>
                            <p className="text-xs text-gray-600">Teléfono</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Offer Details */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                      <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                      Detalles de la Oferta
                    </h3>
                    <div className="space-y-4">
                      <div className="bg-white rounded-lg p-4 shadow-sm border">
                        <p className="text-sm text-green-700 font-medium mb-1">Monto Ofertado:</p>
                        <div className="flex items-center">
                          <DollarSign className="h-6 w-6 text-green-600" />
                          <span className="text-2xl font-bold text-green-600">
                            ${offer.offer_amount ? offer.offer_amount.toLocaleString('es-CL') : 'N/A'}
                          </span>
                        </div>
                        {offer.financing_type && (
                          <p className="text-sm text-green-600 mt-2">
                            Tipo de financiamiento: {offer.financing_type}
                          </p>
                        )}
                      </div>

                      {offer.counter_offer_amount && (
                        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                          <p className="text-sm text-purple-700 font-medium mb-1">Tu Contraoferta:</p>
                          <div className="flex items-center">
                            <DollarSign className="h-6 w-6 text-purple-600" />
                            <span className="text-2xl font-bold text-purple-600">
                              ${offer.counter_offer_amount.toLocaleString('es-CL')}
                            </span>
                          </div>
                          {offer.counter_offer_terms && (
                            <p className="text-sm text-purple-600 mt-2">{offer.counter_offer_terms}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Message */}
                {offer.message && (
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-6 border border-yellow-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <Mail className="h-5 w-5 mr-2 text-yellow-600" />
                      Mensaje del Comprador
                    </h3>
                    <div className="bg-white rounded-lg p-4 border border-yellow-200">
                      <p className="text-gray-700 italic">"{offer.message}"</p>
                    </div>
                  </div>
                )}

                {/* Special Requests */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-indigo-600" />
                    Solicitudes Especiales
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {offer.requests_title_study && (
                      <div className="flex items-center space-x-2 px-4 py-2 bg-indigo-100 text-indigo-800 rounded-lg text-sm font-medium border border-indigo-300">
                        <FileText className="h-4 w-4" />
                        <span>Solicita estudio de título</span>
                      </div>
                    )}
                    {offer.requests_property_inspection && (
                      <div className="flex items-center space-x-2 px-4 py-2 bg-orange-100 text-orange-800 rounded-lg text-sm font-medium border border-orange-300">
                        <Eye className="h-4 w-4" />
                        <span>Solicita inspección de propiedad</span>
                      </div>
                    )}
                    {!offer.requests_title_study && !offer.requests_property_inspection && (
                      <p className="text-gray-500 text-sm italic">No hay solicitudes especiales</p>
                    )}
                  </div>
                </div>

                {/* Seller Response */}
                {offer.seller_response && (
                  <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-lg p-6 border border-green-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                      Tu Respuesta Anterior
                    </h3>
                    <p className="text-green-700 bg-white p-4 rounded-lg border">{offer.seller_response}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Documentos Adjuntos
                  </h3>
                  {!documentAccessAuthorized && (
                    <button
                      onClick={authorizeDocumentAccess}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center shadow-md"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Autorizar Acceso
                    </button>
                  )}
                  {documentAccessAuthorized && (
                    <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Acceso Autorizado
                    </span>
                  )}
                </div>

                {isLoadingDocuments ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
                  </div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No hay documentos</h3>
                    <p className="text-gray-500">El comprador no ha adjuntado documentos aún.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {documents.map((doc) => (
                      <div key={doc.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-200">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 truncate mb-2">{doc.file_name}</h4>
                            <p className="text-sm text-gray-600 capitalize mb-1">{doc.doc_type.replace('_', ' ')}</p>
                            <p className="text-xs text-gray-500 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              Subido: {new Date(doc.uploaded_at).toLocaleDateString('es-CL')}
                            </p>
                            {doc.file_size_bytes && (
                              <p className="text-xs text-gray-500">
                                Tamaño: {(doc.file_size_bytes / 1024).toFixed(1)} KB
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => downloadDocument(doc)}
                          className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center shadow-sm"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Descargar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Historial de Cambios
                </h3>

                {isLoadingHistory ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No hay historial</h3>
                    <p className="text-gray-500">Aún no hay cambios registrados en esta oferta.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {history.map((entry) => (
                      <div key={entry.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-2">{entry.action}</h4>
                            <p className="text-sm text-gray-700 mb-3">{entry.details}</p>
                          </div>
                          <span className="text-xs text-gray-500 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(entry.created_at).toLocaleString('es-CL')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'actions' && (
              <div className="space-y-8">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Acciones Administrativas
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Status Update */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <Settings className="h-5 w-5 mr-2 text-blue-600" />
                      Cambiar Estado
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => updateOfferStatus('en_revision')}
                        className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        En Revisión
                      </button>
                      <button
                        onClick={() => updateOfferStatus('aceptada')}
                        className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        Aceptar
                      </button>
                      <button
                        onClick={() => updateOfferStatus('rechazada')}
                        className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                      >
                        Rechazar
                      </button>
                      <button
                        onClick={() => updateOfferStatus('contraoferta')}
                        className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                      >
                        Contraoferta
                      </button>
                    </div>
                  </div>

                  {/* Response */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <Mail className="h-5 w-5 mr-2 text-indigo-600" />
                      Enviar Respuesta
                    </h4>
                    <div className="space-y-4">
                      <textarea
                        id="sellerResponse"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                        rows={6}
                        placeholder="Escribe tu respuesta al comprador..."
                      />
                      <button
                        onClick={() => {
                          const response = (document.getElementById('sellerResponse') as HTMLTextAreaElement)?.value;
                          if (response?.trim()) {
                            sendResponseToBuyer(response);
                            (document.getElementById('sellerResponse') as HTMLTextAreaElement).value = '';
                          }
                        }}
                        className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
                      >
                        Enviar Respuesta
                      </button>
                    </div>
                  </div>
                </div>

                {/* Special Actions */}
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
                    Acciones Especiales
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => toast.info('Funcionalidad de solicitud de informes próximamente')}
                      className="px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium flex items-center justify-center shadow-sm"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Informe Comercial
                    </button>
                    <button
                      onClick={() => toast.info('Funcionalidad de solicitud de documentos próximamente')}
                      className="px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium flex items-center justify-center shadow-sm"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Más Documentos
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaleOfferManagementPage;

