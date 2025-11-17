import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, Property, formatPriceCLP, CHILE_REGIONS, LISTING_TYPE_OPTIONS, FILE_SIZE_LIMITS } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { CustomButton } from '../common';

interface PropertyPublicationFormProps {
  property?: Property;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Interfaz para datos del propietario
interface RentalOwnerData {
  first_name: string;
  paternal_last_name: string;
  maternal_last_name: string | null;
  rut: string;
  address_street: string | null;
  address_number: string | null;
  address_department: string | null;
  address_commune: string | null;
  address_region: string | null;
  marital_status: 'soltero' | 'casado' | 'divorciado' | 'viudo' | 'conviviente_civil';
  property_regime: 'separacion_bienes' | 'sociedad_conyugal' | 'participacion_gananciales' | null;
  phone: string | null;
  email: string | null;
}

// Interfaz para el formulario completo de publicación
interface PublishPropertyFormData {
  // Información de la propiedad
  listing_type: 'venta' | 'arriendo';
  address_street: string;
  address_number: string;
  address_department: string;
  address_commune: string;
  address_region: string;
  price_clp: string;
  common_expenses_clp: string;
  bedrooms: string;
  bathrooms: string;
  surface_m2: string;
  tiene_bodega: 'Sí' | 'No';
  metros_bodega: string;
  ubicacion_bodega: string;
  ubicacion_estacionamiento: string;
  description: string;

  // Información del propietario
  owner_type: 'natural' | 'juridica';
  // Campos para persona natural
  owner_first_name: string;
  owner_paternal_last_name: string;
  owner_maternal_last_name: string;
  owner_rut: string;
  owner_email: string;
  owner_phone: string;
  // Campos para persona jurídica
  owner_company_name: string;
  owner_company_rut: string;
  owner_company_business: string;
  owner_company_email: string;
  owner_company_phone: string;
  // Campos para representante legal
  owner_representative_first_name: string;
  owner_representative_paternal_last_name: string;
  owner_representative_maternal_last_name: string;
  owner_representative_rut: string;
  owner_representative_email: string;
  owner_representative_phone: string;

  // Datos del propietario para rental_owners
  owner: RentalOwnerData;
}

const PropertyPublicationForm: React.FC<PropertyPublicationFormProps> = ({
  property,
  onSuccess,
  onCancel
}) => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // Estado para el perfil del propietario
  const [ownerProfile, setOwnerProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);

  const [formData, setFormData] = useState<PublishPropertyFormData>({
    // Información de la propiedad
    listing_type: 'venta' as 'venta' | 'arriendo',
    address_street: '',
    address_number: '',
    address_department: '',
    address_commune: '',
    address_region: '',
    price_clp: '',
    common_expenses_clp: '',
    bedrooms: '',
    bathrooms: '',
    surface_m2: '',
    tiene_bodega: 'No' as 'Sí' | 'No',
    metros_bodega: '',
    ubicacion_bodega: '',
    ubicacion_estacionamiento: '',
    description: '',

    // Información del propietario
    owner_type: 'natural' as 'natural' | 'juridica',
    // Campos para persona natural
    owner_first_name: '',
    owner_paternal_last_name: '',
    owner_maternal_last_name: '',
    owner_rut: '',
    owner_email: '',
    owner_phone: '',
    // Campos para persona jurídica
    owner_company_name: '',
    owner_company_rut: '',
    owner_company_business: '',
    owner_company_email: '',
    owner_company_phone: '',
    // Campos para representante legal
    owner_representative_first_name: '',
    owner_representative_paternal_last_name: '',
    owner_representative_maternal_last_name: '',
    owner_representative_rut: '',
    owner_representative_email: '',
    owner_representative_phone: '',

    // Datos del propietario para rental_owners - NUEVO
    owner: {
      first_name: '',
      paternal_last_name: '',
      maternal_last_name: null,
      rut: '',
      address_street: null,
      address_number: null,
      address_department: null,
      address_commune: null,
      address_region: null,
      marital_status: 'soltero',
      property_regime: null,
      phone: null,
      email: null,
    }
  });

  const [images, setImages] = useState<File[]>([]);
  const [documents, setDocuments] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Usar constantes compartidas
  const regions = CHILE_REGIONS;

  // Función para validar RUT chileno
  const validateRut = (rut: string): boolean => {
    if (!rut || !rut.trim()) return false;

    // Limpiar el RUT (quitar puntos y guión)
    const cleanRut = rut.replace(/[.\-]/g, '');

    // Verificar que tenga al menos 8 dígitos
    if (cleanRut.length < 8) return false;

    // Separar número y dígito verificador
    const body = cleanRut.slice(0, -1);
    const verifier = cleanRut.slice(-1).toUpperCase();

    // Calcular dígito verificador
    let sum = 0;
    let multiplier = 2;

    for (let i = body.length - 1; i >= 0; i--) {
      sum += parseInt(body[i]) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }

    const calculatedVerifier = 11 - (sum % 11);
    const expectedVerifier = calculatedVerifier === 11 ? '0' : calculatedVerifier === 10 ? 'K' : calculatedVerifier.toString();

    return verifier === expectedVerifier;
  };

