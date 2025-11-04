import React, { useState, useEffect } from 'react';
import { X, Send, User, AlertCircle, ExternalLink, Building, FileText, MessageSquarePlus, CheckCircle, Home, Plus, Minus, Building2, Users, UserCheck } from 'lucide-react';
import { supabase, Property, Profile, formatPriceCLP, formatRUT, CHILE_REGIONS, MARITAL_STATUS_OPTIONS, FILE_SIZE_LIMITS, validateRUT, getCurrentProfile, getPropertyTypeInfo } from '../../lib/supabase';
import { webhookClient } from '../../lib/webhook';

interface RentalApplicationFormProps {
  property: Property;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Tipos para entidades
type EntityType = 'natural' | 'juridica';
type ConstitutionType = 'empresa_un_dia' | 'tradicional';

// Interface para datos de postulante
interface ApplicantData {
  id?: string; // Para identificar slots únicos
  entityType: EntityType;

  // Campos comunes
  first_name: string;
  paternal_last_name?: string;
  maternal_last_name?: string;
  rut: string;
  profession?: string;
  monthly_income_clp: string;
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
  legal_representative_name?: string;
  legal_representative_rut?: string;
  constitution_type?: ConstitutionType;
  constitution_date?: string;
  constitution_cve?: string;
  constitution_notary?: string;
}

// Interface para datos de aval
interface GuarantorData {
  id?: string; // Para identificar slots únicos
  entityType: EntityType;

  // Campos comunes
  first_name?: string;
  paternal_last_name?: string;
  maternal_last_name?: string;
  rut: string;
  profession?: string;
  monthly_income_clp?: string;
  contact_email?: string;
  address_street?: string;
  address_number?: string;
  address_department?: string;
  address_commune?: string;
  address_region?: string;

  // Campos específicos para personas jurídicas
  company_name?: string;
  company_rut?: string;
  legal_representative_name?: string;
  legal_representative_rut?: string;
  constitution_type?: ConstitutionType;
  constitution_date?: string;
  constitution_cve?: string;
  constitution_notary?: string;
}

const RentalApplicationForm: React.FC<RentalApplicationFormProps> = ({
  property,
  onSuccess,
  onCancel
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [profileIncomplete, setProfileIncomplete] = useState(false);

  // Estado para postulantes múltiples (máximo 3)
  const [applicants, setApplicants] = useState<ApplicantData[]>([
    {
      id: 'applicant-1',
      entityType: 'natural',
      first_name: '',
      paternal_last_name: '',
      maternal_last_name: '',
      rut: '',
      profession: '',
      monthly_income_clp: '',
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
    }
  ]);

  // Estado para avales múltiples (máximo 3)
  const [guarantors, setGuarantors] = useState<GuarantorData[]>([]);

  // Estados para trabajadores independientes (uno por postulante/aval)
  const [independentWorkers, setIndependentWorkers] = useState<{[key: string]: boolean}>({});
  const [guarantorIndependentWorkers, setGuarantorIndependentWorkers] = useState<{[key: string]: boolean}>({});

  // Estados de validación
  const [validationErrors, setValidationErrors] = useState<{
    applicants: {[key: string]: string[]};
    guarantors: {[key: string]: string[]};
    general: string[];
  }>({
    applicants: {},
    guarantors: {},
    general: []
  });

  const [message, setMessage] = useState('');

  // Documentos individuales del postulante
  const [applicantDocuments, setApplicantDocuments] = useState({
    cedula: null as File | null,
    contrato: null as File | null,
    liquidaciones: null as File | null,
    cotizaciones: null as File | null,
    dicom: null as File | null,
    // Campos opcionales para trabajadores independientes
    formulario22: null as File | null,
    resumenBoletas: null as File | null,
  });

  // Documentos individuales del aval
  const [guarantorDocuments, setGuarantorDocuments] = useState({
    cedula: null as File | null,
    contrato: null as File | null,
    liquidaciones: null as File | null,
    cotizaciones: null as File | null,
    dicom: null as File | null,
    // Campos opcionales para trabajadores independientes del aval
    formulario22: null as File | null,
    resumenBoletas: null as File | null,
  });

  // Estados para validación en tiempo real
  const [rutValidation, setRutValidation] = useState<{
    [key: string]: { isValid: boolean | null; message: string };
  }>({});

  // Usar constantes compartidas
  const regions = CHILE_REGIONS;

  // Funciones para manejar postulantes múltiples
  const addApplicant = () => {
    if (applicants.length < 3) {
      const newId = `applicant-${applicants.length + 1}`;
      setApplicants(prev => [...prev, {
        id: newId,
        entityType: 'natural',
        first_name: '',
        paternal_last_name: '',
        maternal_last_name: '',
        rut: '',
        profession: '',
        monthly_income_clp: '',
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
    setApplicants(prev => prev.map((applicant, i) =>
      i === index ? { ...applicant, [field]: value } : applicant
    ));
  };

  // Funciones para manejar avales múltiples
  const addGuarantor = () => {
    if (guarantors.length < 3) {
      const newId = `guarantor-${guarantors.length + 1}`;
      setGuarantors(prev => [...prev, {
        id: newId,
        entityType: 'natural',
        rut: '',
        profession: '',
        monthly_income_clp: '',
        contact_email: '',
        address_street: '',
        address_number: '',
        address_department: '',
        address_commune: '',
        address_region: '',
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
    setGuarantors(prev => prev.map((guarantor, i) =>
      i === index ? { ...guarantor, [field]: value } : guarantor
    ));
  };

  // Funciones de validación
  const validateApplicant = (applicant: ApplicantData): string[] => {
    const errors: string[] = [];

    // Validaciones comunes
    if (!applicant.first_name?.trim()) errors.push('Nombre es requerido');
    if (!applicant.rut?.trim()) errors.push('RUT es requerido');
    if (!applicant.profession?.trim()) errors.push('Profesión es requerida');
    if (!applicant.monthly_income_clp) errors.push('Ingreso mensual es requerido');
    if (!applicant.address_street?.trim()) errors.push('Calle es requerida');
    if (!applicant.address_number?.trim()) errors.push('Número es requerido');
    if (!applicant.address_commune?.trim()) errors.push('Comuna es requerida');
    if (!applicant.address_region) errors.push('Región es requerida');

    if (applicant.entityType === 'natural') {
      if (!applicant.paternal_last_name?.trim()) errors.push('Apellido paterno es requerido');
      if (!applicant.age) errors.push('Edad es requerida');
      if (!applicant.nationality?.trim()) errors.push('Nacionalidad es requerida');
      if (!applicant.marital_status) errors.push('Estado civil es requerido');
      if (!applicant.phone?.trim()) errors.push('Teléfono es requerido');
      if (!applicant.email?.trim()) errors.push('Email es requerido');
    } else if (applicant.entityType === 'juridica') {
      if (!applicant.company_name?.trim()) errors.push('Razón social es requerida');
      if (!applicant.company_rut?.trim()) errors.push('RUT empresa es requerido');
      if (!applicant.legal_representative_name?.trim()) errors.push('Representante legal es requerido');
      if (!applicant.legal_representative_rut?.trim()) errors.push('RUT representante es requerido');
      if (!applicant.constitution_type) errors.push('Tipo de constitución es requerido');
    }

    return errors;
  };

  const validateGuarantor = (guarantor: GuarantorData): string[] => {
    const errors: string[] = [];

    // Validaciones comunes
    if (!guarantor.rut?.trim()) errors.push('RUT es requerido');
    if (!guarantor.address_street?.trim()) errors.push('Calle es requerida');
    if (!guarantor.address_number?.trim()) errors.push('Número es requerido');
    if (!guarantor.address_commune?.trim()) errors.push('Comuna es requerida');
    if (!guarantor.address_region) errors.push('Región es requerida');

    if (guarantor.entityType === 'natural') {
      if (!guarantor.first_name?.trim()) errors.push('Nombre es requerido');
      if (!guarantor.paternal_last_name?.trim()) errors.push('Apellido paterno es requerido');
      if (!guarantor.profession?.trim()) errors.push('Profesión es requerida');
      if (!guarantor.contact_email?.trim()) errors.push('Email de contacto es requerido');
      if (!guarantor.monthly_income_clp) errors.push('Ingreso mensual es requerido');
    } else if (guarantor.entityType === 'juridica') {
      if (!guarantor.company_name?.trim()) errors.push('Razón social es requerida');
      if (!guarantor.company_rut?.trim()) errors.push('RUT empresa es requerido');
      if (!guarantor.legal_representative_name?.trim()) errors.push('Representante legal es requerido');
      if (!guarantor.legal_representative_rut?.trim()) errors.push('RUT representante es requerido');
      if (!guarantor.constitution_type) errors.push('Tipo de constitución es requerido');
    }

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

    // Validar unicidad de RUT
    const allRuts = [
      ...applicants.map(a => ({ rut: a.rut, type: 'postulante', entity: a.entityType === 'juridica' ? a.company_rut : a.rut })),
      ...guarantors.map(g => ({ rut: g.rut, type: 'aval', entity: g.entityType === 'juridica' ? g.company_rut : g.rut }))
    ].filter(item => item.rut);

    const rutCounts = allRuts.reduce((acc, item) => {
      acc[item.rut] = (acc[item.rut] || 0) + 1;
      return acc;
    }, {} as {[key: string]: number});

    const duplicateRuts = Object.entries(rutCounts).filter(([, count]) => count > 1).map(([rut]) => rut);

    if (duplicateRuts.length > 0) {
      newValidationErrors.general.push(`RUT duplicado encontrado: ${duplicateRuts.join(', ')}`);
    }

    // Validar unicidad de email para postulantes naturales
    const applicantEmails = applicants
      .filter(a => a.entityType === 'natural' && a.email)
      .map(a => a.email);

    const emailCounts = applicantEmails.reduce((acc, email) => {
      acc[email] = (acc[email] || 0) + 1;
      return acc;
    }, {} as {[key: string]: number});

    const duplicateEmails = Object.entries(emailCounts).filter(([, count]) => count > 1).map(([email]) => email);

    if (duplicateEmails.length > 0) {
      newValidationErrors.general.push(`Email duplicado encontrado: ${duplicateEmails.join(', ')}`);
    }

    setValidationErrors(newValidationErrors);

    // Retornar true si no hay errores
    return Object.keys(newValidationErrors.applicants).length === 0 &&
           Object.keys(newValidationErrors.guarantors).length === 0 &&
           newValidationErrors.general.length === 0;
  };

  // Precarga de datos del perfil del usuario usando la API getCurrentProfile()
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
              address_street: profile.address_street || '',
              address_number: profile.address_number || '',
              address_department: profile.address_department || '',
              address_commune: profile.address_commune || '',
              address_region: profile.address_region || '',
              nationality: (profile as any).nationality || 'Chilena',
            } : applicant
          ));

          // Verificar si el perfil está incompleto
          const essentialFields = ['rut', 'profession', 'phone', 'address_street', 'address_number', 'address_commune', 'address_region', 'nationality'];
          const isIncomplete = essentialFields.some(field => !(profile as any)[field]);
          setProfileIncomplete(isIncomplete);
        } else {
          setProfileIncomplete(true);
        }
      } catch (err) {
        console.error('Error loading user profile:', err);
        setError('Error cargando perfil de usuario. Por favor, verifica tu conexión.');
        setProfileIncomplete(true);
      } finally {
        setProfileLoading(false);
      }
    };

    loadUserProfile();
  }, []);

  const handleApplicantChange = (index: number) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    updateApplicant(index, name, value);
  };

  const handleGuarantorChange = (index: number) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    updateGuarantor(index, name, value);
  };

