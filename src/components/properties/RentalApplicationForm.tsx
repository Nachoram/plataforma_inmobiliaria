import React, { useState, useEffect } from 'react';
import { X, Send, User, AlertCircle, ExternalLink, Building, FileText, MessageSquarePlus, CheckCircle } from 'lucide-react';
import { supabase, Property, Profile, formatPriceCLP, formatRUT, CHILE_REGIONS, MARITAL_STATUS_OPTIONS, FILE_SIZE_LIMITS, VALIDATION_RULES, validateRUT, getCurrentProfile } from '../../lib/supabase';
import { webhookClient } from '../../lib/webhook';
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
  const [profileLoading, setProfileLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [profileIncomplete, setProfileIncomplete] = useState(false);

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

  // Precarga de datos del perfil del usuario usando la API getCurrentProfile()
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setProfileLoading(true);
        const profile = await getCurrentProfile();
        
        if (profile) {
          setUserProfile(profile);
          
          // Mapear datos del perfil al formulario
          setApplicantData(prev => ({
            ...prev,
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
          }));

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
        snapshot_applicant_address_region: applicantData.address_region,
        // Campos snapshot de identificación del postulante
        snapshot_applicant_first_name: applicantData.first_name,
        snapshot_applicant_paternal_last_name: applicantData.paternal_last_name,
        snapshot_applicant_maternal_last_name: applicantData.maternal_last_name,
        snapshot_applicant_rut: applicantData.rut,
        snapshot_applicant_email: user.email || '',
        snapshot_applicant_phone: applicantData.phone || null
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

      // PASO 6: Enviar webhook de notificación de nueva postulación
      console.log('🌐 Enviando webhook de nueva postulación...');
      try {
        // Obtener datos completos para el webhook
        const { data: propertyData, error: propertyError } = await supabase
          .from('properties')
          .select(`
            *,
            property_images (*)
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

      {/* SECCIÓN 1: Datos del Postulante con diseño mejorado */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
            <User className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
            Datos del Postulante
          </h3>
        </div>

        {/* Información Personal con diseño mejorado */}
        <div className="space-y-5 sm:space-y-6">
          <div className="bg-gradient-to-br from-white to-purple-50/30 p-5 sm:p-6 rounded-2xl shadow-lg border border-purple-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <h4 className="text-base sm:text-lg font-bold text-gray-900">Información Personal</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={applicantData.first_name}
                  onChange={handleApplicantChange}
                  className="w-full p-2 sm:p-3 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Apellido Paterno *
                </label>
                <input
                  type="text"
                  name="paternal_last_name"
                  value={applicantData.paternal_last_name}
                  onChange={handleApplicantChange}
                  className="w-full p-2 sm:p-3 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Apellido Materno *
                </label>
                <input
                  type="text"
                  name="maternal_last_name"
                  value={applicantData.maternal_last_name}
                  onChange={handleApplicantChange}
                  className="w-full p-2 sm:p-3 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

          {/* Información Laboral y Contacto con diseño mejorado */}
          <div className="bg-gradient-to-br from-white to-blue-50/30 p-5 sm:p-6 rounded-2xl shadow-lg border border-blue-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                <Building className="h-4 w-4 text-white" />
              </div>
              <h4 className="text-base sm:text-lg font-bold text-gray-900">Información Laboral y Contacto</h4>
            </div>

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

      {/* SECCIÓN 2: Aval o Garante (Opcional) con diseño mejorado */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
            <CheckCircle className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
            Aval o Garante <span className="text-sm text-gray-500 font-normal">(Opcional)</span>
          </h3>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-green-50/50 p-5 sm:p-6 rounded-2xl shadow-lg border border-emerald-200">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
            <input
              type="checkbox"
              id="showGuarantor"
              checked={showGuarantor}
              onChange={(e) => setShowGuarantor(e.target.checked)}
              className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded touch-manipulation"
            />
            <label htmlFor="showGuarantor" className="text-xs sm:text-sm font-medium text-gray-700">
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

          <div className="mb-4 sm:mb-6">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              📎 Documentos del Postulante
            </label>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => setApplicantDocuments(Array.from(e.target.files || []))}
              className="w-full p-2 sm:p-3 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              📋 Cédula de identidad, certificado de ingresos, contrato de trabajo, referencias laborales, etc.
            </p>
          </div>

          {showGuarantor && (
            <div className="mb-4 sm:mb-6">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                📎 Documentos del Aval
              </label>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => setGuarantorDocuments(Array.from(e.target.files || []))}
                className="w-full p-2 sm:p-3 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                📋 Cédula de identidad del aval, certificado de ingresos, referencias, etc.
              </p>
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