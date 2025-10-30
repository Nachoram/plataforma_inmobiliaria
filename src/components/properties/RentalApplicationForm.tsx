import React, { useState, useEffect } from 'react';
import { X, Send, User, AlertCircle, ExternalLink, Building, FileText, MessageSquarePlus, CheckCircle, Home } from 'lucide-react';
import { supabase, Property, Profile, formatPriceCLP, formatRUT, CHILE_REGIONS, MARITAL_STATUS_OPTIONS, FILE_SIZE_LIMITS, validateRUT, getCurrentProfile, getPropertyTypeInfo } from '../../lib/supabase';
import { webhookClient } from '../../lib/webhook';

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
  const [showIndependentWorker, setShowIndependentWorker] = useState(false);
  const [showGuarantorIndependent, setShowGuarantorIndependent] = useState(false);
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
    contact_email: '',
    address_street: '',
    address_number: '',
    address_department: '',
    address_commune: '',
    address_region: '',
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

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        throw new Error('Error de autenticación: ' + userError.message);
      }
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // ✅ BETA: Validación de RUT suavizada - solo advertencia en consola
      if (applicantData.rut && !validateRUT(applicantData.rut)) {
        console.warn('⚠️ ADVERTENCIA: RUT del postulante podría ser inválido:', applicantData.rut);
        // NO lanzar error - permitir continuar
      }

      // Validar RUT del aval si existe - también suavizado
      if (showGuarantor && guarantorData.rut && !validateRUT(guarantorData.rut)) {
        console.warn('⚠️ ADVERTENCIA: RUT del aval podría ser inválido:', guarantorData.rut);
        // NO lanzar error - permitir continuar
      }

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

      let guarantorId: string | null = null;

      // PASO 2: Crear o encontrar aval si existe
      if (showGuarantor) {
        // TODO: RESTAURAR UPSERT ANTES DE PRODUCCIÓN - Implementar lógica manual select->update/insert sin onConflict
        // En producción, restaurar:
        // const { data: guarantor, error: guarantorError } = await supabase.from('guarantors').upsert({...}, { onConflict: 'rut' });
        // Y re-habilitar restricciones UNIQUE en rut tanto en BD como validaciones frontend

        // Lógica manual sin onConflict (para ambiente de pruebas sin restricciones UNIQUE)
        try {
          console.log('🔍 Verificando si existe aval con RUT:', guarantorData.rut);
          const { data: existingGuarantor, error: checkGuarantorError } = await supabase
            .from('guarantors')
            .select('id')
            .eq('rut', guarantorData.rut)
            .maybeSingle();

          if (checkGuarantorError) {
            console.log('❌ Error verificando aval existente:', checkGuarantorError);
            throw new Error(`Error verificando aval existente: ${checkGuarantorError.message}`);
          }

          let guarantor;
          let guarantorError;

          if (existingGuarantor) {
            // Existe - hacer UPDATE
            console.log('🔄 Actualizando aval existente con RUT:', guarantorData.rut);
            const { data, error } = await supabase
              .from('guarantors')
              .update({
                first_name: guarantorData.first_name,
                paternal_last_name: guarantorData.paternal_last_name,
                maternal_last_name: guarantorData.maternal_last_name,
                full_name: `${guarantorData.first_name} ${guarantorData.paternal_last_name}${guarantorData.maternal_last_name ? ' ' + guarantorData.maternal_last_name : ''}`.trim(),
                profession: guarantorData.profession,
                monthly_income: parseInt(guarantorData.monthly_income_clp) || 0,
                contact_email: guarantorData.contact_email || 'email@no-especificado.com',
                // Dirección embebida directamente en la tabla guarantors
                address_street: guarantorData.address_street,
                address_number: guarantorData.address_number,
                address_department: guarantorData.address_department,
                address_commune: guarantorData.address_commune,
                address_region: guarantorData.address_region,
                property_id: property.id, // Asignar property_id para relación directa con propiedad
                created_by: user.id // Track who created this guarantor
              })
              .eq('rut', guarantorData.rut)
              .select()
              .single();

            guarantor = data;
            guarantorError = error;
          } else {
            // No existe - hacer INSERT
            console.log('🆕 Creando nuevo aval con RUT:', guarantorData.rut);
            const { data, error } = await supabase
              .from('guarantors')
              .insert({
                first_name: guarantorData.first_name,
                paternal_last_name: guarantorData.paternal_last_name,
                maternal_last_name: guarantorData.maternal_last_name,
                full_name: `${guarantorData.first_name} ${guarantorData.paternal_last_name}${guarantorData.maternal_last_name ? ' ' + guarantorData.maternal_last_name : ''}`.trim(),
                rut: guarantorData.rut,
                profession: guarantorData.profession,
                monthly_income: parseInt(guarantorData.monthly_income_clp) || 0,
                contact_email: guarantorData.contact_email || 'email@no-especificado.com',
                // Dirección embebida directamente en la tabla guarantors
                address_street: guarantorData.address_street,
                address_number: guarantorData.address_number,
                address_department: guarantorData.address_department,
                address_commune: guarantorData.address_commune,
                address_region: guarantorData.address_region,
                property_id: property.id, // Asignar property_id para relación directa con propiedad
                created_by: user.id // Track who created this guarantor
              })
              .select()
              .single();

            guarantor = data;
            guarantorError = error;
          }

          if (guarantorError) {
            throw new Error(`Error procesando aval: ${guarantorError.message}`);
          }

          guarantorId = guarantor?.id || null;
          console.log('Guarantor procesado con ID:', guarantorId);
        } catch (error) {
          console.error('Error en upsert de guarantor:', error);
          throw error;
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

      // PASO 4: Subir documentos del postulante
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

      // PASO 5: Subir documentos del aval
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

      // PASO 6: Enviar webhook de notificación de nueva postulación
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
                  max="120"
                />
                {applicantData.age && (parseInt(applicantData.age) < 18 || parseInt(applicantData.age) > 120) && (
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
                  maxLength="10"
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
                  maxLength="10"
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email de Contacto *
                  </label>
                  <input
                    type="email"
                    name="contact_email"
                    value={guarantorData.contact_email}
                    onChange={handleGuarantorChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required={showGuarantor}
                    placeholder="email@ejemplo.com"
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
                    maxLength="10"
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
                    maxLength="10"
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
                📄 Si eres Trabajador Independiente (Honorarios)
              </h3>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 p-5 sm:p-6 rounded-2xl shadow-lg border border-amber-200">
              <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                <input
                  type="checkbox"
                  id="showIndependentWorker"
                  checked={showIndependentWorker}
                  onChange={(e) => setShowIndependentWorker(e.target.checked)}
                  className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 focus:ring-amber-500 border-gray-300 rounded touch-manipulation"
                />
                <label htmlFor="showIndependentWorker" className="text-xs sm:text-sm font-medium text-gray-700">
                  Trabajo con boletas de honorarios (no tengo contrato ni liquidaciones)
                </label>
              </div>

              <p className="text-xs sm:text-sm text-amber-700 mb-4">
                Si trabajas de manera independiente, adjunta estos documentos tributarios en lugar del contrato y las liquidaciones tradicionales.
              </p>

              {showIndependentWorker && (
                <div className="space-y-4 pt-4 border-t border-amber-300">
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
              )}
            </div>
          </div>

          {/* Documentos individuales del Aval */}
          {showGuarantor && (
            <div className="mb-4 sm:mb-6">
              <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-4">👥 Documentación del Aval</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-3">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    🆔 Cédula de Identidad del Aval
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => setGuarantorDocuments(prev => ({ ...prev, cedula: e.target.files?.[0] || null }))}
                    className="w-full p-2 sm:p-3 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div className="mb-3">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    📋 Contrato de Trabajo del Aval
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => setGuarantorDocuments(prev => ({ ...prev, contrato: e.target.files?.[0] || null }))}
                    className="w-full p-2 sm:p-3 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div className="mb-3">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    💰 Liquidaciones de Sueldo del Aval
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => setGuarantorDocuments(prev => ({ ...prev, liquidaciones: e.target.files?.[0] || null }))}
                    className="w-full p-2 sm:p-3 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div className="mb-3">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    📊 Cotizaciones Previsionales del Aval
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => setGuarantorDocuments(prev => ({ ...prev, cotizaciones: e.target.files?.[0] || null }))}
                    className="w-full p-2 sm:p-3 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div className="mb-3 md:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    🏦 Certificado DICOM del Aval
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => setGuarantorDocuments(prev => ({ ...prev, dicom: e.target.files?.[0] || null }))}
                    className="w-full p-2 sm:p-3 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN OPCIONAL: Documentos para Trabajador Independiente del Aval */}
          <div className="mt-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <h4 className="text-base sm:text-lg font-bold text-gray-900">
                📄 Si el Aval es Trabajador Independiente (Honorarios)
              </h4>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 p-5 rounded-2xl shadow-lg border border-amber-200">
              <div className="flex items-center space-x-2 sm:space-x-3 mb-3">
                <input
                  type="checkbox"
                  id="showGuarantorIndependent"
                  checked={showGuarantorIndependent}
                  onChange={(e) => setShowGuarantorIndependent(e.target.checked)}
                  className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 focus:ring-amber-500 border-gray-300 rounded touch-manipulation"
                />
                <label htmlFor="showGuarantorIndependent" className="text-xs sm:text-sm font-medium text-gray-700">
                  El aval trabaja con boletas de honorarios (no tiene contrato ni liquidaciones)
                </label>
              </div>

              <p className="text-xs sm:text-sm text-amber-700 mb-4">
                Si el aval trabaja de manera independiente, adjunta sus documentos tributarios en lugar del contrato y las liquidaciones tradicionales.
              </p>

              {showGuarantorIndependent && (
                <div className="space-y-4 pt-4 border-t border-amber-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="mb-3">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        📊 Declaración Anual de Renta del Aval (Formulario 22)
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => setGuarantorDocuments(prev => ({ ...prev, formulario22: e.target.files?.[0] || null }))}
                        className="w-full p-2 sm:p-3 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-600 mt-1">
                        Declaración jurada del aval del año anterior
                      </p>
                    </div>

                    <div className="mb-3">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        🧾 Resumen Anual de Boletas de Honorarios del Aval (SII)
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => setGuarantorDocuments(prev => ({ ...prev, resumenBoletas: e.target.files?.[0] || null }))}
                        className="w-full p-2 sm:p-3 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-600 mt-1">
                        Certificado del SII del aval
                      </p>
                    </div>
                  </div>
            </div>
          )}
            </div>
          </div>
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