  /**
   * Guarda o actualiza los datos del propietario en rental_owners
   * @param propertyId - ID de la propiedad asociada
   * @param ownerData - Datos del propietario del formulario
   * @returns ID del propietario creado/actualizado
   */
  const saveRentalOwner = async (
    propertyId: string,
    ownerData: RentalOwnerData
  ): Promise<string> => {
    try {
      console.log('💾 Guardando datos del propietario...');
      console.log('🏠 Property ID:', propertyId);
      console.log('👤 Owner data:', ownerData);

      // 1. Validar campos requeridos
      if (!ownerData.first_name?.trim()) {
        throw new Error('El nombre del propietario es requerido');
      }
      if (!ownerData.paternal_last_name?.trim()) {
        throw new Error('El apellido paterno del propietario es requerido');
      }
      if (!ownerData.rut?.trim()) {
        throw new Error('El RUT del propietario es requerido');
      }

      // 2. Validar RUT
      if (!validateRut(ownerData.rut)) {
        throw new Error('El RUT del propietario no es válido');
      }

      // 3. Validar property_regime solo si está casado
      if (ownerData.marital_status === 'casado' && !ownerData.property_regime) {
        throw new Error('Debe especificar el régimen patrimonial si el propietario está casado');
      }

      // 4. Limpiar property_regime si NO está casado
      const cleanPropertyRegime = ownerData.marital_status === 'casado'
        ? ownerData.property_regime
        : null;

      // 5. Verificar si ya existe un propietario para esta propiedad
      const { data: existingOwner, error: checkError } = await supabase
        .from('rental_owners')
        .select('id')
        .eq('property_id', propertyId)
        .maybeSingle();

      if (checkError) {
        console.error('❌ Error verificando propietario existente:', checkError);
        throw checkError;
      }

      // 6. Preparar datos para inserción/actualización
      const ownerPayload = {
        property_id: propertyId,
        first_name: ownerData.first_name.trim(),
        paternal_last_name: ownerData.paternal_last_name.trim(),
        maternal_last_name: ownerData.maternal_last_name?.trim() || null,
        rut: ownerData.rut.trim(),
        address_street: ownerData.address_street?.trim() || null,
        address_number: ownerData.address_number?.trim() || null,
        address_department: ownerData.address_department?.trim() || null,
        address_commune: ownerData.address_commune?.trim() || null,
        address_region: ownerData.address_region?.trim() || null,
        marital_status: ownerData.marital_status,
        property_regime: cleanPropertyRegime,
        phone: ownerData.phone?.trim() || null,
        email: ownerData.email?.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (existingOwner) {
        // Actualizar propietario existente
        console.log('📝 Actualizando propietario existente:', existingOwner.id);

        const { data: updatedOwner, error: updateError } = await supabase
          .from('rental_owners')
          .update(ownerPayload)
          .eq('id', existingOwner.id)
          .select('id, rental_owner_characteristic_id')
          .single();

        if (updateError) {
          console.error('❌ Error actualizando propietario:', updateError);
          throw updateError;
        }

        console.log('✅ Propietario actualizado:', updatedOwner.id);
        console.log('🆔 Characteristic ID:', updatedOwner.rental_owner_characteristic_id);
        return updatedOwner.id;

      } else {
        // Crear nuevo propietario
        console.log('🆕 Creando nuevo propietario...');

        const { data: newOwner, error: insertError } = await supabase
          .from('rental_owners')
          .insert({
            ...ownerPayload,
            created_at: new Date().toISOString(),
          })
          .select('id, rental_owner_characteristic_id')
          .single();

        if (insertError) {
          console.error('❌ Error creando propietario:', insertError);
          throw insertError;
        }

        console.log('✅ Nuevo propietario creado:', newOwner.id);
        console.log('🆔 Characteristic ID:', newOwner.rental_owner_characteristic_id);
        return newOwner.id;
      }

    } catch (error) {
      console.error('❌ Error en saveRentalOwner:', error);
      throw error;
    }
  };

  // Función para verificar si el perfil está completo
  const checkProfileComplete = (profile: any) => {
    return profile &&
           profile.first_name &&
           profile.paternal_last_name &&
           profile.rut;
  };

  // Función optimizada para verificar si existe una propiedad en la dirección especificada
  // Solo se ejecuta cuando es realmente necesario para evitar consultas innecesarias
  const checkAddressExists = async (street: string, number: string, department: string | null) => {
    try {
      // Solo verificar si la dirección parece sospechosa (múltiples propiedades en misma dirección)
      const normalizedStreet = street.trim().toLowerCase();
      const normalizedNumber = number.trim();

      // Primero hacer una consulta más amplia para ver si hay muchas propiedades en esta calle
      const { count: streetCount, error: countError } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('address_street', normalizedStreet)
        .eq('address_number', normalizedNumber);

      if (countError) {
        console.error('Error verificando dirección:', countError);
        return false;
      }

      // Si hay más de 3 propiedades en la misma dirección, es sospechoso
      if (streetCount && streetCount > 3) {
        console.warn(`⚠️ Dirección sospechosa: ${streetCount} propiedades en ${normalizedStreet} ${normalizedNumber}`);

        // Verificar específicamente con departamento si está presente
        let query = supabase
          .from('properties')
          .select('id, owner_id')
          .eq('address_street', normalizedStreet)
          .eq('address_number', normalizedNumber);

        if (department && department.trim() !== '') {
          query = query.eq('address_department', department.trim());
        } else {
          query = query.or('address_department.is.null,address_department.eq.' + '');
        }

        const { data, error } = await query.limit(1);

        if (error) {
          console.error('Error verificando dirección específica:', error);
          return false;
        }

        return data && data.length > 0;
      }

      return false; // No hay suficientes propiedades para ser preocupante
    } catch (error) {
      console.error('Error en verificación de dirección:', error);
      return false;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setProfileLoading(false);
        return;
      }

      try {
        // Cargar perfil del usuario actual
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Error cargando perfil:', profileError);
          setOwnerProfile(null);
          setProfileComplete(false);
        } else {
          setOwnerProfile(userProfile);
          setProfileComplete(checkProfileComplete(userProfile));
        }

        // Si estamos editando una propiedad existente, cargar sus datos
        if (property) {
          // 2. Cargar datos del propietario desde rental_owners
          console.log('👤 Cargando datos del propietario...');

          const { data: ownerData, error: ownerError } = await supabase
            .from('rental_owners')
            .select('*')
            .eq('property_id', property.id)
            .maybeSingle();

          if (ownerError && ownerError.code !== 'PGRST116') {
            // PGRST116 = no rows returned (es esperado si no hay propietario)
            console.error('❌ Error cargando propietario:', ownerError);
          }

          if (ownerData) {
            console.log('✅ Datos del propietario cargados:', ownerData);
          } else {
            console.log('ℹ️ No se encontró propietario para esta propiedad');
          }

          const propertyFormData: PublishPropertyFormData = {
            listing_type: property.listing_type,
            address_street: property.address_street,
            address_number: property.address_number,
            address_department: property.address_department || '',
            address_commune: property.address_commune,
            address_region: property.address_region,
            price_clp: property.price_clp.toString(),
            common_expenses_clp: property.common_expenses_clp?.toString() || '',
            bedrooms: property.bedrooms.toString(),
            bathrooms: property.bathrooms.toString(),
            surface_m2: property.surface_m2.toString(),
            tiene_bodega: (property.tiene_bodega ? 'Sí' : 'No') as 'Sí' | 'No',
            metros_bodega: property.metros_bodega?.toString() || '',
            ubicacion_bodega: property.ubicacion_bodega || '',
            ubicacion_estacionamiento: property.ubicacion_estacionamiento || '',
            description: property.description,

            // Información del propietario (legacy - se mantiene por compatibilidad)
            // Si hay datos en rental_owners, usar esos; si no, usar los de properties
            owner_type: (property.owner_type as 'natural' | 'juridica') || 'natural',
            owner_first_name: ownerData?.first_name || property.owner_first_name || '',
            owner_paternal_last_name: ownerData?.paternal_last_name || property.owner_paternal_last_name || '',
            owner_maternal_last_name: ownerData?.maternal_last_name || property.owner_maternal_last_name || '',
            owner_rut: ownerData?.rut || property.owner_rut || '',
            owner_email: ownerData?.email || property.owner_email || '',
            owner_phone: ownerData?.phone || property.owner_phone || '',
            owner_company_name: property.owner_company_name || '',
            owner_company_rut: property.owner_company_rut || '',
            owner_company_business: property.owner_company_business || '',
            owner_company_email: property.owner_company_email || '',
            owner_company_phone: property.owner_company_phone || '',
            owner_representative_first_name: property.owner_representative_first_name || '',
            owner_representative_paternal_last_name: property.owner_representative_paternal_last_name || '',
            owner_representative_maternal_last_name: property.owner_representative_maternal_last_name || '',
            owner_representative_rut: property.owner_representative_rut || '',
            owner_representative_email: property.owner_representative_email || '',
            owner_representative_phone: property.owner_representative_phone || '',

            // Datos del propietario para rental_owners
            owner: ownerData ? {
              first_name: ownerData.first_name || '',
              paternal_last_name: ownerData.paternal_last_name || '',
              maternal_last_name: ownerData.maternal_last_name || null,
              rut: ownerData.rut || '',
              address_street: ownerData.address_street || null,
              address_number: ownerData.address_number || null,
              address_department: ownerData.address_department || null,
              address_commune: ownerData.address_commune || null,
              address_region: ownerData.address_region || null,
              marital_status: ownerData.marital_status || 'soltero',
              property_regime: ownerData.property_regime || null,
              phone: ownerData.phone || null,
              email: ownerData.email || null,
            } : {
              // Valores por defecto si no hay propietario
              first_name: '',
              paternal_last_name: '',
              maternal_last_name: null,
              rut: '',
              address_street: null,
              address_number: null,
              address_department: null,
              address_commune: null,
              address_region: null,
              marital_status: 'soltero',
              property_regime: null,
              phone: null,
              email: null,
            }
          };

          setFormData(propertyFormData);
        }
      } catch (error) {
        console.error('Error en carga inicial:', error);
        setOwnerProfile(null);
        setProfileComplete(false);
      } finally {
        setProfileLoading(false);
      }
    };

