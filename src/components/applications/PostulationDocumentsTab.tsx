/**
 * PostulationDocumentsTab.tsx
 *
 * Componente avanzado para la gestión de documentos en postulaciones.
 * Adaptado del OfferDocumentsTab para manejar postulantes y avales.
 *
 * Funcionalidades:
 * - Barra de progreso general de documentación
 * - Agrupación de documentos por postulante/aval
 * - Estados avanzados: pendiente, recibido, validado, rechazado
 * - Sistema de upload con validación
 * - Descarga de documentos existentes
 *
 * @since 2025-11-26
 */

import React, { useState, useRef } from 'react';
import {
  Upload,
  Download,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  RefreshCw,
  Clock,
  Plus,
  User,
  Shield
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

// ========================================================================
// INTERFACES & TYPES
// ========================================================================

interface Applicant {
  id: string;
  display_name?: string;
  first_name?: string;
  entity_type?: 'natural' | 'juridica';
  email?: string;
}

interface Guarantor {
  id: string;
  display_name?: string;
  first_name?: string;
  entity_type?: 'natural' | 'juridica';
  email?: string;
}

interface PostulationDocument {
  id: string;
  application_id: string;
  applicant_id?: string;
  guarantor_id?: string;
  document_name: string;
  document_type: string;
  file_url?: string;
  file_size?: number;
  file_type?: string;
  status: 'pendiente' | 'recibido' | 'validado' | 'rechazado';
  notes?: string;
  is_required: boolean;
  uploaded_at?: string;
  validated_at?: string;
  requested_by?: string;
  validated_by?: string;
}

interface PostulationDocumentsTabProps {
  applicationId: string;
  applicants: Applicant[];
  guarantors: Guarantor[];
  applicantsDocuments: Record<string, any[]>;
  guarantorsDocuments: Record<string, any[]>;
  onDocumentsChange: () => Promise<void>;
}

// ========================================================================
// CONSTANTS
// ========================================================================

const DOCUMENT_TYPES = {
  // Para postulantes naturales
  'cedula': 'Cédula de Identidad',
  'comprobante_ingresos': 'Comprobante de Ingresos',
  'certificado_dominio': 'Certificado de Dominio',
  'boleta_agua': 'Boleta de Agua',
  'boleta_luz': 'Boleta de Luz',
  'boleta_gas': 'Boleta de Gas',
  'contrato_arriendo': 'Contrato de Arriendo Actual',
  'declaracion_renta': 'Declaración de Renta',
  'certificado_matrimonio': 'Certificado de Matrimonio',

  // Para postulantes jurídicos
  'poder_notarial': 'Poder Notarial',
  'extracto_sociedad': 'Extracto de Sociedad',
  'patente_comercial': 'Patente Comercial',

  // Para avales
  'cedula_aval': 'Cédula de Identidad (Aval)',
  'comprobante_ingresos_aval': 'Comprobante de Ingresos (Aval)',
  'certificado_dominio_aval': 'Certificado de Dominio (Aval)',

  'otro': 'Otro Documento'
} as const;

const DOCUMENT_STATUS = {
  'pendiente': {
    label: 'Pendiente',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock
  },
  'recibido': {
    label: 'Recibido',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: CheckCircle
  },
  'validado': {
    label: 'Validado',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle
  },
  'rechazado': {
    label: 'Rechazado',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle
  }
};

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

const getPersonDisplayName = (person: Applicant | Guarantor): string => {
  return person.display_name || person.first_name || 'Sin nombre';
};

// ========================================================================
// MAIN COMPONENT
// ========================================================================

export const PostulationDocumentsTab: React.FC<PostulationDocumentsTabProps> = ({
  applicationId,
  applicants,
  guarantors,
  applicantsDocuments,
  guarantorsDocuments,
  onDocumentsChange
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [activeUploadTarget, setActiveUploadTarget] = useState<{
    personId?: string;
    personType?: 'applicant' | 'guarantor';
    docType?: string;
    docId?: string;
  } | null>(null);


  // Group documents by person using the props data
  const documentsByPerson = React.useMemo(() => {
    const grouped: Record<string, { person: any; documents: any[]; type: 'applicant' | 'guarantor' }> = {};

    // Add applicants with their documents
    applicants.forEach(applicant => {
      const personKey = `applicant_${applicant.id}`;
      const personName = applicant.display_name || applicant.first_name || 'Sin nombre';
      const personDocs = applicantsDocuments[personName] || [];

      grouped[personKey] = {
        person: applicant,
        documents: personDocs,
        type: 'applicant'
      };
    });

    // Add guarantors with their documents
    guarantors.forEach(guarantor => {
      const personKey = `guarantor_${guarantor.id}`;
      const personName = guarantor.display_name || guarantor.first_name || 'Sin nombre';
      const personDocs = guarantorsDocuments[personName] || [];

      grouped[personKey] = {
        person: guarantor,
        documents: personDocs,
        type: 'guarantor'
      };
    });

    return grouped;
  }, [applicantsDocuments, guarantorsDocuments, applicants, guarantors]);

  // Calculate overall progress
  const progressStats = React.useMemo(() => {
    const allDocs = Object.values(documentsByPerson).flatMap(group => group.documents);
    // For now, assume all documents are required (can be modified based on business logic)
    const requiredDocs = allDocs;
    const uploadedDocs = requiredDocs.filter(doc => doc.file_url && doc.file_url.trim() !== '');

    return {
      total: requiredDocs.length,
      completed: uploadedDocs.length,
      percentage: requiredDocs.length > 0
        ? Math.round((uploadedDocs.length / requiredDocs.length) * 100)
        : 0
    };
  }, [documentsByPerson]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !activeUploadTarget || !applicationId) return;

    const file = files[0];
    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const fileName = `${applicationId}/${activeUploadTarget.personId}/${timestamp}.${fileExt}`;
      const filePath = `application-documents/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Save document record
      const documentData = {
        application_id: applicationId,
        document_name: file.name,
        document_type: activeUploadTarget.docType || 'otro',
        file_url: urlData.publicUrl,
        file_size: file.size,
        file_type: file.type,
        status: 'recibido' as const,
        uploaded_at: new Date().toISOString(),
        is_required: false // Default to not required unless specified
      };

      if (activeUploadTarget.personType === 'applicant') {
        await supabase.from('applicant_documents').insert({
          ...documentData,
          applicant_id: activeUploadTarget.personId
        });
      } else {
        await supabase.from('guarantor_documents').insert({
          ...documentData,
          guarantor_id: activeUploadTarget.personId
        });
      }

      toast.success('Documento subido exitosamente');
      await onDocumentsChange();

    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast.error(error.message || 'Error al subir el documento');
    } finally {
      setUploading(false);
      setActiveUploadTarget(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e.target.files);
  };

  const startUpload = (personId: string, personType: 'applicant' | 'guarantor', docType?: string, docId?: string) => {
    setActiveUploadTarget({ personId, personType, docType, docId });
    setTimeout(() => fileInputRef.current?.click(), 0);
  };

  const downloadDocument = async (fileUrl: string, fileName: string) => {
    try {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Descarga iniciada');
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Error al descargar el documento');
    }
  };


  return (
    <div className="space-y-6">
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileSelect}
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
      />

      {/* Overall Progress */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Progreso General de Documentación</h3>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">
            {progressStats.completed} de {progressStats.total} documentos requeridos cargados
          </span>
          <span className="text-sm font-bold text-blue-600">{progressStats.percentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progressStats.percentage}%` }}
          ></div>
        </div>
      </div>

      {/* Documents by Person */}
      <div className="space-y-6">
        {Object.entries(documentsByPerson).map(([personKey, { person, documents: personDocs, type }]) => {
          const personName = getPersonDisplayName(person);
          const uploadedDocs = personDocs.filter(d => d.status !== 'pendiente' && d.file_url);
          const missingDocs = personDocs.filter(d => d.status === 'pendiente' && !d.file_url);

          return (
            <div key={personKey} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Person Header */}
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      type === 'applicant' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      {type === 'applicant' ? (
                        <User className={`h-5 w-5 ${
                          type === 'applicant' ? 'text-blue-600' : 'text-green-600'
                        }`} />
                      ) : (
                        <Shield className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{personName}</h4>
                      <p className="text-sm text-gray-600">
                        {type === 'applicant' ? 'Postulante' : 'Aval'} • {personDocs.length} documento{personDocs.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {uploadedDocs.length}/{personDocs.length} cargados
                    </div>
                    <div className="text-xs text-gray-500">Documentos</div>
                  </div>
                </div>
              </div>

              {/* Documents List */}
              <div className="divide-y divide-gray-100">
                {/* Uploaded Documents */}
                {uploadedDocs.length > 0 && (
                  <div className="p-6">
                    <h5 className="font-medium text-gray-900 mb-4">Documentos Cargados</h5>
                    <div className="space-y-3">
                      {uploadedDocs.map(doc => (
                        <div key={doc.id || doc.file_name} className="flex items-start justify-between bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-start space-x-3 flex-1">
                            <div className="mt-1 p-1 rounded-full bg-green-100 border border-green-200">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h6 className="font-medium text-gray-900 text-sm">{doc.file_name}</h6>
                              <p className="text-xs text-gray-500 mb-1">
                                {DOCUMENT_TYPES[doc.doc_type as keyof typeof DOCUMENT_TYPES] || doc.doc_type}
                              </p>
                              <div className="flex items-center space-x-2">
                                <span className="inline-flex px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">
                                  Cargado
                                </span>
                                {doc.uploaded_at && (
                                  <span className="text-xs text-gray-400">
                                    {new Date(doc.uploaded_at).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                              {doc.notes && (
                                <div className="mt-2 p-2 bg-blue-50 text-blue-700 text-xs rounded border border-blue-100">
                                  {doc.notes}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {doc.file_url && (
                              <button
                                onClick={() => downloadDocument(doc.file_url, doc.file_name)}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Descargar"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => startUpload(person.id, type, doc.doc_type, doc.id)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Reemplazar"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing Documents */}
                {missingDocs.length > 0 && (
                  <div className="p-6 bg-orange-50 border-t border-orange-100">
                    <h5 className="font-medium text-orange-900 mb-4">Documentos Faltantes</h5>
                    <div className="space-y-3">
                      {missingDocs.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between bg-white p-4 rounded-lg border border-orange-200">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                              <AlertTriangle className="w-4 h-4 text-orange-600" />
                            </div>
                            <div>
                              <h6 className="font-medium text-gray-900 text-sm">
                                {DOCUMENT_TYPES[doc.document_type as keyof typeof DOCUMENT_TYPES] || doc.document_type}
                              </h6>
                              {doc.notes && (
                                <p className="text-xs text-gray-600 mt-1">{doc.notes}</p>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => startUpload(person.id, type, doc.document_type, doc.id)}
                            disabled={uploading}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                          >
                            <Upload className="w-4 h-4" />
                            <span>{uploading ? 'Subiendo...' : 'Cargar'}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Generic Upload */}
                <div className="p-6 bg-gray-50 border-t border-gray-100">
                  <button
                    onClick={() => startUpload(person.id, type)}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Cargar otro documento</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {Object.keys(documentsByPerson).length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay personas registradas</h3>
          <p className="text-gray-500">Los documentos aparecerán aquí cuando se registren postulantes y avales.</p>
        </div>
      )}
    </div>
  );
};