  const handleRUTChange = (entityId: string, type: 'applicant' | 'guarantor') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formattedRUT = formatRUT(value);

    // Validación en tiempo real del RUT
    const cleanRUT = formattedRUT.replace(/[.-]/g, '');
    let validationResult = { isValid: null as boolean | null, message: '' };

    if (cleanRUT.length === 0) {
      validationResult = { isValid: null, message: '' };
    } else if (cleanRUT.length < 8) {
      validationResult = { isValid: false, message: 'RUT muy corto' };
    } else if (cleanRUT.length > 9) {
      validationResult = { isValid: false, message: 'RUT muy largo' };
    } else if (!validateRUT(cleanRUT)) {
      validationResult = { isValid: false, message: 'RUT inválido' };
    } else {
      validationResult = { isValid: true, message: 'RUT válido ✓' };
    }

    // Actualizar estado del RUT y validación
    if (type === 'applicant') {
      const applicantIndex = applicants.findIndex(a => a.id === entityId);
      if (applicantIndex !== -1) {
        updateApplicant(applicantIndex, 'rut', formattedRUT);
      }
    } else {
      const guarantorIndex = guarantors.findIndex(g => g.id === entityId);
      if (guarantorIndex !== -1) {
        updateGuarantor(guarantorIndex, 'rut', formattedRUT);
      }
    }

