import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

export interface DocumentData {
  id: string;
  applicant_id: string;      // Postulante o Aval
  applicant_type: 'postulant' | 'guarantor';
  applicant_name?: string;
  document_type: string;      // 'cedula', 'dicom', 'liquidaciones', etc.
  document_label: string;     // "Cédula de Identidad", etc.
  file_name: string;
  file_path: string;
  uploaded_at: string;
  status: 'uploaded' | 'verified' | 'rejected';
  rejection_reason?: string;
  mime_type?: string;
  file_size?: number;
}

export interface PostulantData {
  id: string;
  name?: string;
  first_name?: string; // Sometimes APIs return first_name
  last_name?: string;
  email?: string;
}

export interface GuarantorData {
  id: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

interface ApplicantData {
  id: string;
  name: string;
  last_name?: string;
  type: 'postulant' | 'guarantor';
  sequence?: number;  // Postulante 1, 2, etc.
}

interface DocumentType {
  id: string;
  label: string;
  type: string;
}

interface Props {
  applicationId: string;
  postulants: PostulantData[];
  guarantors: GuarantorData[];
  documents: DocumentData[];
  onDocumentUploaded?: (applicantId: string, documentType: string) => void;
}

export const ApplicationDocumentsPanel: React.FC<Props> = ({
  applicationId,
  postulants,
  guarantors,
  documents: initialDocuments,
  onDocumentUploaded,
}) => {
  // Normalize postulants and guarantors to ApplicantData
  const applicants: ApplicantData[] = [
    ...postulants.map((p, i) => ({
      id: p.id,
      name: p.name || p.first_name || 'Postulante',
      last_name: p.last_name,
      type: 'postulant' as const,
      sequence: i + 1,
    })),
    ...guarantors.map((g, i) => ({
      id: g.id,
      name: g.name || g.first_name || 'Aval',
      last_name: g.last_name,
      type: 'guarantor' as const,
      sequence: i + 1,
    })),
  ];

  const [activeSection, setActiveSection] = useState<string>(
    applicants.length > 0 ? applicants[0].id : ''
  );
  const [documents, setDocuments] = useState<DocumentData[]>(initialDocuments);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Documents required configuration
  const REQUIRED_DOCUMENTS: Record<string, DocumentType[]> = {
    postulant: [
      { id: 'cedula', label: 'Cédula de Identidad', type: 'cedula' },
      { id: 'dicom', label: 'Informe Comercial (DICOM 360)', type: 'dicom' },
      { id: 'liquidaciones', label: 'Últimas 3 Liquidaciones de Sueldo', type: 'liquidaciones' },
      { id: 'contrato', label: 'Contrato de Trabajo Vigente', type: 'contrato' },
      { id: 'antiguedad', label: 'Certificado de Antigüedad Laboral', type: 'antiguedad' },
      { id: 'cotizaciones', label: 'Certificado de Cotizaciones Previsionales (AFP)', type: 'cotizaciones' },
      { id: 'comprobante_domicilio', label: 'Comprobante de Domicilio', type: 'comprobante_domicilio' },
    ],
    guarantor: [
      { id: 'cedula', label: 'Cédula de Identidad', type: 'cedula' },
      { id: 'dicom', label: 'Informe Comercial (DICOM 360)', type: 'dicom' },
      { id: 'liquidaciones', label: 'Últimas 3 Liquidaciones de Sueldo', type: 'liquidaciones' },
      { id: 'comprobante_domicilio', label: 'Comprobante de Domicilio', type: 'comprobante_domicilio' },
    ],
  };

  const getApplicantDocuments = (applicantId: string) => {
    return documents.filter(doc => doc.applicant_id === applicantId);
  };

  const getRequiredDocuments = (type: 'postulant' | 'guarantor') => {
    return REQUIRED_DOCUMENTS[type] || [];
  };

  const createDocumentFileName = (
    applicant: { name: string; last_name?: string },
    documentLabel: string,
    originalFileName: string
  ) => {
    const timestamp = new Date().getTime();
    const cleanName = `${applicant.name}_${applicant.last_name || ''}`.replace(/[^a-zA-Z0-9]/g, '_');
    const cleanLabel = documentLabel.replace(/[^a-zA-Z0-9]/g, '_');
    const extension = originalFileName.split('.').pop();
    return `${cleanName}_${cleanLabel}_${timestamp}.${extension}`;
  };

  const handleDocumentUpload = async (
    applicantId: string,
    documentType: string,
    documentLabel: string,
    file: File
  ) => {
    setUploading(`${applicantId}_${documentType}`);
    setError(null);

    try {
      const applicant = applicants.find(a => a.id === applicantId);
      if (!applicant) throw new Error('Postulante no encontrado');

      const renamedFileName = createDocumentFileName(
        applicant,
        documentLabel,
        file.name
      );

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('application_documents')
        .upload(
          `${applicationId}/${applicantId}/${renamedFileName}`,
          file,
          { upsert: true }
        );

      if (uploadError) throw uploadError;

      // Insert into database
      const { data: docData, error: dbError } = await supabase
        .from('application_documents')
        .insert({
          application_id: applicationId,
          applicant_id: applicantId,
          applicant_type: applicant.type,
          document_type: documentType,
          document_label: documentLabel,
          file_name: renamedFileName,
          file_path: uploadData.path,
          original_file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: user?.id,
          status: 'uploaded',
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setDocuments(prev => [...prev, docData]);
      if (onDocumentUploaded) {
        onDocumentUploaded(applicantId, documentType);
      }
    } catch (err: any) {
      console.error('Error uploading document:', err);
      setError(`Error al cargar ${documentLabel}: ${err.message || 'Error desconocido'}`);
    } finally {
      setUploading(null);
    }
  };

  const handleDocumentDelete = async (documentId: string, filePath: string) => {
    if (!confirm('¿Estás seguro de eliminar este documento?')) return;
    
    try {
      // Delete from storage
      const { error: storageError } = await supabase
        .storage
        .from('application_documents')
        .remove([filePath]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
        // Continue to delete from DB even if storage fails (orphan cleanup usually needed but good for UX)
      }

      // Delete from DB
      const { error: dbError } = await supabase
        .from('application_documents')
        .delete()
        .eq('id', documentId);

      if (dbError) throw dbError;

      setDocuments(prev => prev.filter(d => d.id !== documentId));
      setError(null);
    } catch (err: any) {
      console.error('Error deleting document:', err);
      setError(`Error al eliminar documento: ${err.message || 'Error desconocido'}`);
    }
  };

  const handleStatusChange = async (
    documentId: string,
    newStatus: 'uploaded' | 'verified' | 'rejected',
    rejectionReason?: string
  ) => {
    try {
      const updateData: any = { status: newStatus };
      if (rejectionReason !== undefined) {
        updateData.rejection_reason = rejectionReason;
      }

      const { error } = await supabase
        .from('application_documents')
        .update(updateData)
        .eq('id', documentId);

      if (error) throw error;

      setDocuments(prev =>
        prev.map(d =>
          d.id === documentId
            ? { ...d, ...updateData }
            : d
        )
      );
    } catch (err: any) {
      console.error('Error updating status:', err);
      setError(`Error al cambiar estado: ${err.message || 'Error desconocido'}`);
    }
  };

  const handleDownload = async (filePath: string, fileName: string) => {
      try {
        const { data, error } = await supabase.storage
          .from('application_documents')
          .download(filePath);
        
        if (error) throw error;

        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (err: any) {
        console.error('Download error:', err);
        setError(`Error al descargar: ${err.message}`);
      }
  };

  const activeApplicant = applicants.find(a => a.id === activeSection);

  if (!activeApplicant && applicants.length > 0) {
    // Fallback if selection is invalid
    return <div>Seleccione un postulante</div>;
  }
  
  if (applicants.length === 0) {
      return <div className="p-4 text-center text-gray-500">No hay postulantes ni avales registrados.</div>;
  }

  const applicantDocs = getApplicantDocuments(activeApplicant!.id);
  const requiredDocs = getRequiredDocuments(activeApplicant!.type);

  // Separate uploaded vs missing
  // We can have multiple docs for same type? Usually yes, e.g. multiple pay stubs.
  // But for tracking "Missing", we need to check if AT LEAST ONE exists for required types.
  
  const uploadedDocTypes = new Set(applicantDocs.map(d => d.document_type));
  
  const missingRequiredDocs = requiredDocs.filter(req => !uploadedDocTypes.has(req.type));

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6 flex items-center">
        <span className="mr-2">📄</span> Gestión de Documentos
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* Tabs for Applicants */}
      <div className="flex flex-wrap gap-2 mb-6 border-b pb-2">
        {applicants.map(app => (
          <button
            key={app.id}
            onClick={() => setActiveSection(app.id)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              activeSection === app.id
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {app.type === 'postulant' ? '📋' : '🔒'} {app.name} {app.last_name}
            <span className="ml-2 text-xs opacity-75 bg-gray-200 px-1.5 py-0.5 rounded-full">
              {app.type === 'postulant' ? 'Postulante' : 'Aval'}
            </span>
          </button>
        ))}
      </div>

      {activeApplicant && (
        <div className="space-y-8">
          {/* Header of Section */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              Documentos de {activeApplicant.name} {activeApplicant.last_name}
            </h3>
            <span className="text-sm text-gray-500">
              {applicantDocs.length} documentos cargados
            </span>
          </div>

          {/* Uploaded Documents List */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">
              Documentos Cargados
            </h4>
            
            {applicantDocs.length === 0 ? (
              <p className="text-gray-500 italic text-sm">No hay documentos cargados aún.</p>
            ) : (
              <div className="grid gap-3">
                {applicantDocs.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className={`p-2 rounded-lg ${
                        doc.status === 'verified' ? 'bg-green-100 text-green-600' :
                        doc.status === 'rejected' ? 'bg-red-100 text-red-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                         </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{doc.document_label}</p>
                        <p className="text-xs text-gray-500">{doc.file_name}</p>
                        {doc.status === 'rejected' && doc.rejection_reason && (
                           <p className="text-xs text-red-600 mt-1">Rechazado: {doc.rejection_reason}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                       {/* Status Actions */}
                       <select
                         value={doc.status}
                         onChange={(e) => {
                             if (e.target.value === 'rejected') {
                                 const reason = prompt('Motivo del rechazo:');
                                 if (reason) handleStatusChange(doc.id, 'rejected', reason);
                             } else {
                                 handleStatusChange(doc.id, e.target.value as any);
                             }
                         }}
                         className={`text-xs rounded-full px-2 py-1 border-0 cursor-pointer focus:ring-2 focus:ring-offset-1 ${
                            doc.status === 'verified' ? 'bg-green-100 text-green-800 focus:ring-green-500' :
                            doc.status === 'rejected' ? 'bg-red-100 text-red-800 focus:ring-red-500' :
                            'bg-blue-100 text-blue-800 focus:ring-blue-500'
                         }`}
                       >
                           <option value="uploaded">Subido</option>
                           <option value="verified">Verificado</option>
                           <option value="rejected">Rechazado</option>
                       </select>

                       <button
                         onClick={() => handleDownload(doc.file_path, doc.original_file_name || doc.file_name)}
                         className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                         title="Descargar"
                       >
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                         </svg>
                       </button>

                       <button
                         onClick={() => handleDocumentDelete(doc.id, doc.file_path)}
                         className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                         title="Eliminar"
                       >
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                         </svg>
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Missing Documents List */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">
              Documentos Requeridos / Faltantes
            </h4>
            
            <div className="grid gap-3">
              {requiredDocs.map(req => {
                 const isUploaded = uploadedDocTypes.has(req.type);
                 return (
                    <div key={req.id} className={`flex items-center justify-between p-3 rounded-lg border border-dashed transition-colors ${
                        isUploaded ? 'bg-gray-50 border-gray-200 opacity-50' : 'bg-white border-gray-300'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                            isUploaded ? 'border-green-500 text-green-500' : 'border-gray-300 text-transparent'
                        }`}>
                           {isUploaded && <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                        </div>
                        <span className={`text-sm ${isUploaded ? 'text-gray-500' : 'text-gray-900 font-medium'}`}>
                            {req.label}
                        </span>
                      </div>

                      <div>
                          <input
                            type="file"
                            id={`file-${req.id}-${activeApplicant.id}`}
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleDocumentUpload(activeApplicant.id, req.type, req.label, file);
                                e.target.value = ''; // Reset
                            }}
                            disabled={!!uploading}
                          />
                          <label
                            htmlFor={`file-${req.id}-${activeApplicant.id}`}
                            className={`px-3 py-1.5 text-xs font-medium rounded cursor-pointer flex items-center transition-colors ${
                                uploading === `${activeApplicant.id}_${req.type}`
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                            }`}
                          >
                             {uploading === `${activeApplicant.id}_${req.type}` ? (
                                 <>
                                   <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                   </svg>
                                   Subiendo...
                                 </>
                             ) : (
                                 <>
                                   <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                   </svg>
                                   Subir
                                 </>
                             )}
                          </label>
                      </div>
                    </div>
                 );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationDocumentsPanel;

