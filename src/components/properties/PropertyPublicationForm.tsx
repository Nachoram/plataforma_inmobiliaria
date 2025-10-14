import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, Property, formatPriceCLP, CHILE_REGIONS, LISTING_TYPE_OPTIONS, FILE_SIZE_LIMITS } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import CustomButton from '../common/CustomButton';

interface PropertyPublicationFormProps {
  property?: Property;
  onSuccess?: () => void;
  onCancel?: () => void;
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

  const [formData, setFormData] = useState({
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
  });

  const [images, setImages] = useState<File[]>([]);
  const [documents, setDocuments] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Usar constantes compartidas
  const regions = CHILE_REGIONS;

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
          const propertyFormData = {
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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
      } else {
        // Crear nueva propiedad
        const { data, error } = await supabase
          .from('properties')
          .insert(propertyData)
          .select()
          .single();

        if (error) throw error;
        propertyId = data.id;
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

        {/* Información del Propietario Actual - Solo Lectura */}
        {ownerProfile && (
          <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Información del Propietario Actual
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-md border">
                <p className="text-sm text-gray-600">Nombre Completo</p>
                <p className="font-medium text-gray-900">
                  {ownerProfile.first_name || 'No especificado'} {ownerProfile.paternal_last_name || ''} {ownerProfile.maternal_last_name || ''}
                </p>
              </div>

              <div className="bg-white p-4 rounded-md border">
                <p className="text-sm text-gray-600">RUT</p>
                <p className="font-medium text-gray-900">{ownerProfile.rut || 'No especificado'}</p>
              </div>

              <div className="bg-white p-4 rounded-md border">
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-gray-900">{ownerProfile.email || 'No especificado'}</p>
              </div>

              <div className="bg-white p-4 rounded-md border">
                <p className="text-sm text-gray-600">Teléfono</p>
                <p className="font-medium text-gray-900">{ownerProfile.phone || 'No especificado'}</p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-100 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Nota:</strong> Esta es la información registrada en tu perfil. Si necesitas actualizar estos datos,
                puedes hacerlo desde la sección de <a href="/profile" className="underline hover:text-blue-600">Mi Perfil</a>.
              </p>
            </div>
          </div>
        )}


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