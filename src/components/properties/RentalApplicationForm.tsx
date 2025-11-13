import React, { useState, useEffect } from 'react';
import { X, Send, User, AlertCircle, ExternalLink, Building, FileText, MessageSquarePlus, CheckCircle, Home, Plus, Minus, Building2, Users, UserCheck, Upload, Paperclip, Trash2 } from 'lucide-react';
import { supabase, Property, Profile, formatPriceCLP, CHILE_REGIONS, MARITAL_STATUS_OPTIONS, FILE_SIZE_LIMITS, getCurrentProfile, getPropertyTypeInfo } from '../../lib/supabase';
import { webhookClient } from '../../lib/webhook';

interface RentalApplicationFormProps {
  property: Property;
  onSuccess?: () => void;
  onCancel?: () => void;
  editMode?: boolean;
  existingApplicationId?: string;
}

// Tipos para entidades
type EntityType = 'natural' | 'juridica';
type ConstitutionType = 'empresa_en_un_dia' | 'tradicional';
type WorkerType = 'dependiente' | 'independiente';

// Interface para documentos del postulante
interface ApplicantDocument {
  type: string;
  label: string;
  file?: File;
  url?: string;
  required: boolean;
}

// Interface para documentos del aval
interface GuarantorDocument {
  type: string;
  label: string;
  file?: File;
  url?: string;
  required: boolean;
}

// Interface para datos de postulante
interface ApplicantData {
  id?: string; // Para identificar slots únicos
  entityType: EntityType;
  workerType?: WorkerType; // Solo para personas naturales

  // Campos comunes
  first_name: string;
  paternal_last_name?: string;
  maternal_last_name?: string;
  rut: string;
  profession?: string;
  monthly_income_clp: string;
  unit_type?: 'Casa' | 'Departamento' | 'Oficina';
  age?: string;
  nationality: string;
  marital_status?: 'soltero' | 'casado' | 'divorciado' | 'viudo';
  address_street: string;
  address_number: string;
  address_department?: string;
  address_commune: string;
  address_region: string;
  phone?: string;
  email?: string;

  // Campos específicos para personas jurídicas
  company_name?: string;
  company_rut?: string;
  legal_representative_first_name?: string;
  legal_representative_paternal_last_name?: string;
  legal_representative_maternal_last_name?: string;
  legal_representative_rut?: string;
  constitution_type?: ConstitutionType;
  constitution_date?: string;
  constitution_cve?: string;
  constitution_notary?: string;
  repertory_number?: string;

  // Documentos del postulante
  documents?: ApplicantDocument[];
}

// Interface para datos de aval
interface GuarantorData {
  id?: string; // Para identificar slots únicos
  entityType: EntityType;
  workerType?: WorkerType; // Solo para personas naturales

  // Campos comunes
  first_name?: string;
  paternal_last_name?: string;
  maternal_last_name?: string;
  rut: string;
  profession?: string;
  monthly_income_clp?: string;
  unit_type?: 'Casa' | 'Departamento' | 'Oficina';
  contact_email?: string;
  address_street?: string;
  address_number?: string;
  address_department?: string;
  address_commune?: string;
  address_region?: string;

  // Campos específicos para personas jurídicas
  company_name?: string;
  company_rut?: string;
  legal_representative_first_name?: string;
  legal_representative_paternal_last_name?: string;
  legal_representative_maternal_last_name?: string;
  legal_representative_rut?: string;
  constitution_type?: ConstitutionType;
  constitution_date?: string;
  constitution_cve?: string;
  constitution_notary?: string;
  repertory_number?: string;

  // Documentos del aval
  documents?: GuarantorDocument[];
}

