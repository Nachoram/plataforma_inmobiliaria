import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, FileText, Image, Check, AlertCircle, Loader2, Building } from 'lucide-react';
import { supabase } from '../../lib/supabase';
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
  }
};

export const RentalPublicationForm: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Form data state
  const [formData, setFormData] = useState({
    // Información de la Propiedad
    address_street: '',
    address_number: '',
    address_department: '',
    region: '',
    commune: '',
    price: '',
    common_expenses: '',
    bedrooms: '1',
    bathrooms: '1',
    estacionamientos: '0',
    metrosUtiles: '',
    metrosTotales: '',
    tieneTerraza: 'No',
    anoConstruccion: '',
    description: '',

    // Características Internas
    sistemaAguaCaliente: 'Calefón',
    tipoCocina: 'Cerrada',
    tieneSalaEstar: 'No',
    tieneBodega: 'No',
    metrosBodega: '',

    // Amenidades
    amenidades: {
      conserje: false,
      condominio: false,
      piscina: false,
      salonEventos: false,
      gimnasio: false,
      cowork: false,
      quincho: false,
      salaCine: false,
      areasVerdes: false,
    },

    // Datos del Propietario
    owner_first_name: '',
    owner_paternal_last_name: '',
    owner_maternal_last_name: '',
    owner_rut: '',
    owner_address_street: '',
    owner_address_number: '',
    owner_region: '',
    owner_commune: '',
    marital_status: '',
    asesorAsignado: 'Sin Asignar',
    property_regime: '',

    // Archivos
    photos_urls: [] as string[],
    availableDays: [] as string[],
    availableTimeSlots: [] as string[],
    documents: {
      // Documentos Requeridos
      ownership_certificate: null as File | null,
      tax_assessment: null as File | null,
      owner_id_copy: null as File | null,
      // Documentos Opcionales
      power_of_attorney: null as File | null,
      commercial_evaluation: null as File | null,
    }
  });

  // Photo preview state
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  // Obtener comunas disponibles según la región seleccionada
  const getAvailableCommunes = (regionKey: string) => {
    return CHILE_REGIONS_COMMUNES[regionKey as keyof typeof CHILE_REGIONS_COMMUNES]?.communes || [];
  };

  // Manejar cambio de región (resetear comuna)
  const handleRegionChange = (regionKey: string, isOwner: boolean = false) => {
    if (isOwner) {
      setFormData(prev => ({
        ...prev,
        owner_region: regionKey,
        owner_commune: '' // Resetear comuna cuando cambia la región
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        region: regionKey,
        commune: '' // Resetear comuna cuando cambia la región
      }));
    }
  };

  // Handle photo upload and preview
  const handlePhotoUpload = (files: FileList) => {
    const newFiles = Array.from(files);
    const newPreviews: string[] = [];

    newFiles.forEach(file => {
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
    if (!formData.address_street.trim()) newErrors.address_street = 'La calle es requerida';
    if (!formData.address_number.trim()) newErrors.address_number = 'El número es requerido';
    if (!formData.region) newErrors.region = 'La región es requerida';
    if (!formData.commune) newErrors.commune = 'La comuna es requerida';
    if (!formData.price.trim()) newErrors.price = 'El precio de arriendo es requerido';
    if (!formData.metrosUtiles.trim()) newErrors.metrosUtiles = 'Los metros útiles son requeridos';
    if (!formData.metrosTotales.trim()) newErrors.metrosTotales = 'Los metros totales son requeridos';
    if (!formData.description.trim()) newErrors.description = 'La descripción es requerida';
    if (!formData.owner_first_name.trim()) newErrors.owner_first_name = 'El nombre del propietario es requerido';
    if (!formData.owner_paternal_last_name.trim()) newErrors.owner_paternal_last_name = 'El apellido paterno del propietario es requerido';
    if (!formData.owner_maternal_last_name.trim()) newErrors.owner_maternal_last_name = 'El apellido materno del propietario es requerido';
    if (!formData.owner_rut.trim()) newErrors.owner_rut = 'El RUT del propietario es requerido';
    if (!formData.owner_address_street.trim()) newErrors.owner_address_street = 'La calle del propietario es requerida';
    if (!formData.owner_address_number.trim()) newErrors.owner_address_number = 'El número del propietario es requerido';
    if (!formData.owner_region) newErrors.owner_region = 'La región del propietario es requerida';
    if (!formData.owner_commune) newErrors.owner_commune = 'La comuna del propietario es requerida';
    if (!formData.marital_status) newErrors.marital_status = 'El estado civil es requerido';

    // Validate property_regime if married
    if (formData.marital_status === 'casado' && !formData.property_regime) {
      newErrors.property_regime = 'El régimen patrimonial es requerido para personas casadas';
    }

    // Photos and documents are now OPTIONAL - no validation required
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Upload files to Supabase Storage with fallback buckets
  const uploadFiles = async (propertyId: string) => {
    console.log('🚀 Iniciando upload de archivos...');
    
    // Upload photos with fallback buckets
    for (const file of photoFiles) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${Date.now()}-${Math.random()}.${fileExt}`;

      // Try primary bucket first, then fallback
      let uploadResult = null;
      let bucketUsed = '';
      
      try {
        // Try property-images bucket first
        uploadResult = await supabase.storage
          .from('property-images')
          .upload(fileName, file);
        
        if (uploadResult.error) {
          console.warn('⚠️ Error con bucket property-images, intentando con images:', uploadResult.error);
          // Fallback to images bucket
          uploadResult = await supabase.storage
            .from('images')
            .upload(fileName, file);
          bucketUsed = 'images';
        } else {
          bucketUsed = 'property-images';
        }
        
        if (uploadResult.error) {
          console.error('❌ Error subiendo imagen:', uploadResult.error);
          throw new Error(`Error subiendo imagen: ${uploadResult.error.message}`);
        }

        console.log(`✅ Imagen subida exitosamente al bucket: ${bucketUsed}`);

        const { data: { publicUrl } } = supabase.storage
          .from(bucketUsed)
          .getPublicUrl(uploadResult.data.path);

        // Insert record in property_images table
        const { error: dbError } = await supabase
          .from('property_images')
          .insert({
            property_id: propertyId,
            image_url: publicUrl,
            storage_path: uploadResult.data.path,
            created_at: new Date().toISOString()
          });

        if (dbError) {
          console.error('❌ Error insertando registro de imagen:', JSON.stringify(dbError, null, 2));
          console.error('❌ Detalles del error:', {
            message: dbError.message,
            details: dbError.details,
            hint: dbError.hint,
            code: dbError.code
          });
          throw new Error(`Error guardando imagen en BD: ${dbError.message}`);
        }

        console.log('✅ Registro de imagen creado en BD');
      } catch (error) {
        console.error('❌ Error completo en upload de imagen:', error);
        throw error;
      }
    }

    // Upload documents with fallback buckets
    for (const [key, file] of Object.entries(formData.documents)) {
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user?.id}/${key}-${Date.now()}.${fileExt}`;

        // Try primary bucket first, then fallback
        let uploadResult = null;
        let bucketUsed = '';
        
        try {
          // Try user-documents bucket first
          uploadResult = await supabase.storage
            .from('user-documents')
            .upload(fileName, file);
          
          if (uploadResult.error) {
            console.warn('⚠️ Error con bucket user-documents, intentando con files:', uploadResult.error);
            // Fallback to files bucket
            uploadResult = await supabase.storage
              .from('files')
              .upload(fileName, file);
            bucketUsed = 'files';
          } else {
            bucketUsed = 'user-documents';
          }
          
          if (uploadResult.error) {
            console.error('❌ Error subiendo documento:', uploadResult.error);
            throw new Error(`Error subiendo documento ${key}: ${uploadResult.error.message}`);
          }

          console.log(`✅ Documento ${key} subido exitosamente al bucket: ${bucketUsed}`);

          // Insert record in documents table
          const { error: dbError } = await supabase
            .from('documents')
            .insert({
              uploader_id: user?.id,
              related_entity_id: propertyId,
              related_entity_type: 'property_legal',
              document_type: key,
              storage_path: uploadResult.data.path,
              file_name: file.name,
              created_at: new Date().toISOString()
            });

          if (dbError) {
            console.error('❌ Error insertando registro de documento:', JSON.stringify(dbError, null, 2));
            console.error('❌ Detalles del error documento:', {
              message: dbError.message,
              details: dbError.details,
              hint: dbError.hint,
              code: dbError.code
            });
            throw new Error(`Error guardando documento en BD: ${dbError.message}`);
          }

          console.log(`✅ Registro de documento ${key} creado en BD`);
        } catch (error) {
          console.error(`❌ Error completo en upload de documento ${key}:`, error);
          throw error;
        }
      }
    }
    
    console.log('🎉 Upload de archivos completado exitosamente');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Validate user is authenticated
    if (!user?.id) {
      setErrors({ submit: 'Debes estar autenticado para publicar una propiedad.' });
      return;
    }

    setLoading(true);

    try {
      // Note: Owner profile data is stored in rental_owners table, not in the user's profile
      // The property owner_id points to the advisor who created the property

      // Parse numeric values with validation
      const price = parseFloat(formData.price);
      const metrosUtiles = parseInt(formData.metrosUtiles);
      const metrosTotales = parseInt(formData.metrosTotales);
      const metrosBodega = formData.metrosBodega ? parseInt(formData.metrosBodega) : null;
      const anoConstruccion = formData.anoConstruccion ? parseInt(formData.anoConstruccion) : null;
      const commonExpenses = formData.common_expenses ? parseFloat(formData.common_expenses) : 0;
      const bedrooms = parseInt(formData.bedrooms);
      const bathrooms = parseInt(formData.bathrooms);
      const parkingSpaces = formData.estacionamientos === '5+' ? 5 : parseInt(formData.estacionamientos);

      if (isNaN(price) || isNaN(metrosUtiles) || isNaN(metrosTotales) || isNaN(bedrooms) || isNaN(bathrooms) || isNaN(parkingSpaces)) {
        throw new Error('Valores numéricos inválidos');
      }

      // TODO: Implement proper owner assignment logic
      // Currently assigning to the advisor (user.id), but should assign to actual property owner
      // This requires either finding existing user by RUT or creating new user account for owner
      const propertyData = {
        owner_id: user.id, // FIXME: This should be the actual owner's user ID, not the advisor's
        listing_type: 'arriendo' as const,
        status: 'disponible' as const,
        address_street: formData.address_street,
        address_number: formData.address_number,
        address_department: formData.address_department || null,
        address_commune: formData.commune,
        address_region: formData.region,
        price_clp: price,
        common_expenses_clp: commonExpenses,
        bedrooms: bedrooms,
        bathrooms: bathrooms,
        estacionamientos: parkingSpaces,
        surface_m2: metrosTotales, // Use existing column temporarily
        description: formData.description,
        created_at: new Date().toISOString(),
        // Note: New columns will be added once migration is applied:
        metros_utiles: metrosUtiles,
        metros_totales: metrosTotales,
        tiene_terraza: formData.tieneTerraza === 'Sí',
        ano_construccion: anoConstruccion,
        sistema_agua_caliente: formData.sistemaAguaCaliente,
        tipo_cocina: formData.tipoCocina,
        tiene_sala_estar: formData.tieneSalaEstar === 'Sí',
        tiene_bodega: formData.tieneBodega === 'Sí',
        metros_bodega: metrosBodega,
        // has_doorman: formData.amenidades.conserje,
        // has_condominium: formData.amenidades.condominio,
        // has_pool: formData.amenidades.piscina,
        // has_event_room: formData.amenidades.salonEventos,
        // has_gym: formData.amenidades.gimnasio,
        // has_cowork: formData.amenidades.cowork,
        // has_bbq_area: formData.amenidades.quincho,
        // has_cinema: formData.amenidades.salaCine,
        // has_green_areas: formData.amenidades.areasVerdes,
      };

      // Insert property first
      const { data: propertyResult, error } = await supabase
        .from('properties')
        .insert(propertyData)
        .select()
        .single();

      if (error) throw error;

      // Upload files only if they exist (optional) - now with real property ID
      if (photoFiles.length > 0 || Object.values(formData.documents).some(doc => doc !== null)) {
        setUploading(true);
        try {
          await uploadFiles(propertyResult.id);
        } catch (error) {
          console.warn('File upload failed, continuing without files:', error);
          // Continue without files - they are optional
        } finally {
          setUploading(false);
        }
      }

      // Insert rental owner information with specific ID capture
      if (propertyResult?.id) {
        const { data: ownerResult, error: ownerError } = await supabase
          .from('rental_owners')
          .insert({
            property_id: propertyResult.id,
            first_name: formData.owner_first_name,
            paternal_last_name: formData.owner_paternal_last_name,
            maternal_last_name: formData.owner_maternal_last_name,
            rut: formData.owner_rut,
            address_street: formData.owner_address_street,
            address_number: formData.owner_address_number,
            address_department: null,
            address_commune: formData.owner_commune,
            address_region: formData.owner_region,
            marital_status: formData.marital_status,
            property_regime: formData.marital_status === 'casado' ? formData.property_regime : null,
            phone: null,
            email: user.email || null,
          })
          .select()
          .single();

        if (ownerError) {
          console.warn('Warning inserting rental owner:', ownerError);
          // Continue anyway - owner creation is not critical for property creation
        } else {
          console.log('✅ Rental owner creado con ID específico:', ownerResult.id);
          console.log('📋 Datos del propietario:', {
            id: ownerResult.id,
            property_id: ownerResult.property_id,
            name: `${ownerResult.first_name} ${ownerResult.paternal_last_name}`,
            rut: ownerResult.rut
          });
        }
      }


      alert('Propiedad publicada exitosamente!');
      navigate('/portfolio');
    } catch (error: any) {
      console.error('❌ Error saving rental property:', JSON.stringify(error, null, 2));
      console.error('❌ Error details:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        stack: error?.stack
      });
      setErrors({ submit: `Error al publicar la propiedad: ${error?.message || 'Error desconocido'}` });
    } finally {
      setLoading(false);
    }
  };

  // Document configuration
  const requiredDocuments = [
    { key: 'ownership_certificate', label: 'Certificado de Dominio Vigente' },
    { key: 'tax_assessment', label: 'Certificado de Avalúo Fiscal' },
    { key: 'owner_id_copy', label: 'Fotocopia de Cédula de Identidad del Propietario' },
  ];

  const optionalDocuments = [
    { key: 'power_of_attorney', label: 'Poder (si aplica)' },
    { key: 'commercial_evaluation', label: 'Evaluación Comercial de la Propiedad' },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-emerald-50 to-green-50">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Publicar Propiedad en Arriendo
          </h1>
          <p className="text-gray-600">
            Completa todos los campos para publicar tu propiedad en arriendo
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Sección 1: Información de la Propiedad */}
          <div className="space-y-6">
            <div className="border-b pb-2">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Building className="h-6 w-6 mr-2 text-emerald-600" />
                Información de la Propiedad
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {/* Calle */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Calle *
                </label>
                <input
                  type="text"
                  required
                  value={formData.address_street}
                  onChange={(e) => setFormData({ ...formData, address_street: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                    errors.address_street ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Ej: Av. Libertador"
                />
                {errors.address_street && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.address_street}
                  </p>
                )}
              </div>

              {/* Número */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Número *
                </label>
                <input
                  type="text"
                  required
                  value={formData.address_number}
                  onChange={(e) => setFormData({ ...formData, address_number: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                    errors.address_number ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Ej: 1234"
                />
                {errors.address_number && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.address_number}
                  </p>
                )}
              </div>

              {/* Departamento (Opcional) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Departamento / Oficina (Opcional)
                </label>
                <input
                  type="text"
                  value={formData.address_department}
                  onChange={(e) => setFormData({ ...formData, address_department: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="Ej: 45A"
                />
              </div>

              {/* Región y Comuna */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Región *
                  </label>
                  <select
                    required
                    value={formData.region}
                    onChange={(e) => handleRegionChange(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
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
                    value={formData.commune}
                    onChange={(e) => setFormData({ ...formData, commune: e.target.value })}
                    disabled={!formData.region}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                      errors.commune ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    } ${!formData.region ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  >
                    <option value="">
                      {formData.region ? 'Seleccionar comuna' : 'Primero selecciona una región'}
                    </option>
                    {formData.region && getAvailableCommunes(formData.region).map((commune) => (
                      <option key={commune} value={commune}>{commune}</option>
                    ))}
                  </select>
                  {errors.commune && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.commune}
                    </p>
                  )}
                </div>
              </div>

              {/* Precio */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Precio Arriendo (mensual) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-gray-500 font-medium">$</span>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                      errors.price ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="500000"
                  />
                </div>
                {errors.price && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.price}
                  </p>
                )}
              </div>

              {/* Gastos Comunes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Gastos Comunes (opcional)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-gray-500 font-medium">$</span>
                  <input
                    type="number"
                    min="0"
                    value={formData.common_expenses}
                    onChange={(e) => setFormData({ ...formData, common_expenses: e.target.value })}
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder="50000"
                  />
                </div>
              </div>

              {/* Dormitorios y Baños */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Dormitorios
                  </label>
                  <select
                    value={formData.bedrooms}
                    onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5+">5+</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Baños
                  </label>
                  <select
                    value={formData.bathrooms}
                    onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5+">5+</option>
                  </select>
                </div>
              </div>

              {/* Estacionamientos */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Estacionamientos
                </label>
                <select
                  value={formData.estacionamientos}
                  onChange={(e) => setFormData({ ...formData, estacionamientos: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                >
                  <option value="0">0</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5+">5+</option>
                </select>
              </div>

              {/* Metros Cuadrados Útiles y Totales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    M² Útiles *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                    value={formData.metrosUtiles}
                    onChange={(e) => setFormData({ ...formData, metrosUtiles: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                      errors.metrosUtiles ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                    placeholder="Ej: 85"
                />
                  {errors.metrosUtiles && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.metrosUtiles}
                  </p>
                )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    M² Totales *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.metrosTotales}
                    onChange={(e) => setFormData({ ...formData, metrosTotales: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                      errors.metrosTotales ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Ej: 95"
                  />
                  {errors.metrosTotales && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.metrosTotales}
                    </p>
                  )}
                </div>
              </div>

              {/* Terraza */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ¿Tiene Terraza?
                </label>
                <select
                  value={formData.tieneTerraza}
                  onChange={(e) => setFormData({ ...formData, tieneTerraza: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                >
                  <option value="No">No</option>
                  <option value="Sí">Sí</option>
                </select>
              </div>

              {/* Año de Construcción */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Año de Construcción
                </label>
                <input
                  type="number"
                  min="1800"
                  max={new Date().getFullYear()}
                  value={formData.anoConstruccion}
                  onChange={(e) => setFormData({ ...formData, anoConstruccion: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="Ej: 2020"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Descripción *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
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

          {/* Sección 2: Características Internas */}
          <div className="space-y-6">
            <div className="border-b pb-2">
              <h2 className="text-xl font-bold text-gray-900">Características Internas</h2>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {/* Sistema de Agua Caliente */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Agua Caliente
                </label>
                <select
                  value={formData.sistemaAguaCaliente}
                  onChange={(e) => setFormData({ ...formData, sistemaAguaCaliente: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                >
                  <option value="Calefón">Calefón</option>
                  <option value="Termo Eléctrico">Termo Eléctrico</option>
                  <option value="Caldera Central">Caldera Central</option>
                </select>
              </div>

              {/* Tipo de Cocina */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tipo de Cocina
                </label>
                <select
                  value={formData.tipoCocina}
                  onChange={(e) => setFormData({ ...formData, tipoCocina: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                >
                  <option value="Cerrada">Cerrada</option>
                  <option value="Americana">Americana</option>
                  <option value="Integrada">Integrada</option>
                </select>
              </div>

              {/* Sala de Estar */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ¿Cuenta con Sala de Estar?
                </label>
                <select
                  value={formData.tieneSalaEstar}
                  onChange={(e) => setFormData({ ...formData, tieneSalaEstar: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                >
                  <option value="No">No</option>
                  <option value="Sí">Sí</option>
                </select>
              </div>

              {/* Bodega */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ¿Tiene Bodega?
                  </label>
                  <select
                    value={formData.tieneBodega}
                    onChange={(e) => setFormData({ ...formData, tieneBodega: e.target.value, metrosBodega: e.target.value === 'No' ? '' : formData.metrosBodega })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  >
                    <option value="No">No</option>
                    <option value="Sí">Sí</option>
                  </select>
                </div>

                {formData.tieneBodega === 'Sí' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      M² Bodega
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.metrosBodega}
                      onChange={(e) => setFormData({ ...formData, metrosBodega: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      placeholder="Ej: 5"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sección 3: Amenidades y Equipamiento */}
          <div className="space-y-6">
            <div className="border-b pb-2">
              <h2 className="text-xl font-bold text-gray-900">Amenidades y Equipamiento</h2>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {/* Checkboxes en grilla 3x4 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Conserje */}
                <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    id="conserje"
                    checked={formData.amenidades.conserje}
                    onChange={(e) => setFormData({
                      ...formData,
                      amenidades: { ...formData.amenidades, conserje: e.target.checked }
                    })}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <label htmlFor="conserje" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Conserje
                  </label>
                </div>

                {/* Condominio */}
                <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    id="condominio"
                    checked={formData.amenidades.condominio}
                    onChange={(e) => setFormData({
                      ...formData,
                      amenidades: { ...formData.amenidades, condominio: e.target.checked }
                    })}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <label htmlFor="condominio" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Condominio
                  </label>
                </div>

                {/* Piscina */}
                <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    id="piscina"
                    checked={formData.amenidades.piscina}
                    onChange={(e) => setFormData({
                      ...formData,
                      amenidades: { ...formData.amenidades, piscina: e.target.checked }
                    })}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <label htmlFor="piscina" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Piscina
                  </label>
                </div>

                {/* Salón de Eventos */}
                <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    id="salonEventos"
                    checked={formData.amenidades.salonEventos}
                    onChange={(e) => setFormData({
                      ...formData,
                      amenidades: { ...formData.amenidades, salonEventos: e.target.checked }
                    })}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <label htmlFor="salonEventos" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Salón de Eventos
                  </label>
                </div>

                {/* Gimnasio */}
                <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    id="gimnasio"
                    checked={formData.amenidades.gimnasio}
                    onChange={(e) => setFormData({
                      ...formData,
                      amenidades: { ...formData.amenidades, gimnasio: e.target.checked }
                    })}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <label htmlFor="gimnasio" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Gimnasio
                  </label>
                </div>

                {/* Cowork */}
                <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    id="cowork"
                    checked={formData.amenidades.cowork}
                    onChange={(e) => setFormData({
                      ...formData,
                      amenidades: { ...formData.amenidades, cowork: e.target.checked }
                    })}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <label htmlFor="cowork" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Cowork
                  </label>
                </div>

                {/* Quincho */}
                <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    id="quincho"
                    checked={formData.amenidades.quincho}
                    onChange={(e) => setFormData({
                      ...formData,
                      amenidades: { ...formData.amenidades, quincho: e.target.checked }
                    })}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <label htmlFor="quincho" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Quincho
                  </label>
                </div>

                {/* Sala de Cine */}
                <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    id="salaCine"
                    checked={formData.amenidades.salaCine}
                    onChange={(e) => setFormData({
                      ...formData,
                      amenidades: { ...formData.amenidades, salaCine: e.target.checked }
                    })}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <label htmlFor="salaCine" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Sala de Cine
                  </label>
                </div>

                {/* Áreas Verdes */}
                <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    id="areasVerdes"
                    checked={formData.amenidades.areasVerdes}
                    onChange={(e) => setFormData({
                      ...formData,
                      amenidades: { ...formData.amenidades, areasVerdes: e.target.checked }
                    })}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <label htmlFor="areasVerdes" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Áreas Verdes
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Sección 4: Datos del Propietario */}
          <div className="space-y-6">
            <div className="border-b pb-2">
              <h2 className="text-xl font-bold text-gray-900">Datos del Propietario</h2>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {/* Nombres del Propietario */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombres del Propietario *
                </label>
                <input
                  type="text"
                  required
                  value={formData.owner_first_name}
                  onChange={(e) => setFormData({ ...formData, owner_first_name: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                    errors.owner_first_name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Ej: Juan Carlos"
                />
                {errors.owner_first_name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.owner_first_name}
                  </p>
                )}
              </div>

              {/* Apellido Paterno */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Apellido Paterno *
                </label>
                <input
                  type="text"
                  required
                  value={formData.owner_paternal_last_name}
                  onChange={(e) => setFormData({ ...formData, owner_paternal_last_name: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                    errors.owner_paternal_last_name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Ej: Pérez"
                />
                {errors.owner_paternal_last_name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.owner_paternal_last_name}
                  </p>
                )}
              </div>

              {/* Apellido Materno */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Apellido Materno *
                </label>
                <input
                  type="text"
                  required
                  value={formData.owner_maternal_last_name}
                  onChange={(e) => setFormData({ ...formData, owner_maternal_last_name: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                    errors.owner_maternal_last_name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Ej: González"
                />
                {errors.owner_maternal_last_name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.owner_maternal_last_name}
                  </p>
                )}
              </div>

              {/* RUT del Propietario */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  RUT del Propietario *
                </label>
                <input
                  type="text"
                  required
                  value={formData.owner_rut}
                  onChange={(e) => setFormData({ ...formData, owner_rut: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                    errors.owner_rut ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Ej: 12.345.678-9"
                />
                {errors.owner_rut && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.owner_rut}
                  </p>
                )}
              </div>

              {/* Calle del Propietario */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Calle del Propietario *
                </label>
                <input
                  type="text"
                  required
                  value={formData.owner_address_street}
                  onChange={(e) => setFormData({ ...formData, owner_address_street: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                    errors.owner_address_street ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Ej: Av. Providencia"
                />
                {errors.owner_address_street && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.owner_address_street}
                  </p>
                )}
              </div>

              {/* Número del Propietario */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Número del Propietario *
                </label>
                <input
                  type="text"
                  required
                  value={formData.owner_address_number}
                  onChange={(e) => setFormData({ ...formData, owner_address_number: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                    errors.owner_address_number ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Ej: 2500"
                />
                {errors.owner_address_number && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.owner_address_number}
                  </p>
                )}
              </div>


              {/* Región y Comuna del Propietario */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Región del Propietario *
                  </label>
                  <select
                    required
                    value={formData.owner_region}
                    onChange={(e) => handleRegionChange(e.target.value, true)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                      errors.owner_region ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Seleccionar región</option>
                    {Object.entries(CHILE_REGIONS_COMMUNES).map(([key, region]) => (
                      <option key={key} value={key}>{region.name}</option>
                    ))}
                  </select>
                  {errors.owner_region && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.owner_region}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Comuna del Propietario *
                  </label>
                  <select
                    required
                    value={formData.owner_commune}
                    onChange={(e) => setFormData({ ...formData, owner_commune: e.target.value })}
                    disabled={!formData.owner_region}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                      errors.owner_commune ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    } ${!formData.owner_region ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  >
                    <option value="">
                      {formData.owner_region ? 'Seleccionar comuna' : 'Primero selecciona una región'}
                    </option>
                    {formData.owner_region && getAvailableCommunes(formData.owner_region).map((commune) => (
                      <option key={commune} value={commune}>{commune}</option>
                    ))}
                  </select>
                  {errors.owner_commune && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.owner_commune}
                    </p>
                  )}
                </div>
              </div>

              {/* Estado Civil */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Estado Civil *
                </label>
                <select
                  required
                  value={formData.marital_status}
                  onChange={(e) => setFormData({ ...formData, marital_status: e.target.value, property_regime: '' })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                    errors.marital_status ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                >
                  <option value="">Seleccionar estado civil</option>
                  <option value="soltero">Soltero(a)</option>
                  <option value="casado">Casado(a)</option>
                  <option value="divorciado">Divorciado(a)</option>
                  <option value="viudo">Viudo(a)</option>
                </select>
                {errors.marital_status && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.marital_status}
                  </p>
                )}
              </div>

              {/* Asesor Asignado */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Asesor Asignado
                </label>
                <select
                  value={formData.asesorAsignado}
                  onChange={(e) => setFormData({ ...formData, asesorAsignado: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                >
                  <option value="Sin Asignar">Sin Asignar</option>
                  <option value="Asesor 1">Asesor 1</option>
                  <option value="Asesor 2">Asesor 2</option>
                  <option value="Asesor 3">Asesor 3</option>
                  <option value="Asesor 4">Asesor 4</option>
                </select>
              </div>

              {/* Régimen Patrimonial (condicional) */}
              {formData.marital_status === 'casado' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Régimen Patrimonial *
                  </label>
                  <select
                    required
                    value={formData.property_regime}
                    onChange={(e) => setFormData({ ...formData, property_regime: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                      errors.property_regime ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Seleccionar régimen</option>
                    <option value="sociedad_conyugal">Sociedad conyugal</option>
                    <option value="separacion_bienes">Separación total de bienes</option>
                    <option value="participacion_gananciales">Participación en los gananciales</option>
                  </select>
                  {errors.property_regime && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.property_regime}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sección 3: Fotos de la Propiedad */}
          <div className="space-y-6">
            <div className="border-b pb-2">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Image className="h-6 w-6 mr-2 text-emerald-600" />
                Fotos de la Propiedad (Opcional)
              </h2>
            </div>

            <div className="space-y-4">
              {/* Upload de fotos */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Subir Fotos
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-emerald-400 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => e.target.files && handlePhotoUpload(e.target.files)}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label htmlFor="photo-upload" className="cursor-pointer">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                      Haz clic para subir fotos o arrastra y suelta
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG hasta 10MB</p>
                  </label>
                </div>
              </div>

              {/* Preview de fotos */}
              {photoPreviews.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fotos Seleccionadas
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {photoPreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sección 4: Documentos */}
          <div className="space-y-6">
            <div className="border-b pb-2">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <FileText className="h-6 w-6 mr-2 text-emerald-600" />
                Documentos (Opcional)
              </h2>
            </div>

            <div className="space-y-6">
              {/* Documentos Requeridos */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Documentos Requeridos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {requiredDocuments.map((doc) => (
                    <div key={doc.key} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {doc.label}
                      </label>
                      {formData.documents[doc.key as keyof typeof formData.documents] ? (
                        <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <Check className="h-5 w-5 text-green-600" />
                          <span className="text-sm text-green-800">
                            {formData.documents[doc.key as keyof typeof formData.documents]?.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeDocument(doc.key as keyof typeof formData.documents)}
                            className="ml-auto text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-emerald-400 transition-colors">
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => e.target.files?.[0] && handleDocumentUpload(doc.key as keyof typeof formData.documents, e.target.files[0])}
                            className="hidden"
                            id={`doc-${doc.key}`}
                          />
                          <label htmlFor={`doc-${doc.key}`} className="cursor-pointer">
                            <Upload className="mx-auto h-8 w-8 text-gray-400" />
                            <p className="mt-1 text-xs text-gray-600">Subir documento</p>
                          </label>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Documentos Opcionales */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Documentos Opcionales</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {optionalDocuments.map((doc) => (
                    <div key={doc.key} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {doc.label}
                      </label>
                      {formData.documents[doc.key as keyof typeof formData.documents] ? (
                        <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <Check className="h-5 w-5 text-blue-600" />
                          <span className="text-sm text-blue-800">
                            {formData.documents[doc.key as keyof typeof formData.documents]?.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeDocument(doc.key as keyof typeof formData.documents)}
                            className="ml-auto text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-emerald-400 transition-colors">
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => e.target.files?.[0] && handleDocumentUpload(doc.key as keyof typeof formData.documents, e.target.files[0])}
                            className="hidden"
                            id={`doc-${doc.key}`}
                          />
                          <label htmlFor={`doc-${doc.key}`} className="cursor-pointer">
                            <Upload className="mx-auto h-8 w-8 text-gray-400" />
                            <p className="mt-1 text-xs text-gray-600">Subir documento</p>
                          </label>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Estado de carga */}
          {uploading && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-6 py-4 rounded-lg flex items-center">
              <Loader2 className="h-5 w-5 mr-3 animate-spin" />
              Subiendo archivos...
            </div>
          )}

          {/* Error de envío */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg flex items-center">
              <AlertCircle className="h-5 w-5 mr-3" />
              {errors.submit}
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
              className="px-8 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Publicando...</span>
                </>
              ) : (
                <span>Publicar Propiedad en Arriendo</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
