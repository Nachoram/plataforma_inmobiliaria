import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Upload, X, Image, Check, AlertCircle, Loader2 } from 'lucide-react';
import { supabase, Property } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

// Datos de regiones y comunas de Chile
const CHILE_REGIONS_COMMUNES = {
  'region-metropolitana': {
    name: 'Región Metropolitana de Santiago',
    communes: [
      'Cerrillos', 'Cerro Navia', 'Conchalí', 'El Bosque', 'Estación Central',
      'Huechuraba', 'Independencia', 'La Cisterna', 'La Florida', 'La Granja',
      'La Pintana', 'La Reina', 'Las Condes', 'Lo Barnechea', 'Lo Espejo',
      'Lo Prado', 'Macul', 'Maipú', 'Ñuñoa', 'Pedro Aguirre Cerda',
      'Peñalolén', 'Providencia', 'Pudahuel', 'Quilicura', 'Quinta Normal',
      'Recoleta', 'Renca', 'San Joaquín', 'San Miguel', 'San Ramón',
      'Santiago', 'Vitacura', 'Puente Alto', 'Pirque', 'San José de Maipo',
      'Colina', 'Lampa', 'Tiltil', 'San Bernardo', 'Buin', 'Calera de Tango',
      'Paine', 'Melipilla', 'Alhué', 'Curacaví', 'María Pinto', 'San Pedro',
      'Talagante', 'El Monte', 'Isla de Maipo', 'Padre Hurtado', 'Peñaflor'
    ]
  },
  'valparaiso': {
    name: 'Región de Valparaíso',
    communes: [
      'Valparaíso', 'Viña del Mar', 'Concón', 'Quintero', 'Puchuncaví',
      'Casablanca', 'Juan Fernández', 'San Antonio', 'Santo Domingo',
      'Cartagena', 'El Tabo', 'El Quisco', 'Algarrobo', 'San Felipe',
      'Llaillay', 'Putaendo', 'Santa María', 'Catemu', 'Panquehue',
      'Los Andes', 'Calle Larga', 'Rinconada', 'San Esteban',
      'La Ligua', 'Cabildo', 'Papudo', 'Zapallar', 'Petorca', 'Chincolco',
      'Hijuelas', 'La Calera', 'La Cruz', 'Limache', 'Nogales',
      'Olmué', 'Quillota'
    ]
  },
  'biobio': {
    name: 'Región del Biobío',
    communes: [
      'Concepción', 'Talcahuano', 'Hualpén', 'Chiguayante', 'San Pedro de la Paz',
      'Coronel', 'Lota', 'Hualqui', 'Santa Juana', 'Laja', 'Quilleco',
      'Cabrero', 'Tucapel', 'Antuco', 'San Rosendo', 'Yumbel', 'Pemuco',
      'Bulnes', 'Quillón', 'Florida', 'Chillán', 'Chillán Viejo', 'El Carmen',
      'Pemuco', 'Pinto', 'Coihueco', 'Ñiquén', 'San Ignacio', 'Quirihue',
      'Cobquecura', 'Trehuaco', 'Portezuelo', 'Coelemu', 'Ránquil',
      'Ninhue', 'San Carlos', 'Ñipas', 'San Fabián', 'San Nicolás',
      'Cañete', 'Contulmo', 'Curanilahue', 'Los Álamos', 'Tirúa',
      'Arauco', 'Lebu', 'Los Angeles', 'Cabrero', 'Tucapel', 'Antuco',
      'Quilleco', 'Santa Bárbara', 'Quilaco', 'Mulchén', 'Negrete',
      'Nacimiento', 'Laja'
    ]
  },
  'araucania': {
    name: 'Región de La Araucanía',
    communes: [
      'Temuco', 'Padre Las Casas', 'Lautaro', 'Perquenco', 'Vilcún',
      'Cholchol', 'Nueva Imperial', 'Carahue', 'Saavedra', 'Teodoro Schmidt',
      'Pitrufquén', 'Gorbea', 'Loncoche', 'Toltén', 'Cunco', 'Melipeuco',
      'Curarrehue', 'Pucón', 'Villarrica', 'Freire', 'Angol', 'Renaico',
      'Collipulli', 'Lonquimay', 'Curacautín', 'Ercilla', 'Victoria',
      'Traiguén', 'Lumaco', 'Purén', 'Los Sauces'
    ]
  },
  'los-lagos': {
    name: 'Región de Los Lagos',
    communes: [
      'Puerto Montt', 'Puerto Varas', 'Cochamó', 'Los Muermos', 'Fresia',
      'Frutillar', 'Llanquihue', 'Maullín', 'Calbuco', 'Castro', 'Ancud',
      'Quemchi', 'Dalcahue', 'Curaco de Vélez', 'Quinchao', 'Puqueldón',
      'Chonchi', 'Queilén', 'Quellón', 'Osorno', 'San Pablo', 'Puyehue',
      'Río Negro', 'Purranque', 'Puerto Octay', 'Frutillar', 'San Juan de la Costa',
      'Chaitén', 'Futaleufú', 'Hualaihué', 'Palena'
    ]
  },
  'ohiggins': {
    name: 'Región del Libertador General Bernardo O\'Higgins',
    communes: [
      'Rancagua', 'Codegua', 'Coinco', 'Coltauco', 'Doñihue', 'Graneros',
      'Las Cabras', 'Machalí', 'Malloa', 'Mostazal', 'Olivar', 'Peumo',
      'Pichidegua', 'Quinta de Tilcoco', 'Rengo', 'Requínoa', 'San Vicente',
      'Pichilemu', 'La Estrella', 'Litueche', 'Marchihue', 'Navidad',
      'Paredones', 'San Fernando', 'Chépica', 'Chimbarongo', 'Lolol',
      'Nancagua', 'Palmilla', 'Peralillo', 'Placilla', 'Pumanque',
      'Santa Cruz'
    ]
  }
};

