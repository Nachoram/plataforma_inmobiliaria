/**
 * useDocumentManagement.ts - Custom hook para manejar la gestión de documentos
 *
 * Extraído de PostulationAdminPanel para centralizar toda la lógica de documentos
 * y facilitar testing y reutilización.
 */

import { useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface DocumentItem {
  id: string;
  application_id: string;
  entity_type: string;
  document_type: string;
  file_name: string;
  file_url: string;
  storage_path: string;
  uploaded_at: string;
  first_name?: string;
  paternal_last_name?: string;
  maternal_last_name?: string;
  company_name?: string;
  notes?: string;
}

interface UseDocumentManagementResult {
  // Estados
  documentsLoading: boolean;
  applicantsDocuments: Record<string, DocumentItem[]>;
  guarantorsDocuments: Record<string, DocumentItem[]>;

  // Setters
  setApplicantsDocuments: (docs: Record<string, DocumentItem[]>) => void;
  setGuarantorsDocuments: (docs: Record<string, DocumentItem[]>) => void;

  // Acciones
  loadDocuments: () => Promise<void>;
  loadApplicantsDocuments: () => Promise<void>;
  loadGuarantorsDocuments: () => Promise<void>;
  downloadDocument: (document: DocumentItem) => Promise<void>;
  deleteDocument: (documentId: string, entityType: 'applicant' | 'guarantor') => Promise<void>;
}

export const useDocumentManagement = (
  applicationId: string | undefined
): UseDocumentManagementResult => {
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [applicantsDocuments, setApplicantsDocuments] = useState<Record<string, DocumentItem[]>>({});
  const [guarantorsDocuments, setGuarantorsDocuments] = useState<Record<string, DocumentItem[]>>({});

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
      const docsByApplicant: Record<string, DocumentItem[]> = {};
      if (docs) {
        docs.forEach(doc => {
          const applicant = doc.application_applicants;
          const applicantKey = applicant.entity_type === 'natural'
            ? `${applicant.first_name} ${applicant.paternal_last_name} ${applicant.maternal_last_name}`.trim()
            : applicant.company_name;

          // Crear un objeto documento plano con la información necesaria
          const documentItem: DocumentItem = {
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
      const docsByGuarantor: Record<string, DocumentItem[]> = {};
      if (docs) {
        docs.forEach(doc => {
          const guarantor = doc.application_guarantors;
          const guarantorKey = guarantor.entity_type === 'natural'
            ? `${guarantor.first_name} ${guarantor.paternal_last_name} ${guarantor.maternal_last_name}`.trim()
            : guarantor.company_name;

          // Crear un objeto documento plano con la información necesaria
          const documentItem: DocumentItem = {
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
   * Carga todos los documentos (postulantes y garantores)
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

  /**
   * Descarga un documento individual
   */
  const downloadDocument = async (document: DocumentItem) => {
    try {
      if (!document.file_url) {
        toast.error('URL del documento no disponible');
        return;
      }

      // Crear un enlace temporal para descargar
      const link = document.createElement('a');
      link.href = document.file_url;
      link.download = document.file_name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Descargando ${document.file_name}`);
    } catch (error) {
      console.error('Error descargando documento:', error);
      toast.error('Error al descargar el documento');
    }
  };

  /**
   * Elimina un documento
   */
  const deleteDocument = async (documentId: string, entityType: 'applicant' | 'guarantor') => {
    try {
      const tableName = entityType === 'applicant' ? 'applicant_documents' : 'guarantor_documents';

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', documentId);

      if (error) {
        console.error('Error eliminando documento:', error);
        toast.error('Error al eliminar el documento');
        return;
      }

      // Recargar documentos después de eliminar
      await loadDocuments();
      toast.success('Documento eliminado exitosamente');
    } catch (error) {
      console.error('Error eliminando documento:', error);
      toast.error('Error al eliminar el documento');
    }
  };

  return {
    // Estados
    documentsLoading,
    applicantsDocuments,
    guarantorsDocuments,

    // Setters
    setApplicantsDocuments,
    setGuarantorsDocuments,

    // Acciones
    loadDocuments,
    loadApplicantsDocuments,
    loadGuarantorsDocuments,
    downloadDocument,
    deleteDocument
  };
};
