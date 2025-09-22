import React, { useState, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { supabase, Property, formatPriceCLP, formatRUT, CHILE_REGIONS, MARITAL_STATUS_OPTIONS, FILE_SIZE_LIMITS, VALIDATION_RULES, validateRUT } from '../../lib/supabase';
import CustomButton from '../common/CustomButton';

interface RentalApplicationFormProps {
  property: Property;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const RentalApplicationForm: React.FC<RentalApplicationFormProps> = ({
  property,
  onSuccess,
  onCancel
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGuarantor, setShowGuarantor] = useState(false);

  // Datos del postulante
  const [applicantData, setApplicantData] = useState({
    first_name: '',
    paternal_last_name: '',
    maternal_last_name: '',
    rut: '',
    profession: '',
    monthly_income_clp: '',
    age: '',
    nationality: 'Chilena',
    marital_status: 'soltero' as 'soltero' | 'casado' | 'divorciado' | 'viudo',
    address_street: '',
    address_number: '',
    address_department: '',
    address_commune: '',
    address_region: '',
    phone: '',
    email: '',
  });

  // Datos del aval (opcional)
  const [guarantorData, setGuarantorData] = useState({
    first_name: '',
    paternal_last_name: '',
    maternal_last_name: '',
    rut: '',
    profession: '',
    monthly_income_clp: '',
    address_street: '',
    address_number: '',
    address_department: '',
    address_commune: '',
    address_region: '',
  });

  const [message, setMessage] = useState('');
  const [applicantDocuments, setApplicantDocuments] = useState<File[]>([]);
  const [guarantorDocuments, setGuarantorDocuments] = useState<File[]>([]);

  // Estados para validación en tiempo real
  const [rutValidation, setRutValidation] = useState<{
    applicant: { isValid: boolean | null; message: string };
    guarantor: { isValid: boolean | null; message: string };
  }>({
    applicant: { isValid: null, message: '' },
    guarantor: { isValid: null, message: '' }
  });

  // Usar constantes compartidas
  const regions = CHILE_REGIONS;

  // Precarga de datos del perfil del usuario
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) {
          console.error('Error getting user:', userError);
          setError('Error de autenticación. Por favor, inicia sesión nuevamente.');
          return;
        }
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          if (profile) {
            setApplicantData(prev => ({
              ...prev,
              first_name: profile.first_name || '',
              paternal_last_name: profile.paternal_last_name || '',
              maternal_last_name: profile.maternal_last_name || '',
              rut: profile.rut || '',
              profession: profile.profession || '',
              phone: profile.phone || '',
              email: profile.email || '',
              marital_status: profile.marital_status || 'soltero',
              address_street: profile.address_street || '',
              address_number: profile.address_number || '',
              address_department: profile.address_department || '',
              address_commune: profile.address_commune || '',
              address_region: profile.address_region || '',
            }));
          }
        }
      } catch (err) {
        console.error('Error loading user profile:', err);
      }
    };

    loadUserProfile();
  }, []);

  const handleApplicantChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setApplicantData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGuarantorChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setGuarantorData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRUTChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'applicant' | 'guarantor') => {
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
      setApplicantData(prev => ({ ...prev, rut: formattedRUT }));
      setRutValidation(prev => ({
        ...prev,
        applicant: validationResult
      }));
    } else {
      setGuarantorData(prev => ({ ...prev, rut: formattedRUT }));
      setRutValidation(prev => ({
        ...prev,
        guarantor: validationResult
      }));
    }
  };

  const uploadDocuments = async (files: File[], entityId: string, entityType: 'application_applicant' | 'application_guarantor') => {
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

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        throw new Error('Error de autenticación: ' + userError.message);
      }
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Validar RUT del postulante
      if (!validateRUT(applicantData.rut)) {
        throw new Error('RUT del postulante no es válido');
      }

      // Validar RUT del aval si existe
      if (showGuarantor && !validateRUT(guarantorData.rut)) {
        throw new Error('RUT del aval no es válido');
      }

      // PASO 1: Asegurar que existe el profile del usuario (requerido por FK)
      console.log('🔍 DEBUG: Verificando/creando profile del usuario...');
      try {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
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
          }, {
            onConflict: 'id'
          });

        if (profileError) {
          console.log('❌ DEBUG: Error creando profile:', profileError);
          throw new Error(`Error preparando perfil de usuario: ${profileError.message}`);
        }
        console.log('✅ DEBUG: Profile del usuario asegurado');
      } catch (error) {
        console.log('💥 DEBUG: Error en upsert de profile:', error);
        throw error;
      }

      let guarantorId: string | null = null;

      // PASO 2: Crear o encontrar aval si existe
      if (showGuarantor) {
        // Primero verificar si ya existe un guarantor con este RUT
        const { data: existingGuarantor, error: fetchError } = await supabase
          .from('guarantors')
          .select('id')
          .eq('rut', guarantorData.rut)
          .maybeSingle();

        if (fetchError) {
          throw new Error(`Error verificando aval existente: ${fetchError.message}`);
        }

        if (existingGuarantor) {
          // Si ya existe, usar el ID existente
          guarantorId = existingGuarantor.id;
          console.log('Usando guarantor existente con RUT:', guarantorData.rut);
        } else {
          // Si no existe, crear nuevo registro del aval
          const { data: guarantor, error: guarantorError } = await supabase
            .from('guarantors')
            .insert([{
              first_name: guarantorData.first_name,
              paternal_last_name: guarantorData.paternal_last_name,
              maternal_last_name: guarantorData.maternal_last_name,
              rut: guarantorData.rut,
              profession: guarantorData.profession,
              monthly_income_clp: parseInt(guarantorData.monthly_income_clp) || 0,
              // Dirección embebida directamente en la tabla guarantors
              address_street: guarantorData.address_street,
              address_number: guarantorData.address_number,
              address_department: guarantorData.address_department,
              address_commune: guarantorData.address_commune,
              address_region: guarantorData.address_region
            }])
            .select()
            .single();

          if (guarantorError) {
            // Si aún hay error de conflicto, intentar buscar el registro nuevamente
            if (guarantorError.code === '23505' || guarantorError.message.includes('duplicate')) {
              const { data: retryGuarantor, error: retryError } = await supabase
                .from('guarantors')
                .select('id')
                .eq('rut', guarantorData.rut)
                .single();
              
              if (retryError) {
                throw new Error(`Error crítico con aval: ${guarantorError.message}`);
              }
              
              guarantorId = retryGuarantor.id;
              console.log('Guarantor creado por otro proceso, usando ID:', guarantorId);
            } else {
              throw new Error(`Error creando aval: ${guarantorError.message}`);
            }
          } else {
            guarantorId = guarantor?.id || null;
            console.log('Nuevo guarantor creado con ID:', guarantorId);
          }
        }
      }

      // PASO 3: Crear postulación usando UPSERT (solución robusta para 409)
      let application;
      
      console.log('🔍 DEBUG: Iniciando proceso de postulación');
      console.log('🔍 DEBUG: property.id =', property.id);
      console.log('🔍 DEBUG: user.id =', user.id);

      // Preparar datos de la application
      const applicationData = {
        property_id: property.id,
        applicant_id: user.id,
        message: message,
        guarantor_id: guarantorId,
        // Campos snapshot requeridos (NOT NULL)
        snapshot_applicant_profession: applicantData.profession,
        snapshot_applicant_monthly_income_clp: parseInt(applicantData.monthly_income_clp) || 0,
        snapshot_applicant_age: parseInt(applicantData.age) || 0,
        snapshot_applicant_nationality: applicantData.nationality,
        snapshot_applicant_marital_status: applicantData.marital_status,
        snapshot_applicant_address_street: applicantData.address_street,
        snapshot_applicant_address_number: applicantData.address_number,
        snapshot_applicant_address_department: applicantData.address_department || null,
        snapshot_applicant_address_commune: applicantData.address_commune,
        snapshot_applicant_address_region: applicantData.address_region
      };

      console.log('🔍 DEBUG: Datos preparados para application:', applicationData);

      try {
        // ESTRATEGIA 1: UPSERT directo (maneja conflictos automáticamente)
        console.log('🔍 DEBUG: Intentando UPSERT...');
        
        // Nota: UPSERT no funciona porque no hay constraint UNIQUE en property_id+applicant_id
        // Vamos directo a la estrategia manual que SÍ funciona
        console.log('🔍 DEBUG: Saltando UPSERT (no hay constraint), usando estrategia manual...');
        
        let upsertApplication = null;
        let upsertError = { message: 'Usando estrategia manual por falta de constraint' };

        if (upsertError) {
          console.log('❌ DEBUG: UPSERT falló:', upsertError);
          
          // Si UPSERT falla, intentar estrategia manual
          console.log('🔍 DEBUG: Intentando estrategia manual...');
          
          // Verificar si existe
          const { data: existingApplication, error: fetchError } = await supabase
            .from('applications')
            .select('id, created_at')
            .eq('property_id', property.id)
            .eq('applicant_id', user.id)
            .maybeSingle();

          console.log('🔍 DEBUG: Resultado verificación existente:', { existingApplication, fetchError });

          if (fetchError) {
            console.log('❌ DEBUG: Error en verificación:', fetchError);
            throw new Error(`Error verificando postulación existente: ${fetchError.message}`);
          }

          if (existingApplication) {
            // Ya existe - mostrar mensaje informativo
            console.log('⚠️ DEBUG: Application ya existe:', existingApplication.id);
            throw new Error(
              `Ya has postulado a esta propiedad el ${new Date(existingApplication.created_at).toLocaleDateString()}. ` +
              'Solo se permite una postulación por propiedad. ' +
              'Si deseas actualizar tu información, contacta al propietario directamente.'
            );
          } else {
            // No existe - intentar INSERT directo
            console.log('🔍 DEBUG: No existe, intentando INSERT directo...');
            
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
            console.log('✅ DEBUG: Application creada con INSERT directo:', application.id);
          }
        } else {
          application = upsertApplication;
          console.log('✅ DEBUG: Application procesada con UPSERT:', application.id);
        }

      } catch (error) {
        console.log('💥 DEBUG: Error capturado en try/catch:', error);
        throw error;
      }

      // PASO 4: Subir documentos del postulante
      if (applicantDocuments.length > 0) {
        await uploadDocuments(applicantDocuments, application.id, 'application_applicant');
      }

      // PASO 5: Subir documentos del aval
      if (showGuarantor && guarantorDocuments.length > 0) {
        await uploadDocuments(guarantorDocuments, application.id, 'application_guarantor');
      }

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header con información de la propiedad */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          📋 Postulación de Arriendo
        </h2>
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            {property.address_street} {property.address_number}
          </h3>
          <p className="text-blue-700 mb-2">
            {property.address_commune}, {property.address_region}
          </p>
          <div className="flex items-center space-x-4 text-blue-800">
            <span className="font-semibold">
              {formatPriceCLP(property.price_clp)} / mes
            </span>
            {property.common_expenses_clp && (
              <span className="text-sm">
                + {formatPriceCLP(property.common_expenses_clp)} gastos comunes
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          ⚠️ {error}
        </div>
      )}

      {/* SECCIÓN 1: Datos del Postulante */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 pb-3 border-b-2 border-blue-200">
          👤 Datos del Postulante
        </h3>

        {/* Información Personal */}
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-gray-800 mb-4">Información Personal</h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={applicantData.first_name}
                  onChange={handleApplicantChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  value={applicantData.paternal_last_name}
                  onChange={handleApplicantChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apellido Materno *
                </label>
                <input
                  type="text"
                  name="maternal_last_name"
                  value={applicantData.maternal_last_name}
                  onChange={handleApplicantChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
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
                  value={applicantData.rut}
                  onChange={(e) => handleRUTChange(e, 'applicant')}
                  className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    rutValidation.applicant.isValid === true
                      ? 'border-green-500 bg-green-50'
                      : rutValidation.applicant.isValid === false
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300'
                  }`}
                  placeholder="12.345.678-9"
                  required
                />
                {rutValidation.applicant.message && (
                  <p className={`text-sm mt-1 ${
                    rutValidation.applicant.isValid === true
                      ? 'text-green-600'
                      : rutValidation.applicant.isValid === false
                      ? 'text-red-600'
                      : 'text-gray-500'
                  }`}>
                    {rutValidation.applicant.message}
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
                  value={applicantData.age}
                  onChange={handleApplicantChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  min="18"
                  max="100"
                />
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
                  value={applicantData.nationality}
                  onChange={handleApplicantChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado Civil *
                </label>
                <select
                  name="marital_status"
                  value={applicantData.marital_status}
                  onChange={handleApplicantChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-gray-800 mb-4">Información Laboral y Contacto</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profesión *
                </label>
                <input
                  type="text"
                  name="profession"
                  value={applicantData.profession}
                  onChange={handleApplicantChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  value={applicantData.monthly_income_clp}
                  onChange={handleApplicantChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  min="0"
                />
                {applicantData.monthly_income_clp && (
                  <p className="text-sm text-green-600 mt-1 font-medium">
                    💰 {formatPriceCLP(parseInt(applicantData.monthly_income_clp))}
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
                  value={applicantData.phone}
                  onChange={handleApplicantChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  value={applicantData.email}
                  onChange={handleApplicantChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección Actual *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  name="address_street"
                  value={applicantData.address_street}
                  onChange={handleApplicantChange}
                  placeholder="Calle"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <input
                  type="text"
                  name="address_number"
                  value={applicantData.address_number}
                  onChange={handleApplicantChange}
                  placeholder="Número"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  name="address_department"
                  value={applicantData.address_department}
                  onChange={handleApplicantChange}
                  placeholder="Depto (opcional)"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  name="address_commune"
                  value={applicantData.address_commune}
                  onChange={handleApplicantChange}
                  placeholder="Comuna"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <select
                  name="address_region"
                  value={applicantData.address_region}
                  onChange={handleApplicantChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Seleccionar región</option>
                  {regions.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: Aval o Garante (Opcional) */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 pb-3 border-b-2 border-green-200">
          🛡️ Aval o Garante (Opcional)
        </h3>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center space-x-3 mb-4">
            <input
              type="checkbox"
              id="showGuarantor"
              checked={showGuarantor}
              onChange={(e) => setShowGuarantor(e.target.checked)}
              className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="showGuarantor" className="text-sm font-medium text-gray-700">
              Deseo agregar un aval que respalde mi postulación
            </label>
          </div>

          {showGuarantor && (
            <div className="space-y-4 pt-4 border-t border-green-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={guarantorData.first_name}
                    onChange={handleGuarantorChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required={showGuarantor}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apellido Paterno *
                  </label>
                  <input
                    type="text"
                    name="paternal_last_name"
                    value={guarantorData.paternal_last_name}
                    onChange={handleGuarantorChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required={showGuarantor}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apellido Materno *
                  </label>
                  <input
                    type="text"
                    name="maternal_last_name"
                    value={guarantorData.maternal_last_name}
                    onChange={handleGuarantorChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required={showGuarantor}
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
                    value={guarantorData.rut}
                    onChange={(e) => handleRUTChange(e, 'guarantor')}
                    className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      rutValidation.guarantor.isValid === true
                        ? 'border-green-500 bg-green-50'
                        : rutValidation.guarantor.isValid === false
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-300'
                    }`}
                    placeholder="12.345.678-9"
                    required={showGuarantor}
                  />
                  {rutValidation.guarantor.message && (
                    <p className={`text-sm mt-1 ${
                      rutValidation.guarantor.isValid === true
                        ? 'text-green-600'
                        : rutValidation.guarantor.isValid === false
                        ? 'text-red-600'
                        : 'text-gray-500'
                    }`}>
                      {rutValidation.guarantor.message}
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
                    value={guarantorData.profession}
                    onChange={handleGuarantorChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required={showGuarantor}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ingreso Mensual (CLP) *
                </label>
                <input
                  type="number"
                  name="monthly_income_clp"
                  value={guarantorData.monthly_income_clp}
                  onChange={handleGuarantorChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required={showGuarantor}
                  min="0"
                />
                {guarantorData.monthly_income_clp && (
                  <p className="text-sm text-green-600 mt-1 font-medium">
                    💰 {formatPriceCLP(parseInt(guarantorData.monthly_income_clp))}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección del Aval *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input
                    type="text"
                    name="address_street"
                    value={guarantorData.address_street}
                    onChange={handleGuarantorChange}
                    placeholder="Calle"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required={showGuarantor}
                  />
                  <input
                    type="text"
                    name="address_number"
                    value={guarantorData.address_number}
                    onChange={handleGuarantorChange}
                    placeholder="Número"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required={showGuarantor}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    name="address_department"
                    value={guarantorData.address_department}
                    onChange={handleGuarantorChange}
                    placeholder="Depto (opcional)"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    name="address_commune"
                    value={guarantorData.address_commune}
                    onChange={handleGuarantorChange}
                    placeholder="Comuna"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required={showGuarantor}
                  />
                  <select
                    name="address_region"
                    value={guarantorData.address_region}
                    onChange={handleGuarantorChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required={showGuarantor}
                  >
                    <option value="">Seleccionar región</option>
                    {regions.map(region => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECCIÓN 3: Mensaje al Propietario */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 pb-3 border-b-2 border-purple-200">
          💬 Mensaje al Propietario
        </h3>

        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mensaje Adicional (Opcional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Cuéntanos por qué eres un buen candidato para esta propiedad. Menciona tu situación laboral, estabilidad financiera, referencias, o cualquier otra información relevante que consideres importante..."
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📎 Documentos del Postulante
            </label>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => setApplicantDocuments(Array.from(e.target.files || []))}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-600 mt-1">
              📋 Cédula de identidad, certificado de ingresos, contrato de trabajo, referencias laborales, etc.
            </p>
          </div>

          {showGuarantor && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📎 Documentos del Aval
              </label>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => setGuarantorDocuments(Array.from(e.target.files || []))}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-600 mt-1">
                📋 Cédula de identidad del aval, certificado de ingresos, referencias, etc.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
        {onCancel && (
          <CustomButton
            type="button"
            variant="outline"
            onClick={onCancel}
            size="lg"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </CustomButton>
        )}

        <CustomButton
          type="submit"
          variant="success"
          loading={loading}
          loadingText="Enviando postulación..."
          size="lg"
        >
          <Send className="h-4 w-4 mr-2" />
          Enviar Postulación
        </CustomButton>
      </div>
    </form>
  );
};

export default RentalApplicationForm;