export const PropertyForm: React.FC = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const isEditing = Boolean(id);
  const listingType = searchParams.get('type') as 'venta' | 'arriendo' || 'venta';
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Form data state
  const [formData, setFormData] = useState({
    type: listingType, // Cambiado de listing_type a type
    address: '',
    street: '',
    number: '',
    apartment: '', // Cambiado de apartment_number
    region: '',
    comuna: '', // Cambiado de commune
    price: '',
    common_expenses: '',
    bedrooms: '1',
    bathrooms: '1',
    surface_m2: '', // Surface in square meters
    description: '',
    photos_urls: [] as string[],
    documents: {
      // Required documents
      tax_assessment: null as File | null,
      ownership_certificate: null as File | null,
      ownership_history: null as File | null,
      // Optional documents
      marriage_certificate: null as File | null,
      power_of_attorney: null as File | null,
      property_plans: null as File | null,
      previous_contracts: null as File | null,
      previous_reports: null as File | null,
    }
  });

  // Photo preview state
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  useEffect(() => {
    if (isEditing && id) {
      fetchProperty();
    }
  }, [isEditing, id]);

  const fetchProperty = async () => {
    try {
      if (!id) {
        console.warn('No property ID provided for editing');
        return;
      }

      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          property_images (
            id,
            image_url,
            storage_path
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching property:', error);
        throw error;
      }

      if (!data) {
        console.warn('Property not found with ID:', id);
        return;
      }
      
      console.log('Property data loaded:', data);
      
      setFormData(prev => ({
        ...prev,
        type: data.listing_type || data.type || '',
        address: data.address_street ? `${data.address_street} ${data.address_number}` : (data.address || ''),
        street: data.address_street || data.street || '',
        number: data.address_number || data.number || '',
        apartment: data.address_department || data.apartment || '',
        region: data.address_region || '',
        comuna: data.address_commune || '',
        description: data.description || '',
        price: data.price_clp?.toString() || data.price?.toString() || '',
        common_expenses: data.common_expenses_clp?.toString() || data.common_expenses?.toString() || '',
        bedrooms: data.bedrooms?.toString() || '1',
        bathrooms: data.bathrooms?.toString() || '1',
        surface_m2: data.surface_m2?.toString() || '',
        photos_urls: data.property_images?.map(img => img.image_url) || [],
      }));

      // Cargar imágenes existentes en el estado de preview
      if (data.property_images && data.property_images.length > 0) {
        setPhotoPreviews(data.property_images.map(img => img.image_url));
      }
    } catch (error) {
      console.error('Error fetching property:', JSON.stringify(error, null, 2));
    }
  };

  // Obtener comunas disponibles según la región seleccionada
  const getAvailableCommunes = (regionKey: string) => {
    return CHILE_REGIONS_COMMUNES[regionKey as keyof typeof CHILE_REGIONS_COMMUNES]?.communes || [];
  };

  // Manejar cambio de región (resetear comuna)
  const handleRegionChange = (regionKey: string) => {
    setFormData(prev => ({
      ...prev,
      region: regionKey,
      comuna: '' // Resetear comuna cuando cambia la región
    }));
  };

  // Handle photo upload and preview
  const handlePhotoUpload = (files: FileList) => {
    const newFiles = Array.from(files);
    const newPreviews: string[] = [];

    newFiles.forEach(file => {
      // Verificar tamaño de archivo
      if (file.size > 5 * 1024 * 1024) { // 5MB máximo
        alert(`La imagen ${file.name} es demasiado grande. Máximo 5MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push(e.target?.result as string);
        if (newPreviews.length === newFiles.length) {
          setPhotoFiles(prev => [...prev, ...newFiles]);
          setPhotoPreviews(prev => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove photo from preview
  const removePhoto = (index: number) => {
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Handle document upload
  const handleDocumentUpload = (documentType: keyof typeof formData.documents, file: File) => {
    setFormData(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [documentType]: file
      }
    }));
  };

  // Remove document
  const removeDocument = (documentType: keyof typeof formData.documents) => {
    setFormData(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [documentType]: null
      }
    }));
  };

  // Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Required fields validation
    if (!formData.address.trim()) newErrors.address = 'La dirección es requerida';
    if (!formData.street.trim()) newErrors.street = 'La calle es requerida';
    if (!formData.number.trim()) newErrors.number = 'El número es requerido';
    if (!formData.region) newErrors.region = 'La región es requerida';
    if (!formData.comuna) newErrors.comuna = 'La comuna es requerida';
    if (!formData.price.trim()) newErrors.price = 'El precio es requerido';
    if (!formData.description.trim()) newErrors.description = 'La descripción es requerida';
    if (!formData.surface_m2.trim()) newErrors.surface_m2 = 'La superficie es requerida';

    // Photos validation
    if (!isEditing && photoFiles.length === 0 && formData.photos_urls.length === 0) {
      newErrors.photos = 'Debe subir al menos una foto de la propiedad';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Upload files to Supabase Storage
  const uploadFiles = async () => {
    const uploadedPhotoUrls: string[] = [];
    const uploadedDocumentUrls: string[] = [];

    setUploading(true);

    try {
      // Upload photos to propiedades-imagenes bucket
      for (const file of photoFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user?.id}/${Date.now()}-${Math.random()}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('images')
          .upload(fileName, file);

        if (error) {
          console.error('Error subiendo foto:', error);
          throw new Error(`Error subiendo foto: ${error.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(data.path);

        uploadedPhotoUrls.push(publicUrl);
      }

      // Upload documents to documentos-clientes bucket
      for (const [key, file] of Object.entries(formData.documents)) {
        if (file) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${user?.id}/${key}-${Date.now()}.${fileExt}`;

                  const { data, error } = await supabase.storage
          .from('files')
          .upload(fileName, file);

          if (error) {
            console.error('Error subiendo documento:', error);
            throw new Error(`Error subiendo documento ${key}: ${error.message}`);
          }

                  const { data: { publicUrl } } = supabase.storage
          .from('files')
          .getPublicUrl(data.path);

          uploadedDocumentUrls.push(publicUrl);
        }
      }
    } finally {
      setUploading(false);
    }

    return { uploadedPhotoUrls, uploadedDocumentUrls };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      // Validar que tenemos conexión a Supabase
      if (!user) {
        throw new Error('Debes estar logueado para publicar una propiedad');
      }

      // Verificar conexión con un query simple
      const { error: connectionError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
        
      if (connectionError) {
        throw new Error('Error de conexión con la base de datos: ' + connectionError.message);
      }

      let documentUrls: string[] = [];
      let propertyId = id; // Para edición
      let uploadedPhotoUrls: string[] = [];

      // Upload new files if any
      if (photoFiles.length > 0 || Object.values(formData.documents).some(doc => doc !== null)) {
        try {
          const uploadResult = await uploadFiles();
          uploadedPhotoUrls = uploadResult.uploadedPhotoUrls;
          documentUrls = uploadResult.uploadedDocumentUrls;
        } catch (uploadError: any) {
          throw new Error('Error subiendo archivos: ' + uploadError.message);
        }
      }

      const propertyData = {
        owner_id: user.id,
        listing_type: formData.type,
        address_street: formData.street || formData.address.split(' ')[0] || 'Sin especificar',
        address_number: formData.number || 'S/N',
        address_department: formData.apartment || null,
        address_region: formData.region,
        address_commune: formData.comuna,
        description: formData.description || 'Sin descripción',
        price_clp: parseInt(formData.price),
        common_expenses_clp: formData.common_expenses ? parseInt(formData.common_expenses) : 0,
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseInt(formData.bathrooms),
        surface_m2: formData.surface_m2 ? parseInt(formData.surface_m2) : 50,
        status: 'disponible'
      };

      console.log('🏠 Enviando datos de propiedad:', propertyData);

      if (isEditing) {
        const { error } = await supabase
          .from('properties')
          .update(propertyData)
          .eq('id', id);
        
        if (error) {
          console.error('❌ Error actualizando propiedad:', error);
          throw new Error('Error actualizando propiedad: ' + error.message);
        }
        
        // Guardar nuevas imágenes en la tabla property_images para edición
        if (uploadedPhotoUrls.length > 0 && propertyId) {
          const imageRecords = uploadedPhotoUrls.map(url => ({
            property_id: propertyId,
            image_url: url,
            storage_path: url
          }));
          
          const { error: imageError } = await supabase
            .from('property_images')
            .insert(imageRecords);
            
          if (imageError) {
            console.error('Error guardando imágenes:', imageError);
            throw new Error('Error guardando imágenes: ' + imageError.message);
          }
        }
        
        console.log('✅ Propiedad actualizada exitosamente');
      } else {
        const { data, error } = await supabase
          .from('properties')
          .insert(propertyData)
          .select();
        
        if (error) {
          console.error('❌ Error creando propiedad:', error);
          throw new Error('Error creando propiedad: ' + error.message);
        }
        
        propertyId = data[0]?.id; // Obtener el ID de la propiedad creada
        
        // Guardar imágenes en la tabla property_images para nueva propiedad
        if (uploadedPhotoUrls.length > 0 && propertyId) {
          const imageRecords = uploadedPhotoUrls.map(url => ({
            property_id: propertyId,
            image_url: url,
            storage_path: url
          }));
          
          const { error: imageError } = await supabase
            .from('property_images')
            .insert(imageRecords);
            
          if (imageError) {
            console.error('Error guardando imágenes:', imageError);
            throw new Error('Error guardando imágenes: ' + imageError.message);
          }
        }
        
        console.log('✅ Propiedad creada exitosamente:', data);
      }

      alert('🎉 ¡Propiedad ' + (isEditing ? 'actualizada' : 'publicada') + ' exitosamente!');
      navigate('/portfolio');
    } catch (error: any) {
      console.error('❌ Error saving property:', error);
      
      // Mensajes de error más amigables
      let errorMessage = 'Error desconocido';
      
      if (error.message.includes('size')) {
        errorMessage = 'Los archivos son demasiado grandes. Intenta con archivos más pequeños.';
      } else if (error.message.includes('connection') || error.message.includes('network')) {
        errorMessage = 'Error de conexión. Verifica tu internet y vuelve a intentar.';
      } else if (error.message.includes('auth') || error.message.includes('user')) {
        errorMessage = 'Error de autenticación. Inicia sesión nuevamente.';
      } else {
        errorMessage = error.message || 'Error guardando la propiedad';
      }
      
      alert('❌ ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Document configuration
  const requiredDocuments = [
    { key: 'tax_assessment', label: 'Certificado de Rol de Avalúo Fiscal' },
    { key: 'ownership_certificate', label: 'Certificado de Dominio Vigente' },
    { key: 'ownership_history', label: 'Certificado de Historial de Dominio (10 años)' },
  ];

  const optionalDocuments = [
    { key: 'marriage_certificate', label: 'Certificado de Matrimonio (si aplica)' },
    { key: 'power_of_attorney', label: 'Poderes (si aplica)' },
    { key: 'property_plans', label: 'Planos de la Propiedad' },
    { key: 'previous_contracts', label: 'Contratos de Compraventa Anteriores' },
    { key: 'previous_reports', label: 'Certificado de Informes Previos' },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isEditing ? 'Editar Propiedad' : `Publicar Propiedad en ${listingType.charAt(0).toUpperCase() + listingType.slice(1)}`}
          </h1>
          <p className="text-gray-600">
            {isEditing ? 'Actualiza la información de tu propiedad' : 'Completa todos los campos para publicar tu propiedad'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Sección: Información de la Propiedad */}
          <div className="space-y-6">
            <div className="border-b pb-2">
              <h2 className="text-xl font-bold text-gray-900">Información de la Propiedad</h2>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {/* Fila 1: Dirección completa */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Dirección Completa *
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.address ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Ej: Av. Libertador 1234, Depto 501, Las Condes, Santiago"
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.address}
                  </p>
                )}
              </div>

              {/* Fila 2: Calle y Número (se auto-completan desde la dirección) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Calle *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.street ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Ej: Av. Libertador"
                    onBlur={() => {
                      // Auto-completar desde la dirección si está vacío
                      if (!formData.street && formData.address) {
                        const parts = formData.address.split(' ');
                        if (parts.length >= 2) {
                          setFormData(prev => ({ 
                            ...prev, 
                            street: parts.slice(0, -1).join(' '),
                            number: parts[parts.length - 1]
                          }));
                        }
                      }
                    }}
                  />
                  {errors.street && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.street}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Número *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.number ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Ej: 1234"
                  />
                  {errors.number && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.number}
                    </p>
                  )}
                </div>
              </div>

              {/* Fila 3: Departamento/Oficina/Casa N° */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Departamento / Oficina / Casa N° (Opcional)
                </label>
                <input
                  type="text"
                  value={formData.apartment}
                  onChange={(e) => setFormData({ ...formData, apartment: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Ej: Depto 501, Casa 15, Oficina 302"
                />
              </div>

              {/* Fila 4: Región y Comuna */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Región *
                  </label>
                  <select
                    required
                    value={formData.region}
                    onChange={(e) => handleRegionChange(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.region ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Seleccionar región</option>
                    {Object.entries(CHILE_REGIONS_COMMUNES).map(([key, region]) => (
                      <option key={key} value={key}>{region.name}</option>
                    ))}
                  </select>
                  {errors.region && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.region}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Comuna *
                  </label>
                  <select
                    required
                    value={formData.comuna}
                    onChange={(e) => setFormData({ ...formData, comuna: e.target.value })}
                    disabled={!formData.region}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.comuna ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    } ${!formData.region ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  >
                    <option value="">
                      {formData.region ? 'Seleccionar comuna' : 'Primero selecciona una región'}
                    </option>
                    {formData.region && getAvailableCommunes(formData.region).map((commune) => (
                      <option key={commune} value={commune}>{commune}</option>
                    ))}
                  </select>
                  {errors.comuna && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.comuna}
                    </p>
                  )}
                </div>
              </div>

              {/* Fila 5: Precio y Gastos Comunes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Precio ({formData.type === 'venta' ? 'Venta' : 'Arriendo mensual'}) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-gray-500 font-medium">$</span>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        errors.price ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="1000000"
                    />
                  </div>
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.price}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Gastos Comunes (mensual)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-gray-500 font-medium">$</span>
                    <input
                      type="number"
                      min="0"
                      value={formData.common_expenses}
                      onChange={(e) => setFormData({ ...formData, common_expenses: e.target.value })}
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="50000"
                    />
                  </div>
                </div>
              </div>

              {/* Fila 6: Dormitorios, Baños y Superficie */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Dormitorios *
                  </label>
                  <select
                    required
                    value={formData.bedrooms}
                    onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    {[0, 1, 2, 3, 4, 5, 6].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Baños *
                  </label>
                  <select
                    required
                    value={formData.bathrooms}
                    onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Superficie (m²) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.surface_m2}
                    onChange={(e) => setFormData({ ...formData, surface_m2: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.surface_m2 ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="120"
                  />
                  {errors.surface_m2 && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.surface_m2}
                    </p>
                  )}
                </div>
              </div>

              {/* Fila 7: Descripción */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Descripción *
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.description ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Describe las características principales de la propiedad, ubicación, amenidades, etc."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.description}
                  </p>
                )}
              </div>
            </div>
          </div>


          {/* Sección: Fotos de la Propiedad */}
          <div className="space-y-6">
            <div className="border-b pb-2">
              <h2 className="text-xl font-bold text-gray-900">Fotos de la Propiedad</h2>
            </div>

            {/* Área de carga de fotos */}
            <div className="space-y-4">
              <div 
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all hover:border-blue-500 hover:bg-blue-50 ${
                  errors.photos ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                onDrop={(e) => {
                  e.preventDefault();
                  const files = e.dataTransfer.files;
                  if (files.length > 0) {
                    handlePhotoUpload(files);
                  }
                }}
                onDragOver={(e) => e.preventDefault()}
              >
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => e.target.files && handlePhotoUpload(e.target.files)}
                  className="hidden"
                  id="photo-upload"
                />
                <label htmlFor="photo-upload" className="cursor-pointer">
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                      <Image className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-700 mb-2">
                        Arrastra y suelta las fotos aquí
                      </p>
                      <p className="text-sm text-gray-500 mb-4">
                        o haz clic para seleccionar archivos
                      </p>
                      <div className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        <Upload className="h-4 w-4 mr-2" />
                        Seleccionar Fotos
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">
                      PNG, JPG, JPEG hasta 10MB cada una
                    </p>
                  </div>
                </label>
              </div>

              {errors.photos && (
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.photos}
                </p>
              )}

              {/* Vista previa de fotos */}
              {photoPreviews.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Vista Previa de Fotos</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {photoPreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={preview} 
                          alt={`Vista previa ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fotos existentes (para edición) */}
              {formData.photos_urls.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Fotos Actuales</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {formData.photos_urls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={url} 
                          alt={`Foto actual ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sección: Documentación Legal (Opcional) */}
          <div className="space-y-6">
            <div className="border-b pb-2">
              <h2 className="text-xl font-bold text-gray-900">Documentación Legal (Opcional)</h2>
              <p className="text-sm text-gray-600 mt-2">
                Los documentos son opcionales. Puedes agregarlos ahora o más tarde desde tu portafolio.
              </p>
            </div>

            {/* Documentos Principales */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Documentos Importantes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {requiredDocuments.map(({ key, label }) => (
                  <div key={key} className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                    <div className="mb-3">
                      <p className="font-medium text-gray-900 text-sm">{label}</p>
                      {formData.documents[key as keyof typeof formData.documents] && (
                        <p className="text-sm text-green-600 mt-1 flex items-center">
                          <Check className="h-4 w-4 mr-1" />
                          {(formData.documents[key as keyof typeof formData.documents] as File)?.name}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {formData.documents[key as keyof typeof formData.documents] ? (
                        <button
                          type="button"
                          onClick={() => removeDocument(key as keyof typeof formData.documents)}
                          className="px-3 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          Eliminar
                        </button>
                      ) : (
                        <label className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                          Subir Archivo
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleDocumentUpload(key as keyof typeof formData.documents, file);
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Documentos Adicionales */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Documentos Adicionales</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {optionalDocuments.map(({ key, label }) => (
                  <div key={key} className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                    <div className="mb-3">
                      <p className="font-medium text-gray-900 text-sm">{label}</p>
                      {formData.documents[key as keyof typeof formData.documents] && (
                        <p className="text-sm text-green-600 mt-1 flex items-center">
                          <Check className="h-4 w-4 mr-1" />
                          {(formData.documents[key as keyof typeof formData.documents] as File)?.name}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {formData.documents[key as keyof typeof formData.documents] ? (
                        <button
                          type="button"
                          onClick={() => removeDocument(key as keyof typeof formData.documents)}
                          className="px-3 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          Eliminar
                        </button>
                      ) : (
                        <label className="px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
                          Subir Archivo
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleDocumentUpload(key as keyof typeof formData.documents, file);
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Estado de carga */}
          {uploading && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-6 py-4 rounded-lg flex items-center">
              <Loader2 className="h-5 w-5 mr-3 animate-spin" />
              Subiendo archivos...
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-8 border-t">
            <button
              type="button"
              onClick={() => navigate('/portfolio')}
              className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || uploading}
              className="px-8 py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Procesando...</span>
                </>
              ) : (
                <span>{isEditing ? 'Actualizar Propiedad' : 'Publicar Propiedad'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};