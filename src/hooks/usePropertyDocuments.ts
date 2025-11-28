import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface PropertyDocument {
  id: string;
  property_id: string;
  doc_type: string;
  file_name: string | null;
  file_url: string;
  storage_path: string | null;
  file_size_bytes: number | null;
  mime_type: string | null;
  uploaded_by: string | null;
  uploaded_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface PropertyDocumentsState {
  documents: PropertyDocument[];
  isLoading: boolean;
  error: string | null;
}

export const usePropertyDocuments = (propertyId: string) => {
  const [state, setState] = useState<PropertyDocumentsState>({
    documents: [],
    isLoading: true,
    error: null
  });

  const loadPropertyDocuments = useCallback(async () => {
    if (!propertyId) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { data, error } = await supabase
        .from('property_sale_documents')
        .select('*')
        .eq('property_id', propertyId)
        .order('uploaded_at', { ascending: false });

      if (error) {
        // Si la tabla no existe aún, continuar sin error
        console.warn('Tabla property_sale_documents no encontrada:', error.message);
        setState({
          documents: [],
          isLoading: false,
          error: null
        });
        return;
      }

      setState({
        documents: data || [],
        isLoading: false,
        error: null
      });

    } catch (error: any) {
      console.error('Error loading property documents:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Error cargando documentos de la propiedad'
      }));
    }
  }, [propertyId]);

  useEffect(() => {
    loadPropertyDocuments();
  }, [loadPropertyDocuments]);

  return {
    ...state,
    refetch: loadPropertyDocuments
  };
};

// Función helper para obtener el nombre legible del tipo de documento
export const getPropertyDocumentTypeLabel = (docType: string): string => {
  const labels: Record<string, string> = {
    'dominio_vigente': 'Certificado de Dominio Vigente',
    'hipotecas_gravamenes': 'Certificado de Hipotecas y Gravámenes',
    'cadena_titulos': 'Cadena de Títulos',
    'avaluo_fiscal': 'Avalúo Fiscal',
    'deuda_contribuciones': 'Certificado de Deuda de Contribuciones',
    'no_expropiacion_municipal': 'Certificado de No Expropiación Municipal',
    'interdicciones_litigios': 'Certificado de Interdicciones y Litigios',
    'escritura_compraventa': 'Escritura de Compraventa',
    'planos_propiedad': 'Planos de la Propiedad',
    'reglamento_copropiedad': 'Reglamento de Copropiedad',
    'gastos_comunes': 'Certificado de Gastos Comunes',
    'cert_numero_municipal': 'Certificado de Número Municipal',
    'cert_estado_civil': 'Certificado de Estado Civil',
    'cedula_identidad_vendedor': 'Cédula de Identidad del Vendedor'
  };

  return labels[docType] || docType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export default usePropertyDocuments;



