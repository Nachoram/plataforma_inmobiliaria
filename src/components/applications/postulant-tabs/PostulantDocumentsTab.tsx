/**
 * PostulantDocumentsTab.tsx - Gestión Completa de Documentos para Postulantes
 *
 * Componente avanzado que permite a los postulantes gestionar todos los tipos
 * de documentos: propios, de garantes, de propiedad y del propietario.
 */

import React, { useState, useEffect } from 'react';
import {
  Upload,
  Download,
  Trash2,
  Eye,
  FileText,
  User,
  Building,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  Plus
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import { CustomButton } from '../../common';
import { postulantValidations } from '../../../lib/postulantValidations';
import toast from 'react-hot-toast';

interface DocumentData {
  id: string;
  file_name: string;
  document_type: string;
  uploaded_at: string;
  verified: boolean;
  url?: string;
}

interface PostulantData {
  id: string;
  first_name: string;
  paternal_last_name: string;
  maternal_last_name: string;
  email: string;
}

interface PropertyData {
  id: string;
  address_street: string;
  address_number?: string;
  owner_id: string;
}

interface PostulantDocumentsTabProps {
  applicationId: string;
  postulants: PostulantData[];
  guarantors: any[];
  property: PropertyData;
  documents: DocumentData[];
  onDocumentUploaded?: () => void;
  onDocumentDeleted?: () => void;
}

export const PostulantDocumentsTab: React.FC<PostulantDocumentsTabProps> = ({
  applicationId,
  postulants,
  guarantors,
  property,
  documents,
  onDocumentUploaded,
  onDocumentDeleted
}) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [propertyDocuments, setPropertyDocuments] = useState<DocumentData[]>([]);
  const [ownerDocuments, setOwnerDocuments] = useState<DocumentData[]>([]);
  const [loadingPropertyDocs, setLoadingPropertyDocs] = useState(false);
  const [loadingOwnerDocs, setLoadingOwnerDocs] = useState(false);

  // Categorizar documentos existentes
  const applicantsDocuments = documents.filter(doc =>
    doc.document_type?.includes('applicant') || doc.document_type?.includes('postulant')
  );

  const guarantorsDocuments = documents.filter(doc =>
    doc.document_type?.includes('guarantor') || doc.document_type?.includes('garante')
  );

  // Cargar documentos de propiedad y propietario
  useEffect(() => {
    if (property?.id) {
      fetchPropertyDocuments();
      fetchOwnerDocuments();
    }
  }, [property?.id]);

  const fetchPropertyDocuments = async () => {
    if (!property?.id) return;

    setLoadingPropertyDocs(true);
    try {
      const { data, error } = await supabase
        .from('property_documents')
        .select('*')
        .eq('property_id', property.id);

      if (error) throw error;
      setPropertyDocuments(data || []);
    } catch (error) {
      console.error('Error fetching property documents:', error);
    } finally {
      setLoadingPropertyDocs(false);
    }
  };

  const fetchOwnerDocuments = async () => {
    if (!property?.owner_id) return;

    setLoadingOwnerDocs(true);
    try {
      const { data, error } = await supabase
        .from('user_documents')
        .select('*')
        .eq('user_id', property.owner_id);

      if (error) throw error;
      setOwnerDocuments(data || []);
    } catch (error) {
      console.error('Error fetching owner documents:', error);
    } finally {
      setLoadingOwnerDocs(false);
    }
  };

  // Función para subir documento
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    documentType: string,
    personId?: string
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file
    const validation = postulantValidations.validateFiles([file], 1, 5);
    if (!validation.isValid) {
      toast.error(validation.error || 'Archivo no válido');
      return;
    }

    setUploading(true);
    try {
      // Crear nombre único para el archivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${documentType}_${Date.now()}.${fileExt}`;
      const filePath = `applications/${applicationId}/${fileName}`;

      // Subir archivo a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('user-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Crear registro en la base de datos
      const { error: dbError } = await supabase
        .from('application_documents')
        .insert({
          application_id: applicationId,
          document_type: documentType,
          file_name: file.name,
          file_path: filePath,
          uploaded_by: user.id,
          person_id: personId,
          verified: false
        });

      if (dbError) throw dbError;

      toast.success('Documento subido correctamente');
      onDocumentUploaded?.();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Error al subir el documento');
    } finally {
      setUploading(false);
    }
  };

  // Función para descargar documento
  const handleDownload = async (document: DocumentData) => {
    try {
      const { data, error } = await supabase.storage
        .from('user-documents')
        .download(document.file_path || document.url);

      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = document.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Error al descargar el documento');
    }
  };

  // Función para eliminar documento
  const handleDelete = async (documentId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este documento?')) return;

    setDeleting(documentId);
    try {
      const { error } = await supabase
        .from('application_documents')
        .delete()
        .eq('id', documentId)
        .eq('uploaded_by', user?.id); // Solo el propietario puede eliminar

      if (error) throw error;

      toast.success('Documento eliminado correctamente');
      onDocumentDeleted?.();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Error al eliminar el documento');
    } finally {
      setDeleting(null);
    }
  };

  // Función para obtener el nombre del tipo de documento
  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'cedula': 'Cédula de Identidad',
      'comprobante_ingresos': 'Comprobante de Ingresos',
      'certificado_laboral': 'Certificado Laboral',
      'certificado_dominio': 'Certificado de Dominio',
      'boleta_agua': 'Boleta de Agua',
      'boleta_luz': 'Boleta de Luz',
      'boleta_gas': 'Boleta de Gas',
      'contrato_arriendo': 'Contrato de Arriendo Actual'
    };
    return labels[type] || type;
  };

  // Función para determinar el estado del documento
  const getDocumentStatus = (doc: DocumentData) => {
    if (doc.verified) return { status: 'verified', label: 'Verificado', color: 'text-green-600', icon: CheckCircle };
    return { status: 'pending', label: 'Pendiente', color: 'text-yellow-600', icon: Clock };
  };

  return (
    <div className="space-y-8">
      {/* Documentos del Postulante */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Mis Documentos</h3>
              <p className="text-sm text-gray-600">Documentos personales requeridos para la postulación</p>
            </div>
          </div>
          <label className="cursor-pointer">
            <input
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => handleFileUpload(e, 'cedula', user?.id)}
              disabled={uploading}
            />
            <CustomButton
              variant="outline"
              className="flex items-center space-x-2"
              disabled={uploading}
            >
              <Plus className="h-4 w-4" />
              <span>{uploading ? 'Subiendo...' : 'Agregar Documento'}</span>
            </CustomButton>
          </label>
        </div>

        {applicantsDocuments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No has subido documentos aún</p>
            <p className="text-sm">Haz clic en "Agregar Documento" para comenzar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {applicantsDocuments.map((doc) => {
              const status = getDocumentStatus(doc);
              const StatusIcon = status.icon;

              return (
                <div key={doc.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      status.status === 'verified' ? 'bg-green-100' : 'bg-yellow-100'
                    }`}>
                      <StatusIcon className={`h-4 w-4 ${status.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{doc.file_name}</p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>{getDocumentTypeLabel(doc.document_type)}</span>
                        <span>•</span>
                        <span>{new Date(doc.uploaded_at).toLocaleDateString('es-CL')}</span>
                        <span>•</span>
                        <span className={status.color}>{status.label}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleDownload(doc)}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
                      title="Descargar"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      disabled={deleting === doc.id}
                      className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Eliminar"
                    >
                      {deleting === doc.id ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Documentos de Garantes */}
      {guarantors.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Documentos de Garantes</h3>
              <p className="text-sm text-gray-600">Documentos de las personas que garantizan la postulación</p>
            </div>
          </div>

          {guarantorsDocuments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No se han subido documentos de garantes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {guarantorsDocuments.map((doc) => {
                const status = getDocumentStatus(doc);
                const StatusIcon = status.icon;
                const garante = guarantors.find(g => g.id === doc.person_id);

                return (
                  <div key={doc.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        status.status === 'verified' ? 'bg-green-100' : 'bg-yellow-100'
                      }`}>
                        <StatusIcon className={`h-4 w-4 ${status.color}`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{doc.file_name}</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          {garante && <span>{garante.first_name} {garante.last_name}</span>}
                          <span>•</span>
                          <span>{getDocumentTypeLabel(doc.document_type)}</span>
                          <span>•</span>
                          <span>{new Date(doc.uploaded_at).toLocaleDateString('es-CL')}</span>
                          <span>•</span>
                          <span className={status.color}>{status.label}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDownload(doc)}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
                        title="Descargar"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Documentos de la Propiedad */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Building className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Documentos de la Propiedad</h3>
            <p className="text-sm text-gray-600">Documentos oficiales de la propiedad postulada</p>
          </div>
        </div>

        {loadingPropertyDocs ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando documentos...</p>
          </div>
        ) : propertyDocuments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Building className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No hay documentos disponibles para esta propiedad</p>
          </div>
        ) : (
          <div className="space-y-3">
            {propertyDocuments.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between bg-green-50 p-4 rounded-lg">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <FileText className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{doc.file_name}</p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>{getDocumentTypeLabel(doc.document_type)}</span>
                      <span>•</span>
                      <span>{new Date(doc.uploaded_at).toLocaleDateString('es-CL')}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(doc)}
                  className="p-2 text-green-600 hover:text-green-900 hover:bg-green-200 rounded-lg transition-colors"
                  title="Descargar"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Documentos del Propietario */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <User className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Documentos del Propietario</h3>
            <p className="text-sm text-gray-600">Documentos de identificación del arrendador</p>
          </div>
        </div>

        {loadingOwnerDocs ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando documentos...</p>
          </div>
        ) : ownerDocuments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No hay documentos disponibles del propietario</p>
          </div>
        ) : (
          <div className="space-y-3">
            {ownerDocuments.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <FileText className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{doc.file_name}</p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>{getDocumentTypeLabel(doc.document_type)}</span>
                      <span>•</span>
                      <span>{new Date(doc.uploaded_at).toLocaleDateString('es-CL')}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(doc)}
                  className="p-2 text-orange-600 hover:text-orange-900 hover:bg-orange-200 rounded-lg transition-colors"
                  title="Descargar"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