    loadData();
  }, [user, property]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Manejar campos anidados del propietario
    if (name.startsWith('owner.')) {
      const ownerField = name.replace('owner.', '');
      setFormData(prev => ({
        ...prev,
        owner: {
          ...prev.owner,
          [ownerField]: value || null // Convertir string vacío a null para campos opcionales
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDocuments(Array.from(e.target.files));
    }
  };

  const uploadImages = async (propertyId: string) => {
    // Verificar que el usuario sea el propietario de la propiedad
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('owner_id')
      .eq('id', propertyId)
      .single();

    if (propertyError) {
      throw new Error(`Error verificando propiedad: ${propertyError.message}`);
    }

    if (property.owner_id !== user?.id) {
      throw new Error('No tienes permisos para subir imágenes en esta propiedad');
    }

    const uploadedImages = [];

    for (const image of images) {
      // Validar tipo de archivo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(image.type)) {
        throw new Error(`Tipo de imagen no permitido: ${image.type}. Solo se permiten JPG, PNG, WebP y GIF.`);
      }

      // Validar tamaño del archivo (máximo según constantes compartidas)
      const maxSize = FILE_SIZE_LIMITS.IMAGE_MAX_SIZE;
      if (image.size > maxSize) {
        throw new Error(`Imagen demasiado grande: ${image.name}. Tamaño máximo: 10MB.`);
      }

      const fileExt = image.name.split('.').pop() || 'jpg';
      // Estructura de carpetas según políticas RLS: {property_id}/{timestamp}-{index}.{ext}
      const timestamp = Date.now();
      const index = uploadedImages.length;
      const fileName = `${propertyId}/${timestamp}-${index}.${fileExt}`;

      console.log(`📤 Subiendo imagen: ${fileName}`);

      const { data, error } = await supabase.storage
        .from('property-images')
        .upload(fileName, image, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error subiendo imagen:', error);
        throw new Error(`Error subiendo imagen ${image.name}: ${error.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(data.path);

      // Guardar referencia en la base de datos
      const { error: dbError } = await supabase
        .from('property_images')
        .insert({
          property_id: propertyId,
          image_url: publicUrl,
          storage_path: data.path
        });

      if (dbError) {
        console.error('Error guardando imagen en BD:', dbError);
        // Intentar eliminar la imagen del storage si falló la inserción en BD
        try {
          await supabase.storage
            .from('property-images')
            .remove([data.path]);
        } catch (cleanupError) {
          console.error('Error limpiando imagen del storage:', cleanupError);
        }
        throw new Error(`Error guardando referencia de imagen: ${dbError.message}`);
      }

      uploadedImages.push(publicUrl);
    }

    return uploadedImages;
  };

  const uploadDocuments = async (propertyId: string) => {
    if (!user) throw new Error('Usuario no autenticado');

    // Verificar que el usuario sea el propietario de la propiedad
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('owner_id')
      .eq('id', propertyId)
      .single();

    if (propertyError) {
      throw new Error(`Error verificando propiedad: ${propertyError.message}`);
    }

    if (property.owner_id !== user.id) {
      throw new Error('No tienes permisos para subir documentos en esta propiedad');
    }

    const uploadedDocuments = [];

    for (const document of documents) {
      // Validar tipo de archivo
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(document.type)) {
        throw new Error(`Tipo de archivo no permitido: ${document.type}. Solo se permiten PDF, DOC y DOCX.`);
      }

      // Validar tamaño del archivo (máximo según constantes compartidas)
      const maxSize = FILE_SIZE_LIMITS.DOCUMENT_MAX_SIZE;
      if (document.size > maxSize) {
        throw new Error(`Documento demasiado grande: ${document.name}. Tamaño máximo: 50MB.`);
      }

      // const fileExt = document.name.split('.').pop(); // Not used in current sanitized filename approach
      // Estructura de carpetas según políticas RLS: {user_id}/{entity_type}/{entity_id}/{timestamp}-{filename}
      const timestamp = Date.now();
      const sanitizedFileName = document.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${user.id}/property_legal/${propertyId}/${timestamp}-${sanitizedFileName}`;

      console.log(`📤 Subiendo documento: ${fileName}`);

      const { data, error } = await supabase.storage
        .from('user-documents')
        .upload(fileName, document, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error subiendo documento:', error);
        throw new Error(`Error subiendo documento ${document.name}: ${error.message}`);
      }

      // Guardar referencia en la base de datos
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          uploader_id: user.id,
          related_entity_id: propertyId,
          related_entity_type: 'property_legal',
          document_type: document.type,
          storage_path: data.path,
          file_name: sanitizedFileName
        });

      if (dbError) {
        console.error('Error guardando documento en BD:', dbError);
        // Intentar eliminar el documento del storage si falló la inserción en BD
        try {
          await supabase.storage
            .from('user-documents')
            .remove([data.path]);
        } catch (cleanupError) {
          console.error('Error limpiando documento del storage:', cleanupError);
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
      // Verificar que el usuario esté autenticado
      if (!user) {
        throw new Error('Usuario no autenticado. Por favor, inicia sesión para continuar.');
      }

      if (authLoading) {
        throw new Error('Cargando información del usuario. Por favor, espera un momento.');
      }

      // Validar campos requeridos
      if (!formData.address_street || !formData.address_number || !formData.address_commune || !formData.address_region) {
        throw new Error('Por favor, completa todos los campos de dirección requeridos.');
      }

      if (!formData.price_clp || !formData.bedrooms || !formData.bathrooms || !formData.surface_m2 || !formData.description) {
        throw new Error('Por favor, completa todos los campos obligatorios de la propiedad.');
      }

      // Validar campos del propietario (legacy)
      if (formData.owner_type === 'natural') {
        if (!formData.owner_first_name || !formData.owner_paternal_last_name || !formData.owner_rut || !formData.owner_email) {
          throw new Error('Por favor, completa todos los campos obligatorios del propietario (Persona Natural).');
        }
      } else if (formData.owner_type === 'juridica') {
        if (!formData.owner_company_name || !formData.owner_company_rut || !formData.owner_company_business || !formData.owner_company_email) {
          throw new Error('Por favor, completa todos los campos obligatorios de la empresa.');
        }
        if (!formData.owner_representative_first_name || !formData.owner_representative_paternal_last_name || !formData.owner_representative_rut || !formData.owner_representative_email) {
          throw new Error('Por favor, completa todos los campos obligatorios del representante legal.');
        }
      }

      // Validar campos del propietario para rental_owners
      if (!formData.owner.first_name?.trim()) {
        throw new Error('El nombre del propietario es requerido.');
      }
      if (!formData.owner.paternal_last_name?.trim()) {
        throw new Error('El apellido paterno del propietario es requerido.');
      }
      if (!formData.owner.rut?.trim()) {
        throw new Error('El RUT del propietario es requerido.');
      }
      // Validar RUT
      if (!validateRut(formData.owner.rut)) {
        throw new Error('El RUT del propietario no es válido.');
      }
      // Validar property_regime solo si está casado
      if (formData.owner.marital_status === 'casado' && !formData.owner.property_regime) {
        throw new Error('Debe especificar el régimen patrimonial si el propietario está casado.');
      }

      // Verificar si ya existe una propiedad en esta dirección (solo para nuevas propiedades)
      if (!property) {
        const addressExists = await checkAddressExists(
          formData.address_street.trim(),
          formData.address_number.trim(),
          formData.address_department?.trim() || null
        );

        if (addressExists) {
          throw new Error('Ya existe una propiedad publicada en esta dirección. Por favor, verifica la dirección o contacta al propietario si es tu propiedad.');
        }
      }

      // Objeto para la tabla 'properties'
      const propertyData = {
        owner_id: user.id,
        listing_type: formData.listing_type,
        address_street: formData.address_street,
        address_number: formData.address_number,
        address_department: formData.address_department || null,
        address_commune: formData.address_commune,
        address_region: formData.address_region,
        price_clp: parseInt(formData.price_clp),
        common_expenses_clp: formData.common_expenses_clp ? parseInt(formData.common_expenses_clp) : null,
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseInt(formData.bathrooms),
        surface_m2: parseInt(formData.surface_m2),
        tiene_bodega: formData.tiene_bodega === 'Sí',
        metros_bodega: formData.metros_bodega ? parseInt(formData.metros_bodega) : null,
        ubicacion_bodega: formData.ubicacion_bodega || null,
        ubicacion_estacionamiento: formData.ubicacion_estacionamiento || null,
        description: formData.description,

        // Información del propietario
        owner_type: formData.owner_type,
        // Campos para persona natural
        owner_first_name: formData.owner_first_name || null,
        owner_paternal_last_name: formData.owner_paternal_last_name || null,
        owner_maternal_last_name: formData.owner_maternal_last_name || null,
        owner_rut: formData.owner_rut || null,
        owner_email: formData.owner_email || null,
        owner_phone: formData.owner_phone || null,
        // Campos para persona jurídica
        owner_company_name: formData.owner_company_name || null,
        owner_company_rut: formData.owner_company_rut || null,
        owner_company_business: formData.owner_company_business || null,
        owner_company_email: formData.owner_company_email || null,
        owner_company_phone: formData.owner_company_phone || null,
        // Campos para representante legal
        owner_representative_first_name: formData.owner_representative_first_name || null,
        owner_representative_paternal_last_name: formData.owner_representative_paternal_last_name || null,
        owner_representative_maternal_last_name: formData.owner_representative_maternal_last_name || null,
        owner_representative_rut: formData.owner_representative_rut || null,
        owner_representative_email: formData.owner_representative_email || null,
        owner_representative_phone: formData.owner_representative_phone || null,
      };

      let propertyId: string;

      if (property) {
        // Actualizar propiedad existente
        const { data, error } = await supabase
          .from('properties')
          .update(propertyData)
          .eq('id', property.id)
          .select()
          .single();

        if (error) throw error;
        propertyId = data.id;
        console.log('✅ Propiedad actualizada:', propertyId);
      } else {
        // Crear nueva propiedad
        const { data, error } = await supabase
          .from('properties')
          .insert(propertyData)
          .select()
          .single();

        if (error) throw error;
        propertyId = data.id;
        console.log('✅ Nueva propiedad creada:', propertyId);
      }

      // NUEVO: Guardar datos del propietario en rental_owners
      console.log('👤 Guardando datos del propietario...');

      // Sincronizar datos del propietario desde campos legacy
      const ownerData = {
        first_name: formData.owner_first_name || formData.owner.first_name || '',
        paternal_last_name: formData.owner_paternal_last_name || formData.owner.paternal_last_name || '',
        maternal_last_name: formData.owner_maternal_last_name || formData.owner.maternal_last_name || null,
        rut: formData.owner_rut || formData.owner.rut || '',
        address_street: formData.owner.address_street || null,
        address_number: formData.owner.address_number || null,
        address_department: formData.owner.address_department || null,
        address_commune: formData.owner.address_commune || null,
        address_region: formData.owner.address_region || null,
        marital_status: formData.owner.marital_status || 'soltero',
        property_regime: formData.owner.property_regime || null,
        phone: formData.owner_phone || formData.owner.phone || null,
        email: formData.owner_email || formData.owner.email || null,
      };

      console.log('📋 Datos del propietario a guardar:', JSON.stringify(ownerData, null, 2));

      // Verificar que los datos del propietario sean válidos
      if (!ownerData.first_name || !ownerData.paternal_last_name || !ownerData.rut) {
        console.warn('⚠️ Datos del propietario incompletos, omitiendo guardado');
        setError('Advertencia: Los datos del propietario están incompletos. La propiedad se publicó pero los datos del propietario no se guardaron.');
      } else {
        try {
          const ownerId = await saveRentalOwner(propertyId, ownerData);
          console.log('✅ Propietario guardado exitosamente:', ownerId);
        } catch (ownerError) {
          console.error('❌ Error guardando propietario:', ownerError);
          // Mostrar advertencia pero no fallar la publicación completa
          setError(`Advertencia: ${ownerError.message}. La propiedad se publicó pero los datos del propietario no se guardaron correctamente.`);
          // Continuar con el proceso
        }
      }

      // Subir imágenes si hay
      if (images.length > 0) {
        await uploadImages(propertyId);
      }

      // Subir documentos si hay
      if (documents.length > 0) {
        await uploadDocuments(propertyId);
      }

      onSuccess?.();
    } catch (err) {
      console.error('Error al publicar propiedad:', err);
      let errorMessage = 'Error desconocido al publicar la propiedad';

      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Si está cargando la autenticación o el perfil, mostrar loading
  if (authLoading || profileLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">
              {authLoading ? 'Verificando autenticación...' : 'Cargando tu perfil...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Si el perfil no está completo, mostrar mensaje de advertencia
  if (!profileComplete) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center py-12">
          <div className="text-amber-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Perfil Incompleto</h2>
          <p className="text-gray-600 mb-6">
            Para publicar una propiedad, primero debes completar tu perfil con tu nombre y RUT.
            Esta información es necesaria para verificar tu identidad como propietario.
          </p>
          <button
            onClick={() => navigate('/profile')}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Completar Mi Perfil
          </button>
        </div>
      </div>
    );
  }

  // Si no hay usuario autenticado, mostrar mensaje
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Usuario no autenticado</h2>
          <p className="text-gray-600 mb-6">
            Debes iniciar sesión para publicar una propiedad.
          </p>
          <button
            onClick={() => navigate('/auth')}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Ir a Iniciar Sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {property ? 'Editar Propiedad' : 'Publicar Nueva Propiedad'}
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className={`space-y-6 ${!user ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Tipo de Listado */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Listado *
          </label>
          <select
            name="listing_type"
            value={formData.listing_type}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            {LISTING_TYPE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Dirección */}
        <div className="space-y-4">
          <div>
            <label htmlFor="address_street" className="block text-sm font-medium text-gray-700 mb-2">
              Calle
            </label>
            <input
              type="text"
              id="address_street"
              name="address_street"
              value={formData.address_street}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="address_number" className="block text-sm font-medium text-gray-700 mb-2">
              Número
            </label>
            <input
              type="text"
              id="address_number"
              name="address_number"
              value={formData.address_number}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="address_department" className="block text-sm font-medium text-gray-700 mb-2">
              Departamento / Oficina (Opcional)
            </label>
            <input
              type="text"
              id="address_department"
              name="address_department"
              value={formData.address_department}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comuna *
              </label>
              <input
                type="text"
                name="address_commune"
                value={formData.address_commune}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Región *
              </label>
              <select
                name="address_region"
                value={formData.address_region}
                onChange={handleInputChange}
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

        {/* Precio y Gastos Comunes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Precio (CLP) *
            </label>
            <input
              type="number"
              name="price_clp"
              value={formData.price_clp}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              min="0"
            />
            {formData.price_clp && (
              <p className="text-sm text-gray-600 mt-1">
                {formatPriceCLP(parseInt(formData.price_clp))}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gastos Comunes (CLP)
            </label>
            <input
              type="number"
              name="common_expenses_clp"
              value={formData.common_expenses_clp}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
            />
            {formData.common_expenses_clp && (
              <p className="text-sm text-gray-600 mt-1">
                {formatPriceCLP(parseInt(formData.common_expenses_clp))}
              </p>
            )}
          </div>
        </div>

        {/* Características */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dormitorios *
            </label>
            <input
              type="number"
              name="bedrooms"
              value={formData.bedrooms}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Baños *
            </label>
            <input
              type="number"
              name="bathrooms"
              value={formData.bathrooms}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Superficie (m²) *
            </label>
            <input
              type="number"
              name="surface_m2"
              value={formData.surface_m2}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              min="0"
            />
          </div>
        </div>

        {/* Ubicación de Estacionamientos */}
        <div>
          <label htmlFor="ubicacion_estacionamiento" className="block text-sm font-medium text-gray-700 mb-2">
            Ubicación/Nº Estacionamiento(s) (Opcional)
          </label>
          <input
            type="text"
            id="ubicacion_estacionamiento"
            name="ubicacion_estacionamiento"
            value={formData.ubicacion_estacionamiento}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ej: E-21, E-22 (piso -2)"
          />
        </div>

        {/* Bodega */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bodega
            </label>
            <select
              name="tiene_bodega"
              value={formData.tiene_bodega}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="No">No</option>
              <option value="Sí">Sí</option>
            </select>
          </div>

          {formData.tiene_bodega === 'Sí' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  M² Bodega
                </label>
                <input
                  type="number"
                  name="metros_bodega"
                  value={formData.metros_bodega}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: 5"
                  min="0"
                />
              </div>
              <div>
                <label htmlFor="ubicacion_bodega" className="block text-sm font-medium text-gray-700 mb-2">
                  Ubicación/Nº Bodega (Opcional)
                </label>
                <input
                  type="text"
                  id="ubicacion_bodega"
                  name="ubicacion_bodega"
                  value={formData.ubicacion_bodega}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: B-115 (piso -1)"
                />
              </div>
            </>
          )}
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descripción *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {/* Información del Propietario */}
        <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Datos del Propietario
          </h3>

          {/* Selector de Tipo de Persona */}
          <div className="mb-6">
            <label htmlFor="owner_type" className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Propietario *
            </label>
            <select
              id="owner_type"
              name="owner_type"
              value={formData.owner_type || 'natural'}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="natural">Persona Natural</option>
              <option value="juridica">Persona Jurídica</option>
            </select>
          </div>

          {/* Campos para Persona Natural */}
          {formData.owner_type === 'natural' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="owner_first_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Nombres *
                  </label>
                  <input
                    type="text"
                    id="owner_first_name"
                    name="owner_first_name"
                    value={formData.owner_first_name || ''}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required={formData.owner_type === 'natural'}
                  />
                </div>

                <div>
                  <label htmlFor="owner_paternal_last_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Apellido Paterno *
                  </label>
                  <input
                    type="text"
                    id="owner_paternal_last_name"
                    name="owner_paternal_last_name"
                    value={formData.owner_paternal_last_name || ''}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required={formData.owner_type === 'natural'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="owner_maternal_last_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Apellido Materno
                  </label>
                  <input
                    type="text"
                    id="owner_maternal_last_name"
                    name="owner_maternal_last_name"
                    value={formData.owner_maternal_last_name || ''}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="owner_rut" className="block text-sm font-medium text-gray-700 mb-2">
                    RUT *
                  </label>
                  <input
                    type="text"
                    id="owner_rut"
                    name="owner_rut"
                    value={formData.owner_rut || ''}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="12.345.678-9"
                    required={formData.owner_type === 'natural'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="owner_email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="owner_email"
                    name="owner_email"
                    value={formData.owner_email || ''}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required={formData.owner_type === 'natural'}
                  />
                </div>

                <div>
                  <label htmlFor="owner_phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    id="owner_phone"
                    name="owner_phone"
                    value={formData.owner_phone || ''}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Campos para Persona Jurídica */}
          {formData.owner_type === 'juridica' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="owner_company_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Razón Social *
                  </label>
                  <input
                    type="text"
                    id="owner_company_name"
                    name="owner_company_name"
                    value={formData.owner_company_name || ''}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nombre de la empresa Ltda."
                    required={formData.owner_type === 'juridica'}
                  />
                </div>

                <div>
                  <label htmlFor="owner_company_rut" className="block text-sm font-medium text-gray-700 mb-2">
                    RUT de la Empresa *
                  </label>
                  <input
                    type="text"
                    id="owner_company_rut"
                    name="owner_company_rut"
                    value={formData.owner_company_rut || ''}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="76.123.456-7"
                    required={formData.owner_type === 'juridica'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="owner_company_business" className="block text-sm font-medium text-gray-700 mb-2">
                    Giro *
                  </label>
                  <input
                    type="text"
                    id="owner_company_business"
                    name="owner_company_business"
                    value={formData.owner_company_business || ''}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Actividades inmobiliarias"
                    required={formData.owner_type === 'juridica'}
                  />
                </div>

                <div>
                  <label htmlFor="owner_company_email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email de la Empresa *
                  </label>
                  <input
                    type="email"
                    id="owner_company_email"
                    name="owner_company_email"
                    value={formData.owner_company_email || ''}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required={formData.owner_type === 'juridica'}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="owner_company_phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono de la Empresa
                </label>
                <input
                  type="tel"
                  id="owner_company_phone"
                  name="owner_company_phone"
                  value={formData.owner_company_phone || ''}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <h4 className="text-md font-semibold pt-4 border-t border-gray-300 mt-6">
                Datos del Representante Legal
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="owner_representative_first_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Nombres del Representante *
                  </label>
                  <input
                    type="text"
                    id="owner_representative_first_name"
                    name="owner_representative_first_name"
                    value={formData.owner_representative_first_name || ''}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required={formData.owner_type === 'juridica'}
                  />
                </div>

                <div>
                  <label htmlFor="owner_representative_paternal_last_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Apellido Paterno del Representante *
                  </label>
                  <input
                    type="text"
                    id="owner_representative_paternal_last_name"
                    name="owner_representative_paternal_last_name"
                    value={formData.owner_representative_paternal_last_name || ''}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required={formData.owner_type === 'juridica'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="owner_representative_maternal_last_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Apellido Materno del Representante
                  </label>
                  <input
                    type="text"
                    id="owner_representative_maternal_last_name"
                    name="owner_representative_maternal_last_name"
                    value={formData.owner_representative_maternal_last_name || ''}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="owner_representative_rut" className="block text-sm font-medium text-gray-700 mb-2">
                    RUT del Representante *
                  </label>
                  <input
                    type="text"
                    id="owner_representative_rut"
                    name="owner_representative_rut"
                    value={formData.owner_representative_rut || ''}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="12.345.678-9"
                    required={formData.owner_type === 'juridica'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="owner_representative_email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email del Representante *
                  </label>
                  <input
                    type="email"
                    id="owner_representative_email"
                    name="owner_representative_email"
                    value={formData.owner_representative_email || ''}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required={formData.owner_type === 'juridica'}
                  />
                </div>

                <div>
                  <label htmlFor="owner_representative_phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono del Representante
                  </label>
                  <input
                    type="tel"
                    id="owner_representative_phone"
                    name="owner_representative_phone"
                    value={formData.owner_representative_phone || ''}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Información Adicional del Propietario para rental_owners */}
          <div className="mt-8 pt-6 border-t border-gray-300">
            <h4 className="text-md font-semibold text-gray-800 mb-4">
              Información Adicional del Propietario
            </h4>

            {/* Estado Civil */}
            <div className="mb-4">
              <label htmlFor="owner_marital_status" className="block text-sm font-medium text-gray-700 mb-2">
                Estado Civil *
              </label>
              <select
                id="owner_marital_status"
                name="owner.marital_status"
                value={formData.owner.marital_status}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="soltero">Soltero/a</option>
                <option value="casado">Casado/a</option>
                <option value="divorciado">Divorciado/a</option>
                <option value="viudo">Viudo/a</option>
                <option value="conviviente_civil">Conviviente Civil</option>
              </select>
            </div>

            {/* Régimen Patrimonial - solo si está casado */}
            {formData.owner.marital_status === 'casado' && (
              <div className="mb-4">
                <label htmlFor="owner_property_regime" className="block text-sm font-medium text-gray-700 mb-2">
                  Régimen Patrimonial *
                </label>
                <select
                  id="owner_property_regime"
                  name="owner.property_regime"
                  value={formData.owner.property_regime || ''}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required={formData.owner.marital_status === 'casado'}
                >
                  <option value="">Seleccionar régimen</option>
                  <option value="separacion_bienes">Separación de bienes</option>
                  <option value="sociedad_conyugal">Sociedad conyugal</option>
                  <option value="participacion_gananciales">Participación en ganancias</option>
                </select>
              </div>
            )}

            {/* Dirección del Propietario */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección del Propietario (Opcional)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <input
                    type="text"
                    name="owner.address_street"
                    value={formData.owner.address_street || ''}
                    onChange={handleInputChange}
                    placeholder="Calle"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="owner.address_number"
                    value={formData.owner.address_number || ''}
                    onChange={handleInputChange}
                    placeholder="Número"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                <div>
                  <input
                    type="text"
                    name="owner.address_department"
                    value={formData.owner.address_department || ''}
                    onChange={handleInputChange}
                    placeholder="Depto/Oficina"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="owner.address_commune"
                    value={formData.owner.address_commune || ''}
                    onChange={handleInputChange}
                    placeholder="Comuna"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <select
                    name="owner.address_region"
                    value={formData.owner.address_region || ''}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar región</option>
                    {regions.map(region => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Contacto del Propietario */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="owner_phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono del Propietario
                </label>
                <input
                  type="tel"
                  id="owner_phone"
                  name="owner.phone"
                  value={formData.owner.phone || ''}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="owner_email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email del Propietario
                </label>
                <input
                  type="email"
                  id="owner_email"
                  name="owner.email"
                  value={formData.owner.email || ''}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Información del Usuario Publicador */}
          {ownerProfile && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Nota:</strong> Tú eres el publicador de esta propiedad. La información del propietario se almacenará
                por separado y no afectará tu perfil personal.
              </p>
            </div>
          )}
        </div>


        {/* Imágenes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Imágenes de la Propiedad
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-sm text-gray-600 mt-1">
            Puedes seleccionar múltiples imágenes. Formatos: JPG, PNG, WebP
          </p>
        </div>

        {/* Documentos Legales */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Documentos Legales
          </label>
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx"
            onChange={handleDocumentChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-sm text-gray-600 mt-1">
            Dominio vigente, escrituras, etc. Formatos: PDF, DOC, DOCX
          </p>
        </div>

        {/* Certificado de Personería (solo para persona jurídica) */}
        {formData.owner_type === 'juridica' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Certificado de Personería
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  setDocuments(prev => [...prev, ...Array.from(e.target.files)]);
                }
              }}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-600 mt-1">
              Documento requerido para personas jurídicas. Formato: PDF
            </p>
          </div>
        )}

        {/* Botones */}
        <div className="flex justify-end space-x-4">
          {onCancel && (
            <CustomButton
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar
            </CustomButton>
          )}
          <CustomButton
            type="submit"
            variant="primary"
            disabled={loading || !user || authLoading}
            loading={loading}
            loadingText="Publicando..."
          >
            {property ? 'Actualizar Propiedad' : 'Publicar Propiedad'}
          </CustomButton>
        </div>
      </form>
    </div>
  );
};

export default PropertyPublicationForm;