    setRutValidation(prev => ({
      ...prev,
      [entityId]: validationResult
    }));
  };

  // Componente para renderizar un postulante individual
  const renderApplicantCard = (applicant: ApplicantData, index: number) => {
    const applicantId = applicant.id || `applicant-${index + 1}`;
    const rutValidationKey = applicantId;
    const isIndependentWorker = independentWorkers[applicantId] || false;
    const applicantErrors = validationErrors.applicants[applicantId] || [];

    return (
      <div key={applicantId} className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 relative">
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

        {/* Campos condicionales según tipo de entidad */}
        {applicant.entityType === 'natural' ? (
          // Campos para persona natural
          <>
            {/* Información Personal */}
            <div className="mb-6">
              <h5 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="h-4 w-4" />
                Información Personal
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={applicant.first_name}
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
                    value={applicant.paternal_last_name}
                    onChange={handleApplicantChange(index)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apellido Materno
                  </label>
                  <input
                    type="text"
                    name="maternal_last_name"
                    value={applicant.maternal_last_name}
                    onChange={handleApplicantChange(index)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    RUT *
                  </label>
                  <input
                    type="text"
                    value={applicant.rut}
                    onChange={handleRUTChange(applicantId, 'applicant')}
                    className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      rutValidation[rutValidationKey]?.isValid === true
                        ? 'border-green-500 bg-green-50'
                        : rutValidation[rutValidationKey]?.isValid === false
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-300'
                    }`}
                    placeholder="12.345.678-9"
                    required
                  />
                  {rutValidation[rutValidationKey]?.message && (
                    <p className={`text-sm mt-1 ${
                      rutValidation[rutValidationKey].isValid === true
                        ? 'text-green-600'
                        : rutValidation[rutValidationKey].isValid === false
                        ? 'text-red-600'
                        : 'text-gray-500'
                    }`}>
                      {rutValidation[rutValidationKey].message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Edad *
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={applicant.age}
                    onChange={handleApplicantChange(index)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                    min="18"
                    max="120"
                  />
                  {applicant.age && (parseInt(applicant.age) < 18 || parseInt(applicant.age) > 120) && (
                    <p className="text-sm text-amber-600 mt-1">
                      ⚠️ Edad fuera del rango típico (18-120 años)
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado Civil *
                  </label>
                  <select
                    name="marital_status"
                    value={applicant.marital_status}
                    onChange={handleApplicantChange(index)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    {MARITAL_STATUS_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Información Laboral y Contacto */}
            <div className="mb-6">
              <h5 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building className="h-4 w-4" />
                Información Laboral y Contacto
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                    Ingreso Mensual (CLP) *
                  </label>
                  <input
                    type="number"
                    name="monthly_income_clp"
                    value={applicant.monthly_income_clp}
                    onChange={handleApplicantChange(index)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                    min="0"
                  />
                  {applicant.monthly_income_clp && (
                    <p className="text-sm text-green-600 mt-1 font-medium">
                      💰 {formatPriceCLP(parseInt(applicant.monthly_income_clp))}
                    </p>
                  )}
                </div>
              </div>

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
            </div>
          </>
        ) : (
          // Campos para persona jurídica
          <>
            {/* Información de la Empresa */}
            <div className="mb-6">
              <h5 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Información de la Empresa
              </h5>
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
                    value={applicant.company_rut}
                    onChange={(e) => {
                      const formatted = formatRUT(e.target.value);
                      updateApplicant(index, 'company_rut', formatted);
                    }}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="12.345.678-9"
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Representante Legal *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="legal_representative_name"
                    value={applicant.legal_representative_name}
                    onChange={handleApplicantChange(index)}
                    placeholder="Nombre completo"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                  <input
                    type="text"
                    value={applicant.legal_representative_rut}
                    onChange={(e) => {
                      const formatted = formatRUT(e.target.value);
                      updateApplicant(index, 'legal_representative_rut', formatted);
                    }}
                    placeholder="RUT del representante"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Constitución *
                </label>
                <select
                  name="constitution_type"
                  value={applicant.constitution_type}
                  onChange={handleApplicantChange(index)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="">Seleccionar tipo</option>
                  <option value="empresa_un_dia">Empresa en un Día</option>
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
              </div>
            </div>
          </>
        )}

        {/* Dirección (común para ambos tipos) */}
        <div className="mb-6">
          <h5 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Home className="h-4 w-4" />
            Dirección Actual
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              name="address_street"
              value={applicant.address_street}
              onChange={handleApplicantChange(index)}
              placeholder="Calle"
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
              maxLength={10}
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              name="address_department"
              value={applicant.address_department}
              onChange={handleApplicantChange(index)}
              placeholder="Depto (opcional)"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              maxLength={10}
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
              <option value="">Seleccionar región</option>
              {regions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Mostrar errores de validación */}
        {applicantErrors.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">Errores encontrados:</span>
            </div>
            <ul className="text-sm text-red-700 space-y-1">
              {applicantErrors.map((error, idx) => (
                <li key={idx} className="flex items-start gap-1">
                  <span className="text-red-500">•</span>
                  {error}
                </li>
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
    const rutValidationKey = guarantorId;
    const guarantorErrors = validationErrors.guarantors[guarantorId] || [];

    return (
      <div key={guarantorId} className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 relative">
        {/* Header del card con controles */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <UserCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-gray-900">
                Aval {index + 1}
              </h4>
              <p className="text-sm text-gray-600">Datos del garante</p>
            </div>
          </div>

          {/* Controles de agregar/remover */}
          <div className="flex items-center gap-2">
            {guarantors.length > 1 && (
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

        {/* Campos condicionales según tipo de entidad */}
        {guarantor.entityType === 'natural' ? (
          // Campos para persona natural
          <>
            {/* Información Personal */}
            <div className="mb-6">
              <h5 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="h-4 w-4" />
                Información Personal
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={guarantor.first_name}
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
                    value={guarantor.paternal_last_name}
                    onChange={handleGuarantorChange(index)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apellido Materno
                  </label>
                  <input
                    type="text"
                    name="maternal_last_name"
                    value={guarantor.maternal_last_name}
                    onChange={handleGuarantorChange(index)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    RUT *
                  </label>
                  <input
                    type="text"
                    value={guarantor.rut}
                    onChange={handleRUTChange(guarantorId, 'guarantor')}
                    className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                      rutValidation[rutValidationKey]?.isValid === true
                        ? 'border-green-500 bg-green-50'
                        : rutValidation[rutValidationKey]?.isValid === false
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-300'
                    }`}
                    placeholder="12.345.678-9"
                    required
                  />
                  {rutValidation[rutValidationKey]?.message && (
                    <p className={`text-sm mt-1 ${
                      rutValidation[rutValidationKey].isValid === true
                        ? 'text-green-600'
                        : rutValidation[rutValidationKey].isValid === false
                        ? 'text-red-600'
                        : 'text-gray-500'
                    }`}>
                      {rutValidation[rutValidationKey].message}
                    </p>
                  )}
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ingreso Mensual (CLP) *
                  </label>
                  <input
                    type="number"
                    name="monthly_income_clp"
                    value={guarantor.monthly_income_clp}
                    onChange={handleGuarantorChange(index)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    required
                    min="0"
                  />
                  {guarantor.monthly_income_clp && (
                    <p className="text-sm text-green-600 mt-1 font-medium">
                      💰 {formatPriceCLP(parseInt(guarantor.monthly_income_clp))}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          // Campos para persona jurídica
          <>
            {/* Información de la Empresa */}
            <div className="mb-6">
              <h5 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Información de la Empresa
              </h5>
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
                    value={guarantor.company_rut}
                    onChange={(e) => {
                      const formatted = formatRUT(e.target.value);
                      updateGuarantor(index, 'company_rut', formatted);
                    }}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="12.345.678-9"
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Representante Legal *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="legal_representative_name"
                    value={guarantor.legal_representative_name}
                    onChange={handleGuarantorChange(index)}
                    placeholder="Nombre completo"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    required
                  />
                  <input
                    type="text"
                    value={guarantor.legal_representative_rut}
                    onChange={(e) => {
                      const formatted = formatRUT(e.target.value);
                      updateGuarantor(index, 'legal_representative_rut', formatted);
                    }}
                    placeholder="RUT del representante"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Constitución *
                </label>
                <select
                  name="constitution_type"
                  value={guarantor.constitution_type}
                  onChange={handleGuarantorChange(index)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                >
                  <option value="">Seleccionar tipo</option>
                  <option value="empresa_un_dia">Empresa en un Día</option>
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
              </div>
            </div>
          </>
        )}

        {/* Dirección (común para ambos tipos) */}
        <div className="mb-6">
          <h5 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Home className="h-4 w-4" />
            Dirección Actual
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              name="address_street"
              value={guarantor.address_street}
              onChange={handleGuarantorChange(index)}
              placeholder="Calle"
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
              maxLength={10}
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              name="address_department"
              value={guarantor.address_department}
              onChange={handleGuarantorChange(index)}
              placeholder="Depto (opcional)"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              maxLength={10}
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
              <option value="">Seleccionar región</option>
              {regions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Mostrar errores de validación */}
        {guarantorErrors.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">Errores encontrados:</span>
            </div>
            <ul className="text-sm text-red-700 space-y-1">
              {guarantorErrors.map((error, idx) => (
                <li key={idx} className="flex items-start gap-1">
                  <span className="text-red-500">•</span>
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const uploadDocuments = async (documents: { [key: string]: File | null }, entityId: string, entityType: 'application_applicant' | 'application_guarantor') => {
    // Convertir el objeto de documentos a un array de archivos válidos
    const files = Object.values(documents).filter((file): file is File => file !== null);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Usuario no autenticado o sesión expirada');
    }

    // Validar que el usuario tenga permisos para subir documentos
    // Según las políticas RLS, solo el propietario puede subir documentos de su propiedad
    if (entityType === 'application_applicant') {
      // Verificar que la aplicación pertenece al usuario actual
      const { data: application, error: appError } = await supabase
        .from('applications')
        .select('applicant_id')
        .eq('id', entityId)
        .single();

      if (appError) {
        throw new Error(`Error verificando permisos: ${appError.message}`);
      }

      if (application.applicant_id !== user.id) {
        throw new Error('No tienes permisos para subir documentos en esta aplicación');
      }
    }

    const uploadedDocuments = [];

    for (const file of files) {
      // Validar tipo de archivo
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`Tipo de archivo no permitido: ${file.type}. Solo se permiten PDF, DOC y DOCX.`);
      }

      // Validar tamaño del archivo (máximo según constantes compartidas)
      const maxSize = FILE_SIZE_LIMITS.DOCUMENT_MAX_SIZE;
      if (file.size > maxSize) {
        throw new Error(`Archivo demasiado grande: ${file.name}. Tamaño máximo: 50MB.`);
      }

      // const fileExt = file.name.split('.').pop(); // Not used in current sanitized filename approach
      // Estructura de carpetas según políticas RLS: {user_id}/{entity_type}/{entity_id}/{timestamp}-{filename}
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${user.id}/${entityType}/${entityId}/${timestamp}-${sanitizedFileName}`;

      console.log(`📤 Subiendo documento: ${fileName}`);

      const { data, error } = await supabase.storage
        .from('user-documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error subiendo a storage:', error);
        throw new Error(`Error subiendo documento ${file.name}: ${error.message}`);
      }

      // Guardar referencia en la base de datos
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          uploader_id: user.id,
          related_entity_id: entityId,
          related_entity_type: entityType,
          document_type: file.type,
          storage_path: data.path,
          file_name: sanitizedFileName
        });

      if (dbError) {
        console.error('Error guardando en BD:', dbError);
        // Intentar eliminar el archivo del storage si falló la inserción en BD
        try {
          await supabase.storage
            .from('user-documents')
            .remove([data.path]);
        } catch (cleanupError) {
          console.error('Error limpiando archivo del storage:', cleanupError);
        }
        throw new Error(`Error guardando referencia del documento: ${dbError.message}`);
      }

      uploadedDocuments.push({
        fileName: sanitizedFileName,
        storagePath: data.path
      });
    }

    return uploadedDocuments;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Ejecutar validaciones
    const isValid = validateForm();
    if (!isValid) {
      setLoading(false);
      setError('Por favor, corrige los errores en el formulario antes de continuar.');
      return;
    }

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        throw new Error('Error de autenticación: ' + userError.message);
      }
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // ✅ BETA: Validación de RUT suavizada - solo advertencia en consola para todos los postulantes y avales
      applicants.forEach((applicant, index) => {
        if (applicant.rut && !validateRUT(applicant.rut)) {
          console.warn(`⚠️ ADVERTENCIA: RUT del postulante ${index + 1} podría ser inválido:`, applicant.rut);
        }
      });

      guarantors.forEach((guarantor, index) => {
        if (guarantor.rut && !validateRUT(guarantor.rut)) {
          console.warn(`⚠️ ADVERTENCIA: RUT del aval ${index + 1} podría ser inválido:`, guarantor.rut);
        }
      });

      // PASO 1: Asegurar que existe el profile del usuario (requerido por FK)
      console.log('🔍 DEBUG: Verificando/creando profile del usuario...');
      try {
        // ✅ TEMPORARILY DISABLED: Permitir RUTs duplicados entre usuarios para facilitar desarrollo y pruebas
        // TODO: RESTAURAR ANTES DE PRODUCCIÓN - Rehabilitar validación de unicidad de RUT
        // En producción, re-habilitar esta validación para mantener integridad de datos
        /*
        const { data: existingProfileWithRUT, error: rutCheckError } = await supabase
          .from('profiles')
          .select('id')
          .eq('rut', applicantData.rut)
          .neq('id', user.id) // Excluir el propio perfil del usuario
          .maybeSingle();

        if (rutCheckError) {
          throw new Error(`Error verificando RUT: ${rutCheckError.message}`);
        }

        if (existingProfileWithRUT) {
          throw new Error('El RUT ingresado ya está registrado para otro usuario. Por favor, verifica tus datos.');
        }
        */

        console.log('ℹ️ TEMPORARILY DISABLED: Verificación de RUT duplicado deshabilitada para desarrollo');

        // TODO: RESTAURAR UPSERT ANTES DE PRODUCCIÓN - Implementar lógica manual select->update/insert sin onConflict
        // En producción, restaurar:
        // const { error: profileError } = await supabase.from('profiles').upsert({...}, { onConflict: 'id' });
        // Y re-habilitar restricciones UNIQUE en rut tanto en BD como validaciones frontend

        // Lógica manual sin onConflict (para ambiente de pruebas sin restricciones UNIQUE)
        console.log('🔍 Verificando si existe perfil del usuario...');
        const { data: existingProfile, error: checkError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        if (checkError) {
          console.log('❌ Error verificando perfil existente:', checkError);
          throw new Error(`Error verificando perfil de usuario: ${checkError.message}`);
        }

        let profileError;
        if (existingProfile) {
          // Existe - hacer UPDATE
          console.log('🔄 Actualizando perfil existente del usuario...');
          const { error } = await supabase
            .from('profiles')
            .update({
              first_name: applicantData.first_name,
              paternal_last_name: applicantData.paternal_last_name,
              maternal_last_name: applicantData.maternal_last_name,
              email: user.email || '',
              rut: applicantData.rut,
              phone: applicantData.phone || null,
              address_street: applicantData.address_street,
              address_number: applicantData.address_number,
              address_commune: applicantData.address_commune,
              address_region: applicantData.address_region,
              profession: applicantData.profession,
              marital_status: applicantData.marital_status,
            })
            .eq('id', user.id);
          profileError = error;
        } else {
          // No existe - hacer INSERT
          console.log('🆕 Creando nuevo perfil del usuario...');
          const { error } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              first_name: applicantData.first_name,
              paternal_last_name: applicantData.paternal_last_name,
              maternal_last_name: applicantData.maternal_last_name,
              email: user.email || '',
              rut: applicantData.rut,
              phone: applicantData.phone || null,
              address_street: applicantData.address_street,
              address_number: applicantData.address_number,
              address_commune: applicantData.address_commune,
              address_region: applicantData.address_region,
              profession: applicantData.profession,
              marital_status: applicantData.marital_status,
            });
          profileError = error;
        }

        if (profileError) {
          console.log('❌ DEBUG: Error en operación de perfil:', profileError);
          throw new Error(`Error preparando perfil de usuario: ${profileError.message}`);
        }
        console.log('✅ DEBUG: Profile del usuario asegurado');
      } catch (error) {
        console.log('💥 DEBUG: Error en upsert de profile:', error);
        throw error;
      }

      // PASO 2: Crear la aplicación
      let application;
      
      console.log('🔍 DEBUG: Iniciando proceso de postulación');
      console.log('🔍 DEBUG: property.id =', property.id);
      console.log('🔍 DEBUG: user.id =', user.id);

      // Preparar datos de la application (usando datos del primer postulante como snapshot)
      const firstApplicant = applicants[0];
      const applicationData = {
        property_id: property.id,
        applicant_id: user.id,
        message: message,
        // Campos snapshot requeridos (NOT NULL) - usando datos del primer postulante
        snapshot_applicant_profession: firstApplicant.profession || '',
        snapshot_applicant_monthly_income_clp: parseInt(firstApplicant.monthly_income_clp) || 0,
        snapshot_applicant_age: parseInt(firstApplicant.age) || 0,
        snapshot_applicant_nationality: firstApplicant.nationality,
        snapshot_applicant_marital_status: firstApplicant.marital_status || 'soltero',
        snapshot_applicant_address_street: firstApplicant.address_street,
        snapshot_applicant_address_number: firstApplicant.address_number,
        snapshot_applicant_address_department: firstApplicant.address_department || null,
        snapshot_applicant_address_commune: firstApplicant.address_commune,
        snapshot_applicant_address_region: firstApplicant.address_region,
        // Campos snapshot de identificación del postulante
        snapshot_applicant_first_name: firstApplicant.first_name,
        snapshot_applicant_paternal_last_name: firstApplicant.paternal_last_name || '',
        snapshot_applicant_maternal_last_name: firstApplicant.maternal_last_name || '',
        snapshot_applicant_rut: firstApplicant.rut,
        snapshot_applicant_email: user.email || '',
        snapshot_applicant_phone: firstApplicant.phone || null
      };

      console.log('🔍 DEBUG: Datos preparados para application:', applicationData);

      try {
        // ✅ BETA: Permitir actualizar postulaciones existentes
        console.log('🔍 DEBUG: Verificando postulación existente...');

        const { data: existingApplication, error: fetchError } = await supabase
          .from('applications')
          .select('id, created_at, status')
          .eq('property_id', property.id)
          .eq('applicant_id', user.id)
          .maybeSingle();

        console.log('🔍 DEBUG: Resultado verificación:', { existingApplication, fetchError });

        if (fetchError) {
          console.log('❌ DEBUG: Error en verificación:', fetchError);
          throw new Error(`Error verificando postulación existente: ${fetchError.message}`);
        }

        if (existingApplication) {
          // ✅ BETA: Permitir actualización - UPSERT automático
          console.log('🔄 BETA: Postulación existente encontrada - actualizando...', existingApplication.id);

          // Actualizar la postulación existente con los nuevos datos
          const { data: updatedApplication, error: updateError } = await supabase
            .from('applications')
            .update({
              message: message,
              guarantor_id: guarantorId,
              // Actualizar todos los campos snapshot
              snapshot_applicant_profession: applicantData.profession,
              snapshot_applicant_monthly_income_clp: parseInt(applicantData.monthly_income_clp) || 0,
              snapshot_applicant_age: parseInt(applicantData.age) || 0,
              snapshot_applicant_nationality: applicantData.nationality,
              snapshot_applicant_marital_status: applicantData.marital_status,
              snapshot_applicant_address_street: applicantData.address_street,
              snapshot_applicant_address_number: applicantData.address_number,
              snapshot_applicant_address_department: applicantData.address_department || null,
              snapshot_applicant_address_commune: applicantData.address_commune,
              snapshot_applicant_address_region: applicantData.address_region,
              snapshot_applicant_first_name: applicantData.first_name,
              snapshot_applicant_paternal_last_name: applicantData.paternal_last_name,
              snapshot_applicant_maternal_last_name: applicantData.maternal_last_name,
              snapshot_applicant_rut: applicantData.rut,
              snapshot_applicant_email: user.email || '',
              snapshot_applicant_phone: applicantData.phone || null,
              updated_at: new Date().toISOString() // Registrar actualización
            })
            .eq('id', existingApplication.id)
            .select()
            .single();

          if (updateError) {
            console.log('❌ DEBUG: Error actualizando postulación:', updateError);
            throw new Error(`Error actualizando postulación: ${updateError.message}`);
          }

          application = updatedApplication;
          console.log('✅ BETA: Postulación actualizada exitosamente:', application.id);

        } else {
          // No existe - crear nueva postulación
          console.log('🆕 DEBUG: Creando nueva postulación...');

          const { data: newApplication, error: insertError } = await supabase
            .from('applications')
            .insert([applicationData])
            .select()
            .single();

          if (insertError) {
            console.log('❌ DEBUG: INSERT directo falló:', insertError);

            if (insertError.code === '23505' || insertError.message.includes('duplicate') || insertError.message.includes('conflict')) {
              throw new Error(
                'Conflicto detectado: otro proceso creó una postulación simultáneamente. ' +
                'Por favor, recarga la página y verifica si tu postulación se creó correctamente.'
              );
            } else {
              throw new Error(`Error creando postulación: ${insertError.message}`);
            }
          }

          application = newApplication;
          console.log('✅ DEBUG: Nueva postulación creada:', application.id);
        }

      } catch (error) {
        console.log('💥 DEBUG: Error capturado en try/catch:', error);
        throw error;
      }

      // PASO 3: Crear postulantes en application_applicants
      console.log('👥 Creando postulantes en application_applicants...');
      const applicantInserts = applicants.map(applicant => ({
        application_id: application.id,
        entity_type: applicant.entityType,
        first_name: applicant.first_name,
        paternal_last_name: applicant.paternal_last_name || null,
        maternal_last_name: applicant.maternal_last_name || null,
        rut: applicant.rut,
        profession: applicant.profession || null,
        monthly_income_clp: parseInt(applicant.monthly_income_clp) || 0,
        age: parseInt(applicant.age) || null,
        nationality: applicant.nationality,
        marital_status: applicant.marital_status || null,
        address_street: applicant.address_street,
        address_number: applicant.address_number,
        address_department: applicant.address_department || null,
        address_commune: applicant.address_commune,
        address_region: applicant.address_region,
        phone: applicant.phone || null,
        email: applicant.email || null,
        // Campos para personas jurídicas
        company_name: applicant.company_name || null,
        company_rut: applicant.company_rut || null,
        legal_representative_name: applicant.legal_representative_name || null,
        legal_representative_rut: applicant.legal_representative_rut || null,
        constitution_type: applicant.constitution_type || null,
        constitution_date: applicant.constitution_date || null,
        constitution_cve: applicant.constitution_cve || null,
        constitution_notary: applicant.constitution_notary || null,
        created_by: user.id
      }));

      const { error: applicantsError } = await supabase
        .from('application_applicants')
        .insert(applicantInserts);

      if (applicantsError) {
        console.error('❌ Error creando postulantes:', applicantsError);
        throw new Error(`Error creando postulantes: ${applicantsError.message}`);
      }
      console.log('✅ Postulantes creados exitosamente');

      // PASO 4: Crear avales en application_guarantors (si existen)
      if (guarantors.length > 0) {
        console.log('🛡️ Creando avales en application_guarantors...');
        const guarantorInserts = guarantors.map(guarantor => ({
          application_id: application.id,
          entity_type: guarantor.entityType,
          first_name: guarantor.first_name || null,
          paternal_last_name: guarantor.paternal_last_name || null,
          maternal_last_name: guarantor.maternal_last_name || null,
          rut: guarantor.rut,
          profession: guarantor.profession || null,
          monthly_income: parseInt(guarantor.monthly_income_clp || '0') || 0,
          contact_email: guarantor.contact_email || null,
          address_street: guarantor.address_street || null,
          address_number: guarantor.address_number || null,
          address_department: guarantor.address_department || null,
          address_commune: guarantor.address_commune || null,
          address_region: guarantor.address_region || null,
          // Campos para personas jurídicas
          company_name: guarantor.company_name || null,
          company_rut: guarantor.company_rut || null,
          legal_representative_name: guarantor.legal_representative_name || null,
          legal_representative_rut: guarantor.legal_representative_rut || null,
          constitution_type: guarantor.constitution_type || null,
          constitution_date: guarantor.constitution_date || null,
          constitution_cve: guarantor.constitution_cve || null,
          constitution_notary: guarantor.constitution_notary || null,
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

      // PASO 5: Subir documentos de los postulantes
      // Nota: Por ahora mantenemos la lógica de documentos del primer postulante
      // TODO: Implementar manejo de documentos por postulante individual
      const hasApplicantDocuments = Object.values(applicantDocuments).some(file => file !== null);
      if (hasApplicantDocuments) {
        const uploadedApplicantDocs = await uploadDocuments(applicantDocuments, application.id, 'application_applicant');

        // Actualizar rutas de todos los documentos del postulante en la aplicación
        const updateData: any = {};

        // Documentos tradicionales del postulante
        if (applicantDocuments.cedula) {
          const cedulaDoc = uploadedApplicantDocs.find((doc: any) =>
            doc.fileName.toLowerCase().includes('cedula') ||
            doc.fileName.toLowerCase().includes('identidad')
          );
          if (cedulaDoc) {
            updateData.ruta_cedula_postulante = cedulaDoc.storagePath;
          }
        }

        if (applicantDocuments.contrato) {
          const contratoDoc = uploadedApplicantDocs.find((doc: any) =>
            doc.fileName.toLowerCase().includes('contrato') ||
            doc.fileName.toLowerCase().includes('trabajo')
          );
          if (contratoDoc) {
            updateData.ruta_contrato_postulante = contratoDoc.storagePath;
          }
        }

        if (applicantDocuments.liquidaciones) {
          const liquidacionesDoc = uploadedApplicantDocs.find((doc: any) =>
            doc.fileName.toLowerCase().includes('liquidacion') ||
            doc.fileName.toLowerCase().includes('sueldo')
          );
          if (liquidacionesDoc) {
            updateData.ruta_liquidaciones_postulante = liquidacionesDoc.storagePath;
          }
        }

        if (applicantDocuments.cotizaciones) {
          const cotizacionesDoc = uploadedApplicantDocs.find((doc: any) =>
            doc.fileName.toLowerCase().includes('cotizacion') ||
            doc.fileName.toLowerCase().includes('previsional')
          );
          if (cotizacionesDoc) {
            updateData.ruta_cotizaciones_postulante = cotizacionesDoc.storagePath;
          }
        }

        if (applicantDocuments.dicom) {
          const dicomDoc = uploadedApplicantDocs.find((doc: any) =>
            doc.fileName.toLowerCase().includes('dicom') ||
            doc.fileName.toLowerCase().includes('certificado')
          );
          if (dicomDoc) {
            updateData.ruta_dicom_postulante = dicomDoc.storagePath;
          }
        }

        // Documentos de trabajadores independientes del postulante
        if (applicantDocuments.formulario22) {
          const formulario22Doc = uploadedApplicantDocs.find((doc: any) =>
            doc.fileName.toLowerCase().includes('formulario') ||
            doc.fileName.toLowerCase().includes('22')
          );
          if (formulario22Doc) {
            updateData.ruta_formulario22 = formulario22Doc.storagePath;
          }
        }

        if (applicantDocuments.resumenBoletas) {
          const resumenBoletasDoc = uploadedApplicantDocs.find((doc: any) =>
            doc.fileName.toLowerCase().includes('resumen') ||
            doc.fileName.toLowerCase().includes('boleta') ||
            doc.fileName.toLowerCase().includes('sii')
          );
          if (resumenBoletasDoc) {
            updateData.ruta_resumen_boletas = resumenBoletasDoc.storagePath;
          }
        }

        // Actualizar la aplicación con las rutas opcionales si existen
        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase
            .from('applications')
            .update(updateData)
            .eq('id', application.id);

          if (updateError) {
            console.warn('⚠️ Error updating optional document paths for applicant:', updateError);
          } else {
            console.log('✅ Updated optional document paths for applicant');
          }
        }
      }

      // PASO 6: Subir documentos del aval
      const hasGuarantorDocuments = Object.values(guarantorDocuments).some(file => file !== null);
      if (showGuarantor && hasGuarantorDocuments) {
        const uploadedGuarantorDocs = await uploadDocuments(guarantorDocuments, application.id, 'application_guarantor');

        // Actualizar rutas de todos los documentos del aval en la aplicación
        const updateData: any = {};

        // Documentos tradicionales del aval
        if (guarantorDocuments.cedula) {
          const cedulaDoc = uploadedGuarantorDocs.find((doc: any) =>
            doc.fileName.toLowerCase().includes('cedula') ||
            doc.fileName.toLowerCase().includes('identidad')
          );
          if (cedulaDoc) {
            updateData.ruta_cedula_aval = cedulaDoc.storagePath;
          }
        }

        if (guarantorDocuments.contrato) {
          const contratoDoc = uploadedGuarantorDocs.find((doc: any) =>
            doc.fileName.toLowerCase().includes('contrato') ||
            doc.fileName.toLowerCase().includes('trabajo')
          );
          if (contratoDoc) {
            updateData.ruta_contrato_aval = contratoDoc.storagePath;
          }
        }

        if (guarantorDocuments.liquidaciones) {
          const liquidacionesDoc = uploadedGuarantorDocs.find((doc: any) =>
            doc.fileName.toLowerCase().includes('liquidacion') ||
            doc.fileName.toLowerCase().includes('sueldo')
          );
          if (liquidacionesDoc) {
            updateData.ruta_liquidaciones_aval = liquidacionesDoc.storagePath;
          }
        }

        if (guarantorDocuments.cotizaciones) {
          const cotizacionesDoc = uploadedGuarantorDocs.find((doc: any) =>
            doc.fileName.toLowerCase().includes('cotizacion') ||
            doc.fileName.toLowerCase().includes('previsional')
          );
          if (cotizacionesDoc) {
            updateData.ruta_cotizaciones_aval = cotizacionesDoc.storagePath;
          }
        }

        if (guarantorDocuments.dicom) {
          const dicomDoc = uploadedGuarantorDocs.find((doc: any) =>
            doc.fileName.toLowerCase().includes('dicom') ||
            doc.fileName.toLowerCase().includes('certificado')
          );
          if (dicomDoc) {
            updateData.ruta_dicom_aval = dicomDoc.storagePath;
          }
        }

        // Documentos de trabajadores independientes del aval
        if (guarantorDocuments.formulario22) {
          const formulario22Doc = uploadedGuarantorDocs.find((doc: any) =>
            doc.fileName.toLowerCase().includes('formulario') ||
            doc.fileName.toLowerCase().includes('22')
          );
          if (formulario22Doc) {
            updateData.ruta_formulario22_aval = formulario22Doc.storagePath;
          }
        }

        if (guarantorDocuments.resumenBoletas) {
          const resumenBoletasDoc = uploadedGuarantorDocs.find((doc: any) =>
            doc.fileName.toLowerCase().includes('resumen') ||
            doc.fileName.toLowerCase().includes('boleta') ||
            doc.fileName.toLowerCase().includes('sii')
          );
          if (resumenBoletasDoc) {
            updateData.ruta_resumen_boletas_aval = resumenBoletasDoc.storagePath;
          }
        }

        // Actualizar la aplicación con las rutas opcionales del aval si existen
        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase
            .from('applications')
            .update(updateData)
            .eq('id', application.id);

          if (updateError) {
            console.warn('⚠️ Error updating optional document paths for guarantor:', updateError);
          } else {
            console.log('✅ Updated optional document paths for guarantor');
          }
        }
      }

      // PASO 7: Enviar webhook de notificación de nueva postulación
      console.log('🌐 Enviando webhook de nueva postulación...');
      try {
        // Obtener datos completos para el webhook
        const { data: propertyData, error: propertyError } = await supabase
          .from('properties')
          .select(`
            *,
            property_images!inner (*)
          `)
          .eq('id', property.id)
          .single();

        if (propertyError) {
          // Log the full error object to understand its structure
          console.warn('⚠️ Error obteniendo datos de propiedad para webhook:', propertyError);
          
          // Safely extract error message
          const errorMessage = propertyError?.message || propertyError?.error?.message || JSON.stringify(propertyError);
          console.warn('⚠️ Error message:', errorMessage);
        } else {
          // Obtener datos del propietario
          const { data: propertyOwner, error: ownerError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', propertyData.owner_id)
            .maybeSingle();

          if (ownerError) {
            // Log the full error object to understand its structure
            console.warn('⚠️ Error obteniendo datos del propietario para webhook:', ownerError);
            
            // Safely extract error message
            const errorMessage = ownerError?.message || ownerError?.error?.message || JSON.stringify(ownerError);
            console.warn('⚠️ Error message:', errorMessage);
          } else if (!propertyOwner) {
            console.warn('⚠️ No se encontró perfil del propietario para webhook');
          } else {
            // Obtener datos del postulante (usuario actual)
            const { data: applicantProfile, error: applicantError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .maybeSingle();

            if (applicantError) {
              // Log the full error object to understand its structure
              console.warn('⚠️ Error obteniendo datos del postulante para webhook:', applicantError);
              
              // Safely extract error message
              const errorMessage = applicantError?.message || applicantError?.error?.message || JSON.stringify(applicantError);
              console.warn('⚠️ Error message:', errorMessage);
            } else if (!applicantProfile) {
              console.warn('⚠️ No se encontró perfil del postulante para webhook');
            } else {
              // Enviar webhook usando el webhookClient
              await webhookClient.sendApplicationEvent(
                'received', // Nueva postulación recibida
                {
                  ...application,
                  status: 'pendiente' // Asegurar que el status sea correcto
                },
                propertyData,
                applicantProfile,
                propertyOwner
              );
              console.log('✅ Webhook de nueva postulación enviado exitosamente');
            }
          }
        }
      } catch (webhookError) {
        // El webhookClient maneja los errores internamente y no los propaga
        // Solo registrar el error sin interrumpir el proceso
        console.warn('⚠️ Servicio de notificaciones no disponible:', webhookError);
        
        // Safely extract error message
        const errorMessage = webhookError?.message || webhookError?.error?.message || JSON.stringify(webhookError);
        console.warn('⚠️ Webhook error message:', errorMessage);
      }

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-4 sm:p-8 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20 rounded-2xl shadow-2xl border border-gray-200">
      {/* Header con información de la propiedad mejorado */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Postulación de Arriendo
          </h2>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-5 sm:p-7 rounded-2xl shadow-xl text-white">
          <div className="flex items-start gap-4 mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Building className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg sm:text-xl font-bold mb-1">
                {property.address_street} {property.address_number}
              </h3>
              
              {/* Property Type Badge */}
              {property.tipo_propiedad && (
                <div className="flex items-center gap-2 mb-2">
                  <Home className="h-4 w-4 text-white/90" />
                  <span className="text-xs sm:text-sm bg-white/20 px-2 py-0.5 rounded-lg backdrop-blur-sm font-medium">
                    {getPropertyTypeInfo(property.tipo_propiedad).label}
                  </span>
                </div>
              )}
              
              <p className="text-sm sm:text-base text-blue-100">
                📍 {property.address_commune}, {property.address_region}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mt-4 pt-4 border-t border-white/20">
            <div className="flex items-center gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold">
                {formatPriceCLP(property.price_clp)}
              </span>
              <span className="text-sm opacity-90">/ mes</span>
            </div>
            {property.common_expenses_clp && (
              <div className="text-xs sm:text-sm bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                + {formatPriceCLP(property.common_expenses_clp)} gastos comunes
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Banner de Modo BETA */}
      <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-300 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-white" />
          </div>
          <div>
            <h4 className="font-bold text-blue-900 mb-1">Modo Beta - Validaciones Suavizadas</h4>
            <p className="text-sm text-blue-700">
              Durante la fase beta, puedes <strong>actualizar tu postulación</strong> las veces que necesites.
              Las validaciones estrictas (RUT, documentos, etc.) están deshabilitadas para facilitar el proceso.
            </p>
          </div>
        </div>
      </div>

      {/* Loading state for profile */}
      {profileLoading && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-xs sm:text-sm">Cargando datos de tu perfil...</span>
          </div>
        </div>
      )}

      {/* Profile incomplete alert */}
      {!profileLoading && profileIncomplete && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-800 mb-1 text-sm sm:text-base">Perfil Incompleto</h3>
              <p className="text-xs sm:text-sm text-amber-700 mb-3">
                Hemos autocompletado con los datos de tu perfil. Para postular aún más rápido la próxima vez, completa tu perfil.
              </p>
              <a
                href="/profile"
                className="inline-flex items-center text-xs sm:text-sm font-medium text-amber-600 hover:text-amber-800 transition-colors"
              >
                <User className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                Completar perfil
                <ExternalLink className="h-2 w-2 sm:h-3 sm:w-3 ml-1" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Success message for complete profile */}
      {!profileLoading && !profileIncomplete && userProfile && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          <div className="flex items-center">
            <User className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mr-2 sm:mr-3" />
            <span className="text-xs sm:text-sm">
              ✅ Formulario autocompletado con los datos de tu perfil
            </span>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 mr-2 sm:mr-3 flex-shrink-0" />
            <span className="text-xs sm:text-sm break-words">{error}</span>
          </div>
        </div>
      )}

      {/* Errores generales de validación */}
      {validationErrors.general.length > 0 && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-red-800 mb-2">Errores de validación:</h4>
              <ul className="text-xs sm:text-sm space-y-1">
                {validationErrors.general.map((error, idx) => (
                  <li key={idx} className="flex items-start gap-1">
                    <span className="text-red-500">•</span>
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* SECCIÓN 1: Datos de los Postulantes con diseño mejorado */}
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
              <p className="text-sm text-gray-600">Máximo 3 postulantes por aplicación</p>
            </div>
          </div>
          <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {applicants.length}/3 postulantes
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
              <p className="text-sm text-gray-600">Opcional, máximo 3 avales por aplicación</p>
            </div>
          </div>
          <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {guarantors.length}/3 avales
          </div>
        </div>

        {/* Botón para agregar primer aval */}
        {guarantors.length === 0 && (
          <div className="bg-gradient-to-br from-emerald-50 to-green-50/50 p-6 rounded-2xl shadow-lg border border-emerald-200 text-center">
            <div className="mb-4">
              <UserCheck className="h-12 w-12 text-emerald-600 mx-auto mb-3" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                ¿Deseas agregar un aval?
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                Un aval puede fortalecer tu postulación al proporcionar respaldo adicional.
              </p>
            </div>
            <button
              type="button"
              onClick={addGuarantor}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              <Plus className="h-5 w-5" />
              Agregar Aval
            </button>
          </div>
        )}

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
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <MessageSquarePlus className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
            Mensaje al Propietario
          </h3>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-purple-50/50 p-5 sm:p-6 rounded-2xl shadow-lg border border-indigo-200">
          <div className="mb-4 sm:mb-6">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Mensaje Adicional (Opcional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="w-full p-2 sm:p-3 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Cuéntanos por qué eres un buen candidato para esta propiedad..."
            />
          </div>

          {/* Documentos individuales del Postulante */}
          <div className="mb-4 sm:mb-6">
            <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-4">📄 Documentación del Postulante</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="mb-3">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  🆔 Cédula de Identidad
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => setApplicantDocuments(prev => ({ ...prev, cedula: e.target.files?.[0] || null }))}
              className="w-full p-2 sm:p-3 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
              </div>

              <div className="mb-3">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  📋 Contrato de Trabajo
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => setApplicantDocuments(prev => ({ ...prev, contrato: e.target.files?.[0] || null }))}
                  className="w-full p-2 sm:p-3 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="mb-3">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  💰 Liquidaciones de Sueldo
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => setApplicantDocuments(prev => ({ ...prev, liquidaciones: e.target.files?.[0] || null }))}
                  className="w-full p-2 sm:p-3 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="mb-3">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  📊 Cotizaciones Previsionales
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => setApplicantDocuments(prev => ({ ...prev, cotizaciones: e.target.files?.[0] || null }))}
                  className="w-full p-2 sm:p-3 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="mb-3 md:col-span-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  🏦 Certificado DICOM
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => setApplicantDocuments(prev => ({ ...prev, dicom: e.target.files?.[0] || null }))}
                  className="w-full p-2 sm:p-3 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN OPCIONAL: Documentos para Trabajadores Independientes */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                📄 Documentos Adicionales (Opcional)
              </h3>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 p-5 sm:p-6 rounded-2xl shadow-lg border border-amber-200">
              <p className="text-sm text-amber-700 mb-4">
                Si algún postulante es trabajador independiente, adjunta estos documentos tributarios adicionales.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-3">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    📊 Declaración Anual de Renta (Formulario 22)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => setApplicantDocuments(prev => ({ ...prev, formulario22: e.target.files?.[0] || null }))}
                    className="w-full p-2 sm:p-3 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Declaración jurada del año anterior
                  </p>
                </div>

                <div className="mb-3">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    🧾 Resumen Anual de Boletas de Honorarios (SII)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => setApplicantDocuments(prev => ({ ...prev, resumenBoletas: e.target.files?.[0] || null }))}
                    className="w-full p-2 sm:p-3 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Certificado emitido por el Servicio de Impuestos Internos
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Documentos del Aval */}
          {guarantors.length > 0 && (
            <div className="mb-6 sm:mb-8">
              <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Documentación de Avales
              </h4>

              <div className="bg-gradient-to-br from-emerald-50 to-green-50/50 p-5 rounded-2xl shadow-lg border border-emerald-200">
                <p className="text-sm text-emerald-700 mb-4">
                  Adjunta los documentos correspondientes para cada aval.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="mb-3">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      🆔 Cédula de Identidad
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => setGuarantorDocuments(prev => ({ ...prev, cedula: e.target.files?.[0] || null }))}
                      className="w-full p-2 sm:p-3 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      📋 Contrato de Trabajo
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => setGuarantorDocuments(prev => ({ ...prev, contrato: e.target.files?.[0] || null }))}
                      className="w-full p-2 sm:p-3 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      💰 Liquidaciones de Sueldo
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => setGuarantorDocuments(prev => ({ ...prev, liquidaciones: e.target.files?.[0] || null }))}
                      className="w-full p-2 sm:p-3 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      📊 Cotizaciones Previsionales
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => setGuarantorDocuments(prev => ({ ...prev, cotizaciones: e.target.files?.[0] || null }))}
                      className="w-full p-2 sm:p-3 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>

                  <div className="mb-3 md:col-span-2">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      🏦 Certificado DICOM
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => setGuarantorDocuments(prev => ({ ...prev, dicom: e.target.files?.[0] || null }))}
                      className="w-full p-2 sm:p-3 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Botones de acción mejorados */}
      <div className="flex flex-col sm:flex-row sm:justify-end gap-3 sm:gap-4 pt-6 sm:pt-8 mt-6 border-t-2 border-gray-200">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-semibold shadow-md hover:shadow-lg touch-manipulation"
          >
            <X className="h-5 w-5" />
            <span>Cancelar</span>
          </button>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 touch-manipulation text-lg"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Enviando postulación...</span>
            </>
          ) : (
            <>
              <Send className="h-5 w-5" />
              <span>Enviar Postulación</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default RentalApplicationForm;