const RentalApplicationForm: React.FC<RentalApplicationFormProps> = ({
  property,
  onSuccess,
  onCancel,
  editMode = false,
  existingApplicationId
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [editLoading, setEditLoading] = useState(editMode);

  // Estado para el mensaje de la postulación
  const [applicationMessage, setApplicationMessage] = useState('');

  // Cargar datos existentes en modo edición
  useEffect(() => {
    if (editMode && existingApplicationId) {
      loadExistingApplication();
    }
  }, [editMode, existingApplicationId]);

  const loadExistingApplication = async () => {
    if (!existingApplicationId) return;

    try {
      setEditLoading(true);

      // Cargar la postulación con todos los datos relacionados
      const { data: application, error } = await supabase
        .from('applications')
        .select(`
          *,
          application_applicants (*),
          application_guarantors (*)
        `)
        .eq('id', existingApplicationId)
        .single();

      if (error) throw error;

      if (application) {
        // Cargar mensaje
        setApplicationMessage(application.message || '');

        // Cargar postulantes
        if (application.application_applicants && application.application_applicants.length > 0) {
          const loadedApplicants = application.application_applicants.map((applicant: any, index: number) => ({
            id: `applicant-${index + 1}`,
            entityType: applicant.entity_type || 'natural',
            first_name: applicant.first_name || '',
            paternal_last_name: applicant.paternal_last_name || '',
            maternal_last_name: applicant.maternal_last_name || '',
            rut: applicant.rut || '',
            profession: applicant.profession || '',
            monthly_income_clp: applicant.monthly_income_clp?.toString() || '',
            unit_type: applicant.unit_type || 'Casa',
            age: applicant.age?.toString() || '',
            nationality: applicant.nationality || 'Chile',
            marital_status: applicant.marital_status,
            address_street: applicant.address_street || '',
            address_number: applicant.address_number || '',
            address_department: applicant.address_department || '',
            address_commune: applicant.address_commune || '',
            address_region: applicant.address_region || '',
            phone: applicant.phone || '',
            email: applicant.email || '',
            company_name: applicant.company_name || '',
            company_rut: applicant.company_rut || '',
            legal_representative_first_name: '',
            legal_representative_paternal_last_name: '',
            legal_representative_maternal_last_name: applicant.legal_representative_name || '',
            legal_representative_rut: applicant.legal_representative_rut || '',
            constitution_type: applicant.constitution_type,
            constitution_date: applicant.constitution_date || '',
            constitution_cve: applicant.constitution_cve || '',
            constitution_notary: applicant.constitution_notary || '',
            repertory_number: applicant.repertory_number || ''
          }));

          // Si hay más postulantes que el estado inicial, agregar slots
          while (loadedApplicants.length > applicants.length) {
            setApplicants(prev => [...prev, {
              id: `applicant-${prev.length + 1}`,
              entityType: 'natural',
              first_name: '',
              paternal_last_name: '',
              maternal_last_name: '',
              rut: '',
              profession: '',
              monthly_income_clp: '',
              unit_type: 'Casa',
              age: '',
              nationality: 'Chile',
              marital_status: 'soltero',
              address_street: '',
              address_number: '',
              address_department: '',
              address_commune: '',
              address_region: '',
              phone: '',
              email: '',
              company_name: '',
              company_rut: '',
              legal_representative_first_name: '',
              legal_representative_paternal_last_name: '',
              legal_representative_maternal_last_name: '',
              legal_representative_rut: '',
              constitution_type: 'tradicional',
              constitution_date: '',
              constitution_cve: '',
              constitution_notary: '',
              repertory_number: ''
            }]);
          }

          setApplicants(loadedApplicants);
        }

        // Cargar avaladores
        if (application.application_guarantors && application.application_guarantors.length > 0) {
          const loadedGuarantors = application.application_guarantors.map((guarantor: any, index: number) => ({
            id: `guarantor-${index + 1}`,
            entityType: guarantor.entity_type || 'natural',
            first_name: guarantor.first_name || '',
            paternal_last_name: guarantor.paternal_last_name || '',
            maternal_last_name: guarantor.maternal_last_name || '',
            rut: guarantor.rut || '',
            profession: guarantor.profession || '',
            monthly_income_clp: guarantor.monthly_income?.toString() || '',
            unit_type: guarantor.unit_type || 'Casa',
            contact_email: guarantor.contact_email || '',
            address_street: guarantor.address_street || '',
            address_number: guarantor.address_number || '',
            address_department: guarantor.address_department || '',
            address_commune: guarantor.address_commune || '',
            address_region: guarantor.address_region || '',
            company_name: guarantor.company_name || '',
            company_rut: guarantor.company_rut || '',
            legal_representative_first_name: '',
            legal_representative_paternal_last_name: '',
            legal_representative_maternal_last_name: guarantor.legal_representative_name || '',
            legal_representative_rut: guarantor.legal_representative_rut || '',
            constitution_type: guarantor.constitution_type,
            constitution_date: guarantor.constitution_date || '',
            constitution_cve: guarantor.constitution_cve || '',
            constitution_notary: guarantor.constitution_notary || '',
            repertory_number: guarantor.repertory_number || ''
          }));

          setGuarantors(loadedGuarantors);
        }
      }
    } catch (error) {
      console.error('Error loading existing application:', error);
      setError('Error al cargar los datos de la postulación para editar');
    } finally {
      setEditLoading(false);
    }
  };

  // Estado para postulantes múltiples (máximo 3)
  const [applicants, setApplicants] = useState<ApplicantData[]>([
    {
      id: 'applicant-1',
      entityType: 'natural',
      workerType: 'dependiente', // Default to dependiente
      first_name: '',
      paternal_last_name: '',
      maternal_last_name: '',
      rut: '',
      profession: '',
      monthly_income_clp: '',
      net_monthly_income_clp: '',
      unit_type: 'Casa',
      age: '',
      nationality: 'Chilena',
      marital_status: 'soltero',
      address_street: '',
      address_number: '',
      address_department: '',
      address_commune: '',
      address_region: '',
      phone: '',
      email: '',
      // Initialize juridica fields with empty strings to prevent controlled/uncontrolled switching
      company_name: '',
      company_rut: '',
      legal_representative_first_name: '',
      legal_representative_paternal_last_name: '',
      legal_representative_maternal_last_name: '',
      legal_representative_rut: '',
      constitution_type: undefined,
      constitution_date: '',
      constitution_cve: '',
      constitution_notary: '',
      repertory_number: '',
      documents: [],
    }
  ]);

  // Estado para avales múltiples (máximo 3)
  const [guarantors, setGuarantors] = useState<GuarantorData[]>([]);

  // Estados para trabajadores independientes (uno por postulante/aval)
  const [independentWorkers, setIndependentWorkers] = useState<{[key: string]: boolean}>({});
  const [guarantorIndependentWorkers, setGuarantorIndependentWorkers] = useState<{[key: string]: boolean}>({});

  // Estados para validación en tiempo real
  const [validationErrors, setValidationErrors] = useState<{
    applicants: {[key: string]: string[]};
    guarantors: {[key: string]: string[]};
    general: string[];
  }>({
    applicants: {},
    guarantors: {},
    general: []
  });

  // Estados para archivos
  const [files, setFiles] = useState<{
    [key: string]: {
      rut?: File;
      salaryReceipts?: File[];
      salarySettlement?: File;
      savingsAccount?: File;
      companyRut?: File;
      constitutionCertificate?: File;
      legalRepresentativeRut?: File;
      rentReceipts?: File[];
      propertyDeed?: File;
      incomeTaxReturn?: File;
    };
  }>({});

  // Usar constantes compartidas
  const regions = CHILE_REGIONS;

  // Funciones para manejar postulantes múltiples
  const addApplicant = () => {
    if (applicants.length < 3) {
      // Generate unique ID by finding the highest existing applicant number
      const existingIds = applicants
        .map(a => a.id)
        .filter(id => id && id.startsWith('applicant-'))
        .map(id => parseInt(id.replace('applicant-', '')))
        .filter(num => !isNaN(num));

      const maxNumber = existingIds.length > 0 ? Math.max(...existingIds) : 0;
      const newId = `applicant-${maxNumber + 1}`;

      setApplicants(prev => [...prev, {
        id: newId,
        entityType: 'natural',
        workerType: 'dependiente', // Default to dependiente
        first_name: '',
        paternal_last_name: '',
        maternal_last_name: '',
        rut: '',
        profession: '',
        monthly_income_clp: '',
        net_monthly_income_clp: '',
        unit_type: 'Casa',
        age: '',
        nationality: 'Chilena',
        marital_status: 'soltero',
        address_street: '',
        address_number: '',
        address_department: '',
        address_commune: '',
        address_region: '',
        phone: '',
        email: '',
        // Initialize juridica fields with empty strings to prevent controlled/uncontrolled switching
        company_name: '',
        company_rut: '',
        legal_representative_first_name: '',
        legal_representative_paternal_last_name: '',
        legal_representative_maternal_last_name: '',
        legal_representative_rut: '',
        constitution_type: undefined,
        constitution_date: '',
        constitution_cve: '',
        constitution_notary: '',
        repertory_number: '',
        documents: [],
      }]);
    }
  };

  const removeApplicant = (index: number) => {
    if (applicants.length > 1) {
      setApplicants(prev => prev.filter((_, i) => i !== index));
      // También remover estado de trabajador independiente si existe
      const applicantId = applicants[index].id;
      if (applicantId) {
        setIndependentWorkers(prev => {
          const newState = { ...prev };
          delete newState[applicantId];
          return newState;
        });
      }
    }
  };

  const updateApplicant = (index: number, field: string, value: any) => {
    setApplicants(prev => prev.map((applicant, i) => {
      if (i === index) {
        const updatedApplicant = { ...applicant, [field]: value };

        // Handle entity type switching - initialize/clear relevant fields
        if (field === 'entityType') {
          if (value === 'natural') {
            // Clear juridica-specific fields
            updatedApplicant.company_name = '';
            updatedApplicant.company_rut = '';
            updatedApplicant.legal_representative_first_name = '';
            updatedApplicant.legal_representative_paternal_last_name = '';
            updatedApplicant.legal_representative_maternal_last_name = '';
            updatedApplicant.legal_representative_rut = '';
            updatedApplicant.net_monthly_income_clp = '';
            updatedApplicant.constitution_type = undefined;
            updatedApplicant.constitution_date = '';
            updatedApplicant.constitution_cve = '';
            updatedApplicant.constitution_notary = '';
            updatedApplicant.repertory_number = '';
          } else if (value === 'juridica') {
            // Initialize juridica-specific fields
            updatedApplicant.company_name = updatedApplicant.company_name || '';
            updatedApplicant.company_rut = updatedApplicant.company_rut || '';
            updatedApplicant.legal_representative_first_name = updatedApplicant.legal_representative_first_name || '';
            updatedApplicant.legal_representative_paternal_last_name = updatedApplicant.legal_representative_paternal_last_name || '';
            updatedApplicant.legal_representative_maternal_last_name = updatedApplicant.legal_representative_maternal_last_name || '';
            updatedApplicant.legal_representative_rut = updatedApplicant.legal_representative_rut || '';
            updatedApplicant.net_monthly_income_clp = updatedApplicant.net_monthly_income_clp || '';
            updatedApplicant.constitution_type = updatedApplicant.constitution_type || undefined;
            updatedApplicant.constitution_date = updatedApplicant.constitution_date || '';
            updatedApplicant.constitution_cve = updatedApplicant.constitution_cve || '';
            updatedApplicant.constitution_notary = updatedApplicant.constitution_notary || '';
            updatedApplicant.repertory_number = updatedApplicant.repertory_number || '';
          }
        }

        return updatedApplicant;
      }
      return applicant;
    }));
  };

  // Funciones para manejar avales múltiples
  const addGuarantor = () => {
    if (guarantors.length < 3) {
      const newId = `guarantor-${guarantors.length + 1}`;
      setGuarantors(prev => [...prev, {
        id: newId,
        entityType: 'natural',
        workerType: 'dependiente', // Default to dependiente
        rut: '',
        profession: '',
        monthly_income_clp: '',
        net_monthly_income_clp: '',
        unit_type: 'Casa',
        contact_email: '',
        address_street: '',
        address_number: '',
        address_department: '',
        address_commune: '',
        address_region: '',
        // Initialize juridica fields with empty strings to prevent controlled/uncontrolled switching
        company_name: '',
        company_rut: '',
        legal_representative_first_name: '',
        legal_representative_paternal_last_name: '',
        legal_representative_maternal_last_name: '',
        legal_representative_rut: '',
        constitution_type: undefined,
        constitution_date: '',
        constitution_cve: '',
        constitution_notary: '',
        repertory_number: '',
        documents: [],
      }]);
    }
  };

  const removeGuarantor = (index: number) => {
    setGuarantors(prev => prev.filter((_, i) => i !== index));
    // También remover estado de trabajador independiente si existe
    const guarantorId = guarantors[index].id;
    if (guarantorId) {
      setGuarantorIndependentWorkers(prev => {
        const newState = { ...prev };
        delete newState[guarantorId];
        return newState;
      });
    }
  };

  const updateGuarantor = (index: number, field: string, value: any) => {
    setGuarantors(prev => prev.map((guarantor, i) => {
      if (i === index) {
        const updatedGuarantor = { ...guarantor, [field]: value };

        // Handle entity type switching - initialize/clear relevant fields
        if (field === 'entityType') {
          if (value === 'natural') {
            // Clear juridica-specific fields
            updatedGuarantor.company_name = '';
            updatedGuarantor.company_rut = '';
            updatedGuarantor.legal_representative_first_name = '';
            updatedGuarantor.legal_representative_paternal_last_name = '';
            updatedGuarantor.legal_representative_maternal_last_name = '';
            updatedGuarantor.legal_representative_rut = '';
            updatedGuarantor.net_monthly_income_clp = '';
            updatedGuarantor.constitution_type = undefined;
            updatedGuarantor.constitution_date = '';
            updatedGuarantor.constitution_cve = '';
            updatedGuarantor.constitution_notary = '';
            updatedGuarantor.repertory_number = '';
          } else if (value === 'juridica') {
            // Initialize juridica-specific fields
            updatedGuarantor.company_name = updatedGuarantor.company_name || '';
            updatedGuarantor.company_rut = updatedGuarantor.company_rut || '';
            updatedGuarantor.legal_representative_first_name = updatedGuarantor.legal_representative_first_name || '';
            updatedGuarantor.legal_representative_paternal_last_name = updatedGuarantor.legal_representative_paternal_last_name || '';
            updatedGuarantor.legal_representative_maternal_last_name = updatedGuarantor.legal_representative_maternal_last_name || '';
            updatedGuarantor.legal_representative_rut = updatedGuarantor.legal_representative_rut || '';
            updatedGuarantor.net_monthly_income_clp = updatedGuarantor.net_monthly_income_clp || '';
            updatedGuarantor.constitution_type = updatedGuarantor.constitution_type || undefined;
            updatedGuarantor.constitution_date = updatedGuarantor.constitution_date || '';
            updatedGuarantor.constitution_cve = updatedGuarantor.constitution_cve || '';
            updatedGuarantor.constitution_notary = updatedGuarantor.constitution_notary || '';
            updatedGuarantor.repertory_number = updatedGuarantor.repertory_number || '';
          }
        }

        return updatedGuarantor;
      }
      return guarantor;
    }));
  };

  // Funciones para manejar documentos del postulante
  const getRequiredDocuments = (applicant: ApplicantData): ApplicantDocument[] => {
    const { entityType, workerType } = applicant;

    if (entityType === 'juridica') {
      return [
        { type: 'informe_comercial', label: 'Informe Comercial (Dicom)', required: true },
        { type: 'escritura_constitucion', label: 'Escritura de Constitución de Sociedad', required: true },
        { type: 'certificado_vigencia', label: 'Certificado de Vigencia', required: true },
        { type: 'rut_empresa', label: 'RUT Empresa', required: true },
        { type: 'carpeta_tributaria', label: 'Carpeta Tributaria SII', required: true },
        { type: 'poder_notarial', label: 'Poder Notarial Representante (si aplica)', required: false },
        { type: 'cedula_representante', label: 'Cédula Representante Legal', required: true },
      ];
    } else if (entityType === 'natural' && workerType === 'independiente') {
      return [
        { type: 'informe_comercial', label: 'Informe Comercial (Dicom)', required: true },
        { type: 'carpeta_tributaria', label: 'Carpeta Tributaria SII', required: true },
        { type: 'declaracion_renta', label: 'Declaración Anual de Renta', required: true },
        { type: 'boletas_honorarios', label: '6 Últimas Boletas de Honorarios', required: true },
        { type: 'certificado_cotizaciones_independiente', label: 'Certificado de Cotizaciones Independientes', required: true },
        { type: 'cedula_identidad', label: 'Cédula de Identidad', required: true },
      ];
    } else {
      // Persona Natural Dependiente (default)
      return [
        { type: 'informe_comercial', label: 'Informe Comercial (Dicom)', required: true },
        { type: 'liquidaciones_sueldo', label: 'Últimas 3 Liquidaciones de Sueldo', required: true },
        { type: 'contrato_trabajo', label: 'Contrato de Trabajo', required: true },
        { type: 'certificado_antiguedad', label: 'Certificado de Antigüedad Laboral', required: true },
        { type: 'certificado_afp', label: 'Certificado de Cotizaciones Previsionales AFP', required: true },
        { type: 'cedula_identidad', label: 'Cédula de Identidad', required: true },
      ];
    }
  };

  // Funciones para manejar documentos del aval
  const getRequiredDocumentsForGuarantor = (guarantor: GuarantorData): GuarantorDocument[] => {
    const { entityType, workerType } = guarantor;

    if (entityType === 'juridica') {
      return [
        { type: 'informe_comercial', label: 'Informe Comercial (Dicom)', required: true },
        { type: 'escritura_constitucion', label: 'Escritura de Constitución de Sociedad', required: true },
        { type: 'certificado_vigencia', label: 'Certificado de Vigencia', required: true },
        { type: 'rut_empresa', label: 'RUT Empresa', required: true },
        { type: 'carpeta_tributaria', label: 'Carpeta Tributaria SII', required: true },
        { type: 'poder_notarial', label: 'Poder Notarial Representante (si aplica)', required: false },
        { type: 'cedula_representante', label: 'Cédula Representante Legal', required: true },
      ];
    } else if (entityType === 'natural' && workerType === 'independiente') {
      return [
        { type: 'informe_comercial', label: 'Informe Comercial (Dicom)', required: true },
        { type: 'carpeta_tributaria', label: 'Carpeta Tributaria SII', required: true },
        { type: 'declaracion_renta', label: 'Declaración Anual de Renta', required: true },
        { type: 'boletas_honorarios', label: '6 Últimas Boletas de Honorarios', required: true },
        { type: 'certificado_cotizaciones_independiente', label: 'Certificado de Cotizaciones Independientes', required: true },
        { type: 'cedula_identidad', label: 'Cédula de Identidad', required: true },
      ];
    } else {
      // Persona Natural Dependiente (default)
      return [
        { type: 'informe_comercial', label: 'Informe Comercial (Dicom)', required: true },
        { type: 'liquidaciones_sueldo', label: 'Últimas 3 Liquidaciones de Sueldo', required: true },
        { type: 'contrato_trabajo', label: 'Contrato de Trabajo', required: true },
        { type: 'certificado_antiguedad', label: 'Certificado de Antigüedad Laboral', required: true },
        { type: 'certificado_afp', label: 'Certificado de Cotizaciones Previsionales AFP', required: true },
        { type: 'cedula_identidad', label: 'Cédula de Identidad', required: true },
      ];
    }
  };

  const handleDocumentUpload = (applicantIndex: number, documentType: string, file: File) => {
    setApplicants(prev => prev.map((applicant, i) => {
      if (i === applicantIndex) {
        const documents = applicant.documents || getRequiredDocuments(applicant);
        const updatedDocuments = documents.map(doc =>
          doc.type === documentType ? { ...doc, file } : doc
        );
        return { ...applicant, documents: updatedDocuments };
      }
      return applicant;
    }));
  };

  const handleDocumentRemove = (applicantIndex: number, documentType: string) => {
    setApplicants(prev => prev.map((applicant, i) => {
      if (i === applicantIndex) {
        const documents = applicant.documents || getRequiredDocuments(applicant);
        const updatedDocuments = documents.map(doc =>
          doc.type === documentType ? { ...doc, file: undefined, url: undefined } : doc
        );
        return { ...applicant, documents: updatedDocuments };
      }
      return applicant;
    }));
  };

  const handleGuarantorDocumentUpload = (guarantorIndex: number, documentType: string, file: File) => {
    setGuarantors(prev => prev.map((guarantor, i) => {
      if (i === guarantorIndex) {
        const documents = guarantor.documents || getRequiredDocumentsForGuarantor(guarantor);
        const updatedDocuments = documents.map(doc =>
          doc.type === documentType ? { ...doc, file } : doc
        );
        return { ...guarantor, documents: updatedDocuments };
      }
      return guarantor;
    }));
  };

  const handleGuarantorDocumentRemove = (guarantorIndex: number, documentType: string) => {
    setGuarantors(prev => prev.map((guarantor, i) => {
      if (i === guarantorIndex) {
        const documents = guarantor.documents || getRequiredDocumentsForGuarantor(guarantor);
        const updatedDocuments = documents.map(doc =>
          doc.type === documentType ? { ...doc, file: undefined, url: undefined } : doc
        );
        return { ...guarantor, documents: updatedDocuments };
      }
      return guarantor;
    }));
  };

  // Funciones para subir documentos
  const uploadApplicantDocuments = async (
    applicantId: string,
    documents: ApplicantDocument[],
    userId: string,
    applicantIndex: number
  ): Promise<void> => {
    if (!documents || documents.length === 0) return;

    for (const doc of documents) {
      if (!doc.file) continue;

      try {
        // Generar nombre único para el archivo
        const fileExt = doc.file.name.split('.').pop();
        const fileName = `${userId}/applicants/${applicantId}/${doc.type}_${Date.now()}.${fileExt}`;

        // Subir archivo a Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('user-documents')
          .upload(fileName, doc.file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error(`Error uploading document ${doc.type}:`, uploadError);
          continue;
        }

        // Obtener URL pública del archivo
        const { data: urlData } = supabase.storage
          .from('user-documents')
          .getPublicUrl(fileName);

        // Guardar registro del documento en la tabla applicant_documents
        const { error: docError } = await supabase
          .from('applicant_documents')
          .insert({
            applicant_id: applicantId,
            doc_type: doc.type,
            file_name: doc.file.name,
            file_url: urlData.publicUrl,
            storage_path: fileName,
            file_size_bytes: doc.file.size,
            mime_type: doc.file.type,
            uploaded_by: userId,
            uploaded_at: new Date().toISOString()
          });

        if (docError) {
          console.error(`Error saving document record ${doc.type}:`, docError);
        }

        console.log(`✅ Applicant document ${doc.type} uploaded successfully`);
      } catch (error) {
        console.error(`Error processing applicant document ${doc.type}:`, error);
      }
    }
  };

  const uploadGuarantorDocuments = async (
    guarantorId: string,
    documents: GuarantorDocument[],
    userId: string,
    guarantorIndex: number
  ): Promise<void> => {
    if (!documents || documents.length === 0) return;

    for (const doc of documents) {
      if (!doc.file) continue;

      try {
        // Generar nombre único para el archivo
        const fileExt = doc.file.name.split('.').pop();
        const fileName = `${userId}/guarantors/${guarantorId}/${doc.type}_${Date.now()}.${fileExt}`;

        // Subir archivo a Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('user-documents')
          .upload(fileName, doc.file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error(`Error uploading guarantor document ${doc.type}:`, uploadError);
          continue;
        }

        // Obtener URL pública del archivo
        const { data: urlData } = supabase.storage
          .from('user-documents')
          .getPublicUrl(fileName);

        // Guardar registro del documento en la tabla guarantor_documents
        const { error: docError } = await supabase
          .from('guarantor_documents')
          .insert({
            guarantor_id: guarantorId,
            doc_type: doc.type,
            file_name: doc.file.name,
            file_url: urlData.publicUrl,
            storage_path: fileName,
            file_size_bytes: doc.file.size,
            mime_type: doc.file.type,
            uploaded_by: userId,
            uploaded_at: new Date().toISOString()
          });

        if (docError) {
          console.error(`Error saving guarantor document record ${doc.type}:`, docError);
        }

        console.log(`✅ Guarantor document ${doc.type} uploaded successfully`);
      } catch (error) {
        console.error(`Error processing guarantor document ${doc.type}:`, error);
      }
    }
  };

  // Funciones de validación
  const validateApplicant = (applicant: ApplicantData): string[] => {
    const errors: string[] = [];

    // Validaciones comunes
    if (!applicant.unit_type) errors.push('Tipo de Unidad es requerido');
    if (!applicant.address_street?.trim()) errors.push('Calle es requerida');
    if (!applicant.address_number?.trim()) errors.push('Número es requerido');
    if (!applicant.address_commune?.trim()) errors.push('Comuna es requerida');
    if (!applicant.address_region) errors.push('Región es requerida');

    if (applicant.entityType === 'natural') {
      if (!applicant.monthly_income_clp) errors.push('Sueldo mensual es requerido');
    } else     if (applicant.entityType === 'juridica') {
      if (!applicant.net_monthly_income_clp) errors.push('Ingreso neto mensual es requerido');
      if (!applicant.company_name?.trim()) errors.push('Razón social es requerida');
      if (!applicant.legal_representative_first_name?.trim()) errors.push('Nombre del representante legal es requerido');
      if (!applicant.legal_representative_paternal_last_name?.trim()) errors.push('Apellido paterno del representante legal es requerido');
      if (!applicant.legal_representative_rut?.trim()) errors.push('RUT del representante legal es requerido');
      if (!applicant.constitution_type) errors.push('Tipo de constitución es requerido');

      if (applicant.constitution_type === 'tradicional') {
        if (!applicant.constitution_date?.trim()) errors.push('Fecha de constitución es requerida para constituciones tradicionales');
        if (!applicant.constitution_notary?.trim()) errors.push('Notaría es requerida para constituciones tradicionales');
        if (!applicant.repertory_number?.trim()) errors.push('Número de repertorio es requerido para constituciones tradicionales');
      } else if (applicant.constitution_type === 'empresa_en_un_dia') {
        if (!applicant.constitution_date?.trim()) errors.push('Fecha de constitución es requerida para empresas en un día');
        if (!applicant.constitution_cve?.trim()) errors.push('CVE es requerido para empresas en un día');
      }
    }

    // Validación de documentos requeridos
    const requiredDocs = getRequiredDocuments(applicant);
    const applicantDocs = applicant.documents || [];

    requiredDocs.forEach(reqDoc => {
      if (reqDoc.required) {
        const uploadedDoc = applicantDocs.find(d => d.type === reqDoc.type);
        if (!uploadedDoc || (!uploadedDoc.file && !uploadedDoc.url)) {
          errors.push(`Documento requerido faltante: ${reqDoc.label}`);
        }
      }
    });

    return errors;
  };

  const validateGuarantor = (guarantor: GuarantorData): string[] => {
    const errors: string[] = [];

    // Validaciones comunes
    if (!guarantor.unit_type) errors.push('Tipo de Unidad es requerido');
    if (!guarantor.address_street?.trim()) errors.push('Calle es requerida');
    if (!guarantor.address_number?.trim()) errors.push('Número es requerido');
    if (!guarantor.address_commune?.trim()) errors.push('Comuna es requerida');
    if (!guarantor.address_region) errors.push('Región es requerida');

    if (guarantor.entityType === 'natural') {
      if (!guarantor.profession?.trim()) errors.push('Profesión es requerida');
      if (!guarantor.contact_email?.trim()) errors.push('Email de contacto es requerido');
      if (!guarantor.monthly_income_clp) errors.push('Sueldo mensual es requerido');
    } else     if (guarantor.entityType === 'juridica') {
      if (!guarantor.net_monthly_income_clp) errors.push('Ingreso neto mensual es requerido');
      if (!guarantor.company_name?.trim()) errors.push('Razón social es requerida');
      if (!guarantor.legal_representative_first_name?.trim()) errors.push('Nombre del representante legal es requerido');
      if (!guarantor.legal_representative_paternal_last_name?.trim()) errors.push('Apellido paterno del representante legal es requerido');
      if (!guarantor.legal_representative_rut?.trim()) errors.push('RUT del representante legal es requerido');
      if (!guarantor.constitution_type) errors.push('Tipo de constitución es requerido');

      if (guarantor.constitution_type === 'tradicional') {
        if (!guarantor.constitution_date?.trim()) errors.push('Fecha de constitución es requerida para constituciones tradicionales');
        if (!guarantor.constitution_notary?.trim()) errors.push('Notaría es requerida para constituciones tradicionales');
        if (!guarantor.repertory_number?.trim()) errors.push('Número de repertorio es requerido para constituciones tradicionales');
      } else if (guarantor.constitution_type === 'empresa_en_un_dia') {
        if (!guarantor.constitution_date?.trim()) errors.push('Fecha de constitución es requerida para empresas en un día');
        if (!guarantor.constitution_cve?.trim()) errors.push('CVE es requerido para empresas en un día');
      }
    }

    // Validación de documentos requeridos para avales
    const requiredDocs = getRequiredDocumentsForGuarantor(guarantor);
    const guarantorDocs = guarantor.documents || [];

    requiredDocs.forEach(reqDoc => {
      if (reqDoc.required) {
        const uploadedDoc = guarantorDocs.find(d => d.type === reqDoc.type);
        if (!uploadedDoc || (!uploadedDoc.file && !uploadedDoc.url)) {
          errors.push(`Documento requerido faltante: ${reqDoc.label}`);
        }
      }
    });

    return errors;
  };

  const validateForm = (): boolean => {
    const newValidationErrors = {
      applicants: {} as {[key: string]: string[]},
      guarantors: {} as {[key: string]: string[]},
      general: [] as string[]
    };

    // Validar postulantes
    applicants.forEach((applicant, index) => {
      const applicantId = applicant.id || `applicant-${index + 1}`;
      const errors = validateApplicant(applicant);
      if (errors.length > 0) {
        newValidationErrors.applicants[applicantId] = errors;
      }
    });

    // Validar avales
    guarantors.forEach((guarantor, index) => {
      const guarantorId = guarantor.id || `guarantor-${index + 1}`;
      const errors = validateGuarantor(guarantor);
      if (errors.length > 0) {
        newValidationErrors.guarantors[guarantorId] = errors;
      }
    });


    setValidationErrors(newValidationErrors);
    return Object.keys(newValidationErrors.applicants).length === 0 &&
           Object.keys(newValidationErrors.guarantors).length === 0 &&
           newValidationErrors.general.length === 0;
  };

  // Funciones de manejo de eventos
  const handleApplicantChange = (index: number) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    updateApplicant(index, name, value);
  };

  const handleGuarantorChange = (index: number) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    updateGuarantor(index, name, value);
  };

  // Componente para renderizar un postulante individual
  const renderApplicantCard = (applicant: ApplicantData, index: number) => {
    const applicantId = applicant.id || `applicant-${index + 1}`;
    const isIndependentWorker = independentWorkers[applicantId] || false;
    const applicantErrors = validationErrors.applicants[applicantId] || [];

    return (
      <div key={applicantId} className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 relative" data-error={applicantErrors.length > 0}>
        {/* Header del card con controles */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-gray-900">
                Postulante {index + 1}
              </h4>
              <p className="text-sm text-gray-600">Datos personales y laborales</p>
            </div>
          </div>

          {/* Controles de agregar/remover */}
          <div className="flex items-center gap-2">
            {applicants.length > 1 && (
              <button
                type="button"
                onClick={() => removeApplicant(index)}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
              >
                <Minus className="h-4 w-4" />
                Remover
              </button>
            )}
            {applicants.length < 3 && index === applicants.length - 1 && (
              <button
                type="button"
                onClick={addApplicant}
                className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                Agregar
              </button>
            )}
          </div>
        </div>

        {/* Selector de tipo de entidad */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Tipo de Postulante *
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="relative">
              <input
                type="radio"
                name={`entity-type-${applicantId}`}
                value="natural"
                checked={applicant.entityType === 'natural'}
                onChange={() => updateApplicant(index, 'entityType', 'natural')}
                className="sr-only"
              />
              <div className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                applicant.entityType === 'natural'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300'
              }`}>
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-purple-600" />
                  <div>
                    <div className="font-medium text-gray-900">Persona Natural</div>
                    <div className="text-sm text-gray-600">Individuo</div>
                  </div>
                </div>
              </div>
            </label>

            <label className="relative">
              <input
                type="radio"
                name={`entity-type-${applicantId}`}
                value="juridica"
                checked={applicant.entityType === 'juridica'}
                onChange={() => updateApplicant(index, 'entityType', 'juridica')}
                className="sr-only"
              />
              <div className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                applicant.entityType === 'juridica'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300'
              }`}>
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-purple-600" />
                  <div>
                    <div className="font-medium text-gray-900">Persona Jurídica</div>
                    <div className="text-sm text-gray-600">Empresa</div>
                  </div>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Selector de tipo de trabajador (solo para persona natural) */}
        {applicant.entityType === 'natural' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipo de Trabajador *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="relative">
                <input
                  type="radio"
                  name={`worker-type-${applicantId}`}
                  value="dependiente"
                  checked={applicant.workerType === 'dependiente' || !applicant.workerType}
                  onChange={() => updateApplicant(index, 'workerType', 'dependiente')}
                  className="sr-only"
                />
                <div className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  applicant.workerType === 'dependiente' || !applicant.workerType
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}>
                  <div className="flex items-center gap-3">
                    <Building className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="font-medium text-gray-900">Dependiente</div>
                      <div className="text-sm text-gray-600">Empleado</div>
                    </div>
                  </div>
                </div>
              </label>

              <label className="relative">
                <input
                  type="radio"
                  name={`worker-type-${applicantId}`}
                  value="independiente"
                  checked={applicant.workerType === 'independiente'}
                  onChange={() => updateApplicant(index, 'workerType', 'independiente')}
                  className="sr-only"
                />
                <div className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  applicant.workerType === 'independiente'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}>
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="font-medium text-gray-900">Independiente</div>
                      <div className="text-sm text-gray-600">Honorarios</div>
                    </div>
                  </div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Campos específicos por tipo de entidad */}
        {applicant.entityType === 'natural' ? (
          // Campos para persona natural
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombres *
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={applicant.first_name || ''}
                  onChange={handleApplicantChange(index)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apellido Paterno *
                </label>
                <input
                  type="text"
                  name="paternal_last_name"
                  value={applicant.paternal_last_name || ''}
                  onChange={handleApplicantChange(index)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apellido Materno
                </label>
                <input
                  type="text"
                  name="maternal_last_name"
                  value={applicant.maternal_last_name || ''}
                  onChange={handleApplicantChange(index)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profesión *
                </label>
                <input
                  type="text"
                  name="profession"
                  value={applicant.profession}
                  onChange={handleApplicantChange(index)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  RUT *
                </label>
                <input
                  type="text"
                  name="rut"
                  value={applicant.rut}
                  onChange={handleApplicantChange(index)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </>
        ) : (
          // Campos para persona jurídica
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Razón Social *
                </label>
                <input
                  type="text"
                  name="company_name"
                  value={applicant.company_name}
                  onChange={handleApplicantChange(index)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  RUT Empresa *
                </label>
                <input
                  type="text"
                  name="company_rut"
                  value={applicant.company_rut}
                  onChange={handleApplicantChange(index)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Representante Legal *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <input
                    type="text"
                    name="legal_representative_first_name"
                    value={applicant.legal_representative_first_name || ''}
                    onChange={handleApplicantChange(index)}
                    placeholder="Nombres"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="legal_representative_paternal_last_name"
                    value={applicant.legal_representative_paternal_last_name || ''}
                    onChange={handleApplicantChange(index)}
                    placeholder="Apellido Paterno"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="legal_representative_maternal_last_name"
                    value={applicant.legal_representative_maternal_last_name || ''}
                    onChange={handleApplicantChange(index)}
                    placeholder="Apellido Materno"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="legal_representative_rut"
                    value={applicant.legal_representative_rut || ''}
                    onChange={handleApplicantChange(index)}
                    placeholder="RUT del Representante Legal"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Constitución *
              </label>
              <select
                name="constitution_type"
                value={applicant.constitution_type || ''}
                onChange={handleApplicantChange(index)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                <option value="">Seleccionar tipo</option>
                <option value="empresa_en_un_dia">Empresa en un Día</option>
                <option value="tradicional">Tradicional</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Constitución
                </label>
                <input
                  type="date"
                  name="constitution_date"
                  value={applicant.constitution_date}
                  onChange={handleApplicantChange(index)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {applicant.constitution_type === 'empresa_en_un_dia' && applicant.constitution_type && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CVE
                  </label>
                  <input
                    type="text"
                    name="constitution_cve"
                    value={applicant.constitution_cve}
                    onChange={handleApplicantChange(index)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              )}

              {applicant.constitution_type === 'tradicional' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notaría
                    </label>
                    <input
                      type="text"
                      name="constitution_notary"
                      value={applicant.constitution_notary}
                      onChange={handleApplicantChange(index)}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      N° Repertorio
                    </label>
                    <input
                      type="text"
                      name="repertory_number"
                      value={applicant.repertory_number}
                      onChange={handleApplicantChange(index)}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* Información financiera común */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {applicant.entityType === 'natural' ? 'Sueldo Mensual (CLP) *' : 'Ingreso Neto Mensual (CLP) *'}
            </label>
            <input
              type="number"
              name={applicant.entityType === 'natural' ? 'monthly_income_clp' : 'net_monthly_income_clp'}
              value={applicant.entityType === 'natural' ? (applicant.monthly_income_clp || '') : (applicant.net_monthly_income_clp || '')}
              onChange={handleApplicantChange(index)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
              min="0"
            />
            {(applicant.entityType === 'natural' ? applicant.monthly_income_clp : applicant.net_monthly_income_clp) && (
              <p className="text-sm text-green-600 mt-1 font-medium">
                💰 {formatPriceCLP(parseInt(applicant.entityType === 'natural' ? applicant.monthly_income_clp : applicant.net_monthly_income_clp))}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nacionalidad *
            </label>
            <input
              type="text"
              name="nationality"
              value={applicant.nationality}
              onChange={handleApplicantChange(index)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        {/* Dirección (común para ambos tipos) */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dirección *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
            <input
              type="text"
              name="address_street"
              value={applicant.address_street}
              onChange={handleApplicantChange(index)}
              placeholder="Calle/Avenida"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
            <input
              type="text"
              name="address_number"
              value={applicant.address_number}
              onChange={handleApplicantChange(index)}
              placeholder="Número"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>

          {/* Selector de Tipo de Unidad */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipo de Unidad *
            </label>
            <div className="grid grid-cols-3 gap-3">
              <label className="relative">
                <input
                  type="radio"
                  name={`unit_type-${applicantId}`}
                  value="Casa"
                  checked={applicant.unit_type === 'Casa'}
                  onChange={() => updateApplicant(index, 'unit_type', 'Casa')}
                  className="sr-only"
                />
                <div className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  applicant.unit_type === 'Casa'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300'
                }`}>
                  <div className="flex items-center justify-center gap-2">
                    <Home className="h-5 w-5 text-purple-600" />
                    <div className="font-medium text-gray-900 text-center">Casa</div>
                  </div>
                </div>
              </label>

              <label className="relative">
                <input
                  type="radio"
                  name={`unit_type-${applicantId}`}
                  value="Departamento"
                  checked={applicant.unit_type === 'Departamento'}
                  onChange={() => updateApplicant(index, 'unit_type', 'Departamento')}
                  className="sr-only"
                />
                <div className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  applicant.unit_type === 'Departamento'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300'
                }`}>
                  <div className="flex items-center justify-center gap-2">
                    <Building className="h-5 w-5 text-purple-600" />
                    <div className="font-medium text-gray-900 text-center">Departamento</div>
                  </div>
                </div>
              </label>

              <label className="relative">
                <input
                  type="radio"
                  name={`unit_type-${applicantId}`}
                  value="Oficina"
                  checked={applicant.unit_type === 'Oficina'}
                  onChange={() => updateApplicant(index, 'unit_type', 'Oficina')}
                  className="sr-only"
                />
                <div className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  applicant.unit_type === 'Oficina'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300'
                }`}>
                  <div className="flex items-center justify-center gap-2">
                    <Building2 className="h-5 w-5 text-purple-600" />
                    <div className="font-medium text-gray-900 text-center">Oficina</div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              name="address_department"
              value={applicant.address_department}
              onChange={handleApplicantChange(index)}
              placeholder="Depto/Oficina (opcional)"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <input
              type="text"
              name="address_commune"
              value={applicant.address_commune}
              onChange={handleApplicantChange(index)}
              placeholder="Comuna"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
            <select
              name="address_region"
              value={applicant.address_region}
              onChange={handleApplicantChange(index)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            >
              <option value="">Seleccionar Región</option>
              {regions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Información de contacto (solo para naturales) */}
        {applicant.entityType === 'natural' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono *
              </label>
              <input
                type="tel"
                name="phone"
                value={applicant.phone}
                onChange={handleApplicantChange(index)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={applicant.email}
                onChange={handleApplicantChange(index)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
          </div>
        )}

        {/* Documentos requeridos del postulante */}
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Documentos Requeridos</h3>
          </div>

          <div className="grid gap-4">
            {getRequiredDocuments(applicant).map((doc) => {
              const uploadedDoc = applicant.documents?.find(d => d.type === doc.type);
              const isUploaded = uploadedDoc && (uploadedDoc.file || uploadedDoc.url);

              return (
                <div key={doc.type} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{doc.label}</span>
                      {doc.required && (
                        <span className="text-xs text-red-600 font-medium">*</span>
                      )}
                    </div>
                    {isUploaded && (
                      <div className="flex items-center gap-2 mt-1">
                        <Paperclip className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-700">
                          {uploadedDoc.file?.name || 'Documento subido'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isUploaded ? (
                      <button
                        type="button"
                        onClick={() => handleDocumentRemove(index, doc.type)}
                        className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remover
                      </button>
                    ) : (
                      <label className="flex items-center gap-1 px-3 py-1 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-md transition-colors cursor-pointer">
                        <Upload className="h-4 w-4" />
                        Subir
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleDocumentUpload(index, doc.type, file);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mostrar errores de validación */}
        {applicantErrors.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">Errores de validación:</span>
            </div>
            <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
              {applicantErrors.map((error, errorIndex) => (
                <li key={errorIndex}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  // Componente para renderizar un aval individual
  const renderGuarantorCard = (guarantor: GuarantorData, index: number) => {
    const guarantorId = guarantor.id || `guarantor-${index + 1}`;
    const guarantorErrors = validationErrors.guarantors[guarantorId] || [];

    return (
      <div key={guarantorId} className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 relative" data-error={guarantorErrors.length > 0}>
        {/* Header del card con controles */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <UserCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-gray-900">
                Aval {index + 1}
              </h4>
              <p className="text-sm text-gray-600">Garante de la postulación</p>
            </div>
          </div>

          {/* Controles de agregar/remover */}
          <div className="flex items-center gap-2">
            {guarantors.length > 0 && (
              <button
                type="button"
                onClick={() => removeGuarantor(index)}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
              >
                <Minus className="h-4 w-4" />
                Remover
              </button>
            )}
            {guarantors.length < 3 && index === guarantors.length - 1 && (
              <button
                type="button"
                onClick={addGuarantor}
                className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                Agregar
              </button>
            )}
          </div>
        </div>

        {/* Selector de tipo de entidad */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Tipo de Aval *
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="relative">
              <input
                type="radio"
                name={`guarantor-entity-type-${guarantorId}`}
                value="natural"
                checked={guarantor.entityType === 'natural'}
                onChange={() => updateGuarantor(index, 'entityType', 'natural')}
                className="sr-only"
              />
              <div className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                guarantor.entityType === 'natural'
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 hover:border-emerald-300'
              }`}>
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-emerald-600" />
                  <div>
                    <div className="font-medium text-gray-900">Persona Natural</div>
                    <div className="text-sm text-gray-600">Individuo</div>
                  </div>
                </div>
              </div>
            </label>

            <label className="relative">
              <input
                type="radio"
                name={`guarantor-entity-type-${guarantorId}`}
                value="juridica"
                checked={guarantor.entityType === 'juridica'}
                onChange={() => updateGuarantor(index, 'entityType', 'juridica')}
                className="sr-only"
              />
              <div className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                guarantor.entityType === 'juridica'
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 hover:border-emerald-300'
              }`}>
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-emerald-600" />
                  <div>
                    <div className="font-medium text-gray-900">Persona Jurídica</div>
                    <div className="text-sm text-gray-600">Empresa</div>
                  </div>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Selector de tipo de trabajador (solo para persona natural) */}
        {guarantor.entityType === 'natural' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipo de Trabajador *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="relative">
                <input
                  type="radio"
                  name={`guarantor-worker-type-${guarantorId}`}
                  value="dependiente"
                  checked={guarantor.workerType === 'dependiente' || !guarantor.workerType}
                  onChange={() => updateGuarantor(index, 'workerType', 'dependiente')}
                  className="sr-only"
                />
                <div className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  guarantor.workerType === 'dependiente' || !guarantor.workerType
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-emerald-300'
                }`}>
                  <div className="flex items-center gap-3">
                    <Building className="h-5 w-5 text-emerald-600" />
                    <div>
                      <div className="font-medium text-gray-900">Dependiente</div>
                      <div className="text-sm text-gray-600">Empleado</div>
                    </div>
                  </div>
                </div>
              </label>

              <label className="relative">
                <input
                  type="radio"
                  name={`guarantor-worker-type-${guarantorId}`}
                  value="independiente"
                  checked={guarantor.workerType === 'independiente'}
                  onChange={() => updateGuarantor(index, 'workerType', 'independiente')}
                  className="sr-only"
                />
                <div className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  guarantor.workerType === 'independiente'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-emerald-300'
                }`}>
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-emerald-600" />
                    <div>
                      <div className="font-medium text-gray-900">Independiente</div>
                      <div className="text-sm text-gray-600">Honorarios</div>
                    </div>
                  </div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Campos específicos por tipo de entidad */}
        {guarantor.entityType === 'natural' ? (
          // Campos para persona natural
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombres *
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={guarantor.first_name || ''}
                  onChange={handleGuarantorChange(index)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apellido Paterno *
                </label>
                <input
                  type="text"
                  name="paternal_last_name"
                  value={guarantor.paternal_last_name || ''}
                  onChange={handleGuarantorChange(index)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apellido Materno
                </label>
                <input
                  type="text"
                  name="maternal_last_name"
                  value={guarantor.maternal_last_name || ''}
                  onChange={handleGuarantorChange(index)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profesión *
                </label>
                <input
                  type="text"
                  name="profession"
                  value={guarantor.profession}
                  onChange={handleGuarantorChange(index)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  RUT *
                </label>
                <input
                  type="text"
                  name="rut"
                  value={guarantor.rut}
                  onChange={handleGuarantorChange(index)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </>
        ) : (
          // Campos para persona jurídica
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Razón Social *
                </label>
                <input
                  type="text"
                  name="company_name"
                  value={guarantor.company_name}
                  onChange={handleGuarantorChange(index)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  RUT Empresa *
                </label>
                <input
                  type="text"
                  name="company_rut"
                  value={guarantor.company_rut}
                  onChange={handleGuarantorChange(index)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Representante Legal *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <input
                    type="text"
                    name="legal_representative_first_name"
                    value={guarantor.legal_representative_first_name || ''}
                    onChange={handleGuarantorChange(index)}
                    placeholder="Nombres"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="legal_representative_paternal_last_name"
                    value={guarantor.legal_representative_paternal_last_name || ''}
                    onChange={handleGuarantorChange(index)}
                    placeholder="Apellido Paterno"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="legal_representative_maternal_last_name"
                    value={guarantor.legal_representative_maternal_last_name || ''}
                    onChange={handleGuarantorChange(index)}
                    placeholder="Apellido Materno"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="legal_representative_rut"
                    value={guarantor.legal_representative_rut || ''}
                    onChange={handleGuarantorChange(index)}
                    placeholder="RUT del Representante Legal"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Constitución *
              </label>
              <select
                name="constitution_type"
                value={guarantor.constitution_type || ''}
                onChange={handleGuarantorChange(index)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              >
                <option value="">Seleccionar tipo</option>
                <option value="empresa_en_un_dia">Empresa en un Día</option>
                <option value="tradicional">Tradicional</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Constitución
                </label>
                <input
                  type="date"
                  name="constitution_date"
                  value={guarantor.constitution_date}
                  onChange={handleGuarantorChange(index)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {guarantor.constitution_type === 'empresa_en_un_dia' && guarantor.constitution_type && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CVE
                  </label>
                  <input
                    type="text"
                    name="constitution_cve"
                    value={guarantor.constitution_cve}
                    onChange={handleGuarantorChange(index)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              )}

              {guarantor.constitution_type === 'tradicional' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notaría
                    </label>
                    <input
                      type="text"
                      name="constitution_notary"
                      value={guarantor.constitution_notary}
                      onChange={handleGuarantorChange(index)}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      N° Repertorio
                    </label>
                    <input
                      type="text"
                      name="repertory_number"
                      value={guarantor.repertory_number}
                      onChange={handleGuarantorChange(index)}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* Información financiera común */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {guarantor.entityType === 'natural' ? 'Sueldo Mensual (CLP) *' : 'Ingreso Neto Mensual (CLP) *'}
            </label>
            <input
              type="number"
              name={guarantor.entityType === 'natural' ? 'monthly_income_clp' : 'net_monthly_income_clp'}
              value={guarantor.entityType === 'natural' ? (guarantor.monthly_income_clp || '') : (guarantor.net_monthly_income_clp || '')}
              onChange={handleGuarantorChange(index)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
              min="0"
            />
            {(guarantor.entityType === 'natural' ? guarantor.monthly_income_clp : guarantor.net_monthly_income_clp) && (
              <p className="text-sm text-green-600 mt-1 font-medium">
                💰 {formatPriceCLP(parseInt(guarantor.entityType === 'natural' ? guarantor.monthly_income_clp : guarantor.net_monthly_income_clp))}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email de Contacto *
            </label>
            <input
              type="email"
              name="contact_email"
              value={guarantor.contact_email}
              onChange={handleGuarantorChange(index)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        {/* Dirección (común para ambos tipos) */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dirección *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
            <input
              type="text"
              name="address_street"
              value={guarantor.address_street}
              onChange={handleGuarantorChange(index)}
              placeholder="Calle/Avenida"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
            />
            <input
              type="text"
              name="address_number"
              value={guarantor.address_number}
              onChange={handleGuarantorChange(index)}
              placeholder="Número"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
            />
          </div>

          {/* Selector de Tipo de Unidad */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipo de Unidad *
            </label>
            <div className="grid grid-cols-3 gap-3">
              <label className="relative">
                <input
                  type="radio"
                  name={`guarantor_unit_type-${guarantorId}`}
                  value="Casa"
                  checked={guarantor.unit_type === 'Casa'}
                  onChange={() => updateGuarantor(index, 'unit_type', 'Casa')}
                  className="sr-only"
                />
                <div className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  guarantor.unit_type === 'Casa'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-emerald-300'
                }`}>
                  <div className="flex items-center justify-center gap-2">
                    <Home className="h-5 w-5 text-emerald-600" />
                    <div className="font-medium text-gray-900 text-center">Casa</div>
                  </div>
                </div>
              </label>

              <label className="relative">
                <input
                  type="radio"
                  name={`guarantor_unit_type-${guarantorId}`}
                  value="Departamento"
                  checked={guarantor.unit_type === 'Departamento'}
                  onChange={() => updateGuarantor(index, 'unit_type', 'Departamento')}
                  className="sr-only"
                />
                <div className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  guarantor.unit_type === 'Departamento'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-emerald-300'
                }`}>
                  <div className="flex items-center justify-center gap-2">
                    <Building className="h-5 w-5 text-emerald-600" />
                    <div className="font-medium text-gray-900 text-center">Departamento</div>
                  </div>
                </div>
              </label>

              <label className="relative">
                <input
                  type="radio"
                  name={`guarantor_unit_type-${guarantorId}`}
                  value="Oficina"
                  checked={guarantor.unit_type === 'Oficina'}
                  onChange={() => updateGuarantor(index, 'unit_type', 'Oficina')}
                  className="sr-only"
                />
                <div className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  guarantor.unit_type === 'Oficina'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-emerald-300'
                }`}>
                  <div className="flex items-center justify-center gap-2">
                    <Building2 className="h-5 w-5 text-emerald-600" />
                    <div className="font-medium text-gray-900 text-center">Oficina</div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              name="address_department"
              value={guarantor.address_department}
              onChange={handleGuarantorChange(index)}
              placeholder="Depto/Oficina (opcional)"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            <input
              type="text"
              name="address_commune"
              value={guarantor.address_commune}
              onChange={handleGuarantorChange(index)}
              placeholder="Comuna"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
            />
            <select
              name="address_region"
              value={guarantor.address_region}
              onChange={handleGuarantorChange(index)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
            >
              <option value="">Seleccionar Región</option>
              {regions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Documentos requeridos del aval */}
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-gray-900">Documentos Requeridos del Aval</h3>
          </div>

          <div className="grid gap-4">
            {getRequiredDocumentsForGuarantor(guarantor).map((doc) => {
              const uploadedDoc = guarantor.documents?.find(d => d.type === doc.type);
              const isUploaded = uploadedDoc && (uploadedDoc.file || uploadedDoc.url);

              return (
                <div key={doc.type} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{doc.label}</span>
                      {doc.required && (
                        <span className="text-xs text-red-600 font-medium">*</span>
                      )}
                    </div>
                    {isUploaded && (
                      <div className="flex items-center gap-2 mt-1">
                        <Paperclip className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-700">
                          {uploadedDoc.file?.name || 'Documento subido'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isUploaded ? (
                      <button
                        type="button"
                        onClick={() => handleGuarantorDocumentRemove(index, doc.type)}
                        className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remover
                      </button>
                    ) : (
                      <label className="flex items-center gap-1 px-3 py-1 text-sm text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer">
                        <Upload className="h-4 w-4" />
                        Subir
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleGuarantorDocumentUpload(index, doc.type, file);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mostrar errores de validación */}
        {guarantorErrors.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">Errores de validación:</span>
            </div>
            <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
              {guarantorErrors.map((error, errorIndex) => (
                <li key={errorIndex}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  // Efecto para cargar el perfil del usuario
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setProfileLoading(true);
        const profile = await getCurrentProfile();

        if (profile) {
          setUserProfile(profile);

          // Mapear datos del perfil al primer postulante
          setApplicants(prev => prev.map((applicant, index) =>
            index === 0 ? {
              ...applicant,
              first_name: profile.first_name || '',
              paternal_last_name: profile.paternal_last_name || '',
              maternal_last_name: profile.maternal_last_name || '',
              rut: profile.rut || '',
              profession: profile.profession || '',
              monthly_income_clp: '', // Este campo no está en el perfil, se debe llenar manualmente
              phone: profile.phone || '',
              email: profile.email || '',
              marital_status: profile.marital_status || 'soltero',
            } : applicant
          ));
        }
      } catch (error) {
        console.error('Error cargando perfil:', error);
      } finally {
        setProfileLoading(false);
      }
    };

    loadUserProfile();
  }, []);

  // Función para manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar formulario
    if (!validateForm()) {
      console.log('❌ Validación fallida');
      console.log('🔍 Errores encontrados:', validationErrors);

      // Mostrar errores específicos en consola
      Object.entries(validationErrors.applicants).forEach(([key, errors]) => {
        if (errors.length > 0) {
          console.log(`❌ Errores en postulante ${key}:`, errors);
        }
      });
      Object.entries(validationErrors.guarantors).forEach(([key, errors]) => {
        if (errors.length > 0) {
          console.log(`❌ Errores en aval ${key}:`, errors);
        }
      });

      // Hacer scroll hasta el primer error
      const firstErrorElement = document.querySelector('[data-error="true"]');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      return;
    }

    setLoading(true);
    try {
      // Obtener usuario autenticado
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('Usuario no autenticado');
      }

      console.log('👤 Usuario autenticado:', user.id);

      // PASO 1: Crear o actualizar la postulación principal
      const mainApplicant = applicants[0]; // Usar el primer postulante como principal

      let application;

      if (editMode && existingApplicationId) {
        // Modo edición: actualizar postulación existente
        console.log('📝 Actualizando postulación existente...');

        const updateData = {
          message: applicationMessage || 'Postulación actualizada a través del formulario web',
          updated_at: new Date().toISOString(),
          // Actualizar snapshots del postulante principal
          snapshot_applicant_first_name: mainApplicant.first_name || '',
          snapshot_applicant_paternal_last_name: mainApplicant.paternal_last_name || '',
          snapshot_applicant_maternal_last_name: mainApplicant.maternal_last_name || '',
          snapshot_applicant_rut: mainApplicant.rut?.substring(0, 12) || '',
          snapshot_applicant_profession: mainApplicant.profession || '',
          snapshot_applicant_monthly_income_clp: mainApplicant.entityType === 'natural' ? (parseInt(mainApplicant.monthly_income_clp) || 0) : 0,
          snapshot_applicant_age: parseInt(mainApplicant.age) || 0,
          snapshot_applicant_nationality: mainApplicant.nationality,
          snapshot_applicant_email: mainApplicant.email || '',
          snapshot_applicant_phone: mainApplicant.phone || '',
          snapshot_applicant_marital_status: mainApplicant.marital_status || 'soltero',
          snapshot_applicant_address_street: mainApplicant.address_street,
          snapshot_applicant_address_number: mainApplicant.address_number?.substring(0, 10) || '',
          snapshot_applicant_address_department: mainApplicant.address_department?.substring(0, 10) || null,
          snapshot_applicant_address_commune: mainApplicant.address_commune,
          snapshot_applicant_address_region: mainApplicant.address_region,
        };

        console.log('📋 Datos a actualizar en applications:', updateData);

        const { data: updatedApplication, error: updateError } = await supabase
          .from('applications')
          .update(updateData)
          .eq('id', existingApplicationId)
          .eq('applicant_id', user.id) // Asegurar que solo el propietario pueda editar
          .select()
          .single();

        if (updateError) {
          throw new Error(`Error actualizando aplicación: ${updateError.message}`);
        }

        application = updatedApplication;
        console.log('✅ Postulación actualizada:', application.id);

        // Registrar la edición en el log de auditoría
        try {
          await supabase.rpc('log_application_edit', {
            p_application_id: existingApplicationId,
            p_user_id: user.id,
            p_changes_summary: 'Postulación editada por el postulante',
            p_ip_address: null,
            p_user_agent: navigator.userAgent
          });
        } catch (auditError) {
          console.warn('Failed to log application edit:', auditError);
          // Don't fail the operation if audit logging fails
        }

        // Limpiar postulantes y avaladores existentes antes de recrearlos
        console.log('🧹 Limpiando postulantes existentes...');
        await supabase
          .from('application_applicants')
          .delete()
          .eq('application_id', existingApplicationId);

        console.log('🧹 Limpiando avaladores existentes...');
        await supabase
          .from('application_guarantors')
          .delete()
          .eq('application_id', existingApplicationId);

      } else {
        // Modo creación: crear nueva postulación
        console.log('📝 Creando nueva postulación...');

        const applicationData = {
          property_id: property.id,
          applicant_id: user.id, // Usuario actual como postulante principal
          status: 'pendiente',
          message: applicationMessage || 'Postulación enviada a través del formulario web',
          application_characteristic_id: null, // Por ahora null, se puede generar después
          // Snapshots del postulante principal
          snapshot_applicant_first_name: mainApplicant.first_name || '',
          snapshot_applicant_paternal_last_name: mainApplicant.paternal_last_name || '',
          snapshot_applicant_maternal_last_name: mainApplicant.maternal_last_name || '',
          snapshot_applicant_rut: mainApplicant.rut?.substring(0, 12) || '',
          snapshot_applicant_profession: mainApplicant.profession || '',
          snapshot_applicant_monthly_income_clp: mainApplicant.entityType === 'natural' ? (parseInt(mainApplicant.monthly_income_clp) || 0) : 0,
          snapshot_applicant_age: parseInt(mainApplicant.age) || 0,
          snapshot_applicant_nationality: mainApplicant.nationality,
          snapshot_applicant_email: mainApplicant.email || '',
          snapshot_applicant_phone: mainApplicant.phone || '',
          snapshot_applicant_marital_status: mainApplicant.marital_status || 'soltero',
          snapshot_applicant_address_street: mainApplicant.address_street,
          snapshot_applicant_address_number: mainApplicant.address_number?.substring(0, 10) || '',
          snapshot_applicant_address_department: mainApplicant.address_department?.substring(0, 10) || null,
          snapshot_applicant_address_commune: mainApplicant.address_commune,
          snapshot_applicant_address_region: mainApplicant.address_region,
          structured_applicant_id: null, // Por ahora null
          structured_guarantor_id: null, // Por ahora null
          guarantor_characteristic_id: null, // Por ahora null
        };

        console.log('📋 Datos a enviar a applications:', applicationData);

        const { data: newApplication, error: applicationError } = await supabase
          .from('applications')
          .insert(applicationData)
          .select()
          .single();

        if (applicationError) {
          throw new Error(`Error creando aplicación: ${applicationError.message}`);
        }

        application = newApplication;
        console.log('✅ Nueva postulación creada:', application.id);
      }

      // PASO 3: Crear postulantes en application_applicants
      console.log('👥 Creando postulantes en application_applicants...');
      const applicantInserts = applicants.map(applicant => {
        const applicantData = {
        application_id: application.id,
        entity_type: applicant.entityType,
        first_name: applicant.first_name,
        paternal_last_name: applicant.paternal_last_name || null,
        maternal_last_name: applicant.maternal_last_name || null,
        rut: applicant.rut?.substring(0, 12) || null,
        profession: applicant.profession || null,
        monthly_income_clp: applicant.entityType === 'natural' ? (parseInt(applicant.monthly_income_clp) || 0) : 0,
        net_monthly_income_clp: applicant.entityType === 'juridica' ? (parseInt(applicant.net_monthly_income_clp || '0') || 0) : 0,
        unit_type: applicant.unit_type || 'Casa',
        age: parseInt(applicant.age) || null,
        nationality: applicant.nationality,
        marital_status: applicant.marital_status || null,
        address_street: applicant.address_street,
        address_number: applicant.address_number?.substring(0, 10) || null,
        address_department: applicant.address_department?.substring(0, 10) || null,
        address_commune: applicant.address_commune,
        address_region: applicant.address_region,
        phone: applicant.phone || null,
        email: applicant.email || null,
        // Campos para personas jurídicas
        company_name: applicant.company_name || null,
        company_rut: applicant.company_rut?.substring(0, 12) || null,
        legal_representative_name: applicant.entityType === 'juridica' ?
          `${applicant.legal_representative_first_name || ''} ${applicant.legal_representative_paternal_last_name || ''} ${applicant.legal_representative_maternal_last_name || ''}`.trim() || null : null,
        legal_representative_rut: applicant.legal_representative_rut?.substring(0, 12) || null,
        constitution_type: applicant.constitution_type || null,
        constitution_date: applicant.constitution_date || null,
        constitution_cve: applicant.constitution_cve?.substring(0, 50) || null,
        constitution_notary: applicant.constitution_notary || null,
        repertory_number: applicant.repertory_number?.substring(0, 50) || null,
        created_by: user.id
        };

        console.log('📋 Datos del postulante:', applicantData);
        return applicantData;
      });

      const { error: applicantsError } = await supabase
        .from('application_applicants')
        .insert(applicantInserts);

      if (applicantsError) {
        console.error('❌ Error creando postulantes:', applicantsError);
        throw new Error(`Error creando postulantes: ${applicantsError.message}`);
      }
      console.log('✅ Postulantes creados exitosamente');

      // PASO 4: Crear avales en application_guarantors (si existen)
      console.log('🛡️ Número de avalistas en el estado:', guarantors.length);
      console.log('🛡️ Contenido de avalistas:', guarantors);

      if (guarantors.length > 0) {
        console.log('🛡️ Creando avales en application_guarantors...');
        const guarantorInserts = guarantors.map(guarantor => ({
          application_id: application.id,
          entity_type: guarantor.entityType,
          first_name: guarantor.first_name || null,
          paternal_last_name: guarantor.paternal_last_name || null,
          maternal_last_name: guarantor.maternal_last_name || null,
          rut: guarantor.rut?.substring(0, 12) || null,
          profession: guarantor.profession || null,
          monthly_income: guarantor.entityType === 'natural' ? (parseInt(guarantor.monthly_income_clp || '0') || 0) : 0,
          net_monthly_income_clp: guarantor.entityType === 'juridica' ? (parseInt(guarantor.net_monthly_income_clp || '0') || 0) : 0,
          unit_type: guarantor.unit_type || 'Casa',
          contact_email: guarantor.contact_email || null,
          contact_phone: null, // Campo requerido por la tabla pero no usado en el formulario
          address_street: guarantor.address_street || null,
          address_number: guarantor.address_number?.substring(0, 10) || null,
          address_department: guarantor.address_department?.substring(0, 10) || null,
          address_commune: guarantor.address_commune || null,
          address_region: guarantor.address_region || null,
          // Campos para personas jurídicas
          company_name: guarantor.company_name || null,
          company_rut: guarantor.company_rut?.substring(0, 12) || null,
          legal_representative_name: guarantor.entityType === 'juridica' ?
            `${guarantor.legal_representative_first_name || ''} ${guarantor.legal_representative_paternal_last_name || ''} ${guarantor.legal_representative_maternal_last_name || ''}`.trim() || null : null,
          legal_representative_rut: guarantor.legal_representative_rut?.substring(0, 12) || null,
          constitution_type: guarantor.constitution_type || null,
          constitution_date: guarantor.constitution_date || null,
          constitution_cve: guarantor.constitution_cve?.substring(0, 50) || null,
          constitution_notary: guarantor.constitution_notary || null,
          repertory_number: guarantor.repertory_number?.substring(0, 50) || null,
          created_by: user.id
        }));

        const { error: guarantorsError } = await supabase
          .from('application_guarantors')
          .insert(guarantorInserts);

        if (guarantorsError) {
          console.error('❌ Error creando avales:', guarantorsError);
          throw new Error(`Error creando avales: ${guarantorsError.message}`);
        }
        console.log('✅ Avales creados exitosamente');
      }

      // PASO 5: Subir documentos de postulantes
      console.log('📄 Subiendo documentos de postulantes...');

      // Obtener los IDs de los postulantes creados para subir documentos
      const { data: createdApplicants, error: fetchApplicantsError } = await supabase
        .from('application_applicants')
        .select('id, application_id')
        .eq('application_id', application.id)
        .order('created_at');

      if (fetchApplicantsError) {
        console.error('❌ Error obteniendo IDs de postulantes:', fetchApplicantsError);
        throw new Error(`Error obteniendo postulantes: ${fetchApplicantsError.message}`);
      }

      // Subir documentos de cada postulante
      for (let i = 0; i < applicants.length; i++) {
        const applicant = applicants[i];
        const createdApplicant = createdApplicants[i];

        if (applicant.documents && applicant.documents.length > 0) {
          await uploadApplicantDocuments(
            createdApplicant.id,
            applicant.documents,
            user.id,
            i
          );
        }
      }

      // PASO 6: Subir documentos de avales
      console.log('📄 Subiendo documentos de avales...');

      if (guarantors.length > 0) {
        // Obtener los IDs de los avales creados
        const { data: createdGuarantors, error: fetchGuarantorsError } = await supabase
          .from('application_guarantors')
          .select('id, application_id')
          .eq('application_id', application.id)
          .order('created_at');

        if (fetchGuarantorsError) {
          console.error('❌ Error obteniendo IDs de avales:', fetchGuarantorsError);
          throw new Error(`Error obteniendo avales: ${fetchGuarantorsError.message}`);
        }

        // Subir documentos de cada aval
        for (let i = 0; i < guarantors.length; i++) {
          const guarantor = guarantors[i];
          const createdGuarantor = createdGuarantors[i];

          if (guarantor.documents && guarantor.documents.length > 0) {
            await uploadGuarantorDocuments(
              createdGuarantor.id,
              guarantor.documents,
              user.id,
              i
            );
          }
        }
      }

      // Éxito - llamar callback y navegar
      console.log('🎉 ¡Postulación enviada exitosamente!');
      if (onSuccess) {
        onSuccess();
      }

    } catch (error: any) {
      console.error('💥 Error enviando postulación:', error);
      setError(error.message || 'Error desconocido al enviar la postulación');
    } finally {
      setLoading(false);
    }
  };

  // Renderizar loading si está cargando perfil
  if (profileLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
        <span className="ml-3 text-gray-600">Cargando perfil...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-4 sm:p-8 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20 rounded-2xl shadow-2xl border border-gray-200">
      {/* Header con información de la propiedad mejorado */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            {editMode ? 'Editar Postulación' : 'Postulación de Arriendo'}
          </h2>
        </div>

        <div className="bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-white/20">
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Propiedad: {property.address_street} {property.address_number}
          </h3>
          <p className="text-gray-600 mb-2">{property.address_commune}, {property.address_region}</p>
          <p className="text-2xl font-bold text-green-600">
            {formatPriceCLP(property.price_clp)}/mes
          </p>
        </div>
      </div>

      {/* SECCIÓN 0: Mensaje de la Postulación */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
            <MessageSquarePlus className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
              Mensaje de la Postulación
            </h3>
            <p className="text-sm text-gray-600">Mensaje personalizado para el arrendador</p>
          </div>
        </div>

        <div className="bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-white/20">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mensaje (opcional)
          </label>
          <textarea
            value={applicationMessage}
            onChange={(e) => setApplicationMessage(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Escribe un mensaje personalizado para el arrendador explicando por qué eres el candidato ideal..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Este mensaje será visible para el arrendador junto con tu postulación.
          </p>
        </div>
      </div>

      {/* SECCIÓN 1: Datos de los Postulantes */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                Datos de los Postulantes
              </h3>
              <p className="text-sm text-gray-600">Información personal y laboral</p>
            </div>
          </div>
        </div>

        {/* Cards de postulantes */}
        <div className="space-y-6">
          {applicants.map((applicant, index) => renderApplicantCard(applicant, index))}
        </div>
      </div>

      {/* SECCIÓN 2: Datos de Aval o Garante con diseño mejorado */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <UserCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                Datos de Aval o Garante
              </h3>
              <p className="text-sm text-gray-600">Opcional - máximo 3 garantes</p>
            </div>
          </div>

          {/* Botón para agregar primer aval si no hay ninguno */}
          {guarantors.length === 0 && (
            <button
              type="button"
              onClick={addGuarantor}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              <Plus className="h-5 w-5" />
              Agregar Aval
            </button>
          )}
        </div>

        {/* Cards de avales */}
        {guarantors.length > 0 && (
          <div className="space-y-6">
            {guarantors.map((guarantor, index) => renderGuarantorCard(guarantor, index))}
          </div>
        )}
      </div>

      {/* SECCIÓN 3: Mensaje al Propietario con diseño mejorado */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <MessageSquarePlus className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
              Mensaje al Propietario
            </h3>
            <p className="text-sm text-gray-600">Información adicional para el propietario</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">Postulación Automática</h4>
                <p className="text-sm text-blue-800">
                  Tu postulación será enviada automáticamente al propietario de la propiedad.
                  Las validaciones estrictas (RUT, documentos, etc.) están deshabilitadas para facilitar el proceso.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mostrar errores generales */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="font-medium text-red-800">Error:</span>
          </div>
          <p className="text-red-700 mt-1">{error}</p>
        </div>
      )}

      {/* Mostrar errores de validación general */}
      {validationErrors.general.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="font-medium text-red-800">Errores de validación:</span>
          </div>
          <ul className="list-disc list-inside text-red-700 space-y-1">
            {validationErrors.general.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex flex-col sm:flex-row gap-4 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-semibold shadow-md hover:shadow-lg touch-manipulation"
        >
          <X className="h-5 w-5" />
          <span>Cancelar</span>
        </button>

        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 touch-manipulation text-lg"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>{editMode ? 'Actualizando postulación...' : 'Enviando postulación...'}</span>
            </>
          ) : (
            <>
              <Send className="h-5 w-5" />
              <span>{editMode ? 'Actualizar Postulación' : 'Enviar Postulación'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default RentalApplicationForm;
