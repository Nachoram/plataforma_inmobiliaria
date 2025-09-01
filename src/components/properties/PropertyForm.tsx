import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Upload, X, FileText, Image, Check, AlertCircle, Loader2, Calendar } from 'lucide-react';
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
    listing_type: listingType,
    address: '',
    apartment_number: '',
    region: '',
    commune: '',
    country: 'Chile',
    price: '',
    common_expenses: '',
    bedrooms: '1',
    bathrooms: '1',
    area_sqm: '',
    description: '',
    owner_full_name: '',
    owner_address: '',
    owner_apartment_number: '',
    owner_region: '',
    owner_commune: '',
    marital_status: '',
    property_regime: '',
    photos_urls: [] as string[],
    availableDays: [] as string[],
    availableTimeSlots: [] as string[],
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
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      setFormData(prev => ({
        ...prev,
        listing_type: data.listing_type,
        address: data.address,
        apartment_number: data.apartment_number || '',
        region: data.region || '',
        commune: data.commune || '',
        country: data.country,
        description: data.description || '',
        price: data.price.toString(),
        bedrooms: data.bedrooms.toString(),
        bathrooms: data.bathrooms.toString(),
        area_sqm: data.area_sqm?.toString() || '',
        photos_urls: data.photos_urls || [],
      }));
    } catch (error) {
      console.error('Error fetching property:', error);
    }
  };

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
    if (!formData.address.trim()) newErrors.address = 'La dirección es requerida';
    if (!formData.region) newErrors.region = 'La región es requerida';
    if (!formData.commune) newErrors.commune = 'La comuna es requerida';
    if (!formData.price.trim()) newErrors.price = 'El precio es requerido';
    if (!formData.owner_full_name.trim()) newErrors.owner_full_name = 'El nombre del propietario es requerido';
    if (!formData.owner_address.trim()) newErrors.owner_address = 'La dirección del propietario es requerida';
    if (!formData.owner_region) newErrors.owner_region = 'La región del propietario es requerida';
    if (!formData.owner_commune) newErrors.owner_commune = 'La comuna del propietario es requerida';
    if (!formData.marital_status) newErrors.marital_status = 'El estado civil es requerido';

    // Required documents validation (only for new properties)
    if (!isEditing) {
      if (!formData.documents.tax_assessment) newErrors.tax_assessment = 'Documento requerido';
      if (!formData.documents.ownership_certificate) newErrors.ownership_certificate = 'Documento requerido';
      if (!formData.documents.ownership_history) newErrors.ownership_history = 'Documento requerido';
    }

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

    // Upload photos
    for (const file of photoFiles) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${Date.now()}-${Math.random()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('property-photos')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('property-photos')
        .getPublicUrl(data.path);

      uploadedPhotoUrls.push(publicUrl);
    }

    // Upload documents
    for (const [key, file] of Object.entries(formData.documents)) {
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user?.id}/${key}-${Date.now()}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('property-documents')
          .upload(fileName, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('property-documents')
          .getPublicUrl(data.path);

        uploadedDocumentUrls.push(publicUrl);
      }
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
      // First, ensure the user's profile exists in the profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          full_name: formData.owner_full_name,
          contact_email: user?.email || '',
          contact_phone: null,
        }, {
          onConflict: 'id'
        });

      if (profileError) {
        console.error('Error upserting profile:', profileError);
        throw profileError;
      }

      let photoUrls = formData.photos_urls;
      let documentUrls: string[] = [];

      // Upload new files if any
      if (photoFiles.length > 0 || Object.values(formData.documents).some(doc => doc !== null)) {
        const { uploadedPhotoUrls, uploadedDocumentUrls } = await uploadFiles();
        photoUrls = [...photoUrls, ...uploadedPhotoUrls];
        documentUrls = uploadedDocumentUrls;
      }

      const propertyData = {
        owner_id: user?.id,
        listing_type: formData.listing_type,
        address: formData.address,
        apartment_number: formData.apartment_number || null,
        region: formData.region,
        commune: formData.commune,
        country: formData.country,
        description: formData.description,
        price: parseFloat(formData.price),
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseInt(formData.bathrooms),
        area_sqm: formData.area_sqm ? parseInt(formData.area_sqm) : null,
        photos_urls: photoUrls,
        documents_urls: documentUrls,
        owner_full_name: formData.owner_full_name,
        owner_address: formData.owner_address,
        owner_apartment_number: formData.owner_apartment_number || null,
        owner_region: formData.owner_region,
        owner_commune: formData.owner_commune,
        marital_status: formData.marital_status,
        property_regime: formData.property_regime || null,
        available_days: formData.availableDays,
        available_time_slots: formData.availableTimeSlots,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('properties')
          .update(propertyData)
          .eq('id', id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('properties')
          .insert(propertyData);
        
        if (error) throw error;
      }

      navigate('/portfolio');
    } catch (error) {
      console.error('Error saving property:', error);
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
              {/* Fila 1: Dirección */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Dirección *
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.address ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Ej: Av. Libertador 1234, Depto 501"
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.address}
                  </p>
                )}
              </div>

              {/* Fila 2: Departamento/Oficina/Casa N° */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Departamento / Oficina / Casa N° (Opcional)
                </label>
                <input
                  type="text"
                  value={formData.apartment_number}
                  onChange={(e) => setFormData({ ...formData, apartment_number: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Ej: Depto 501, Casa 15, Oficina 302"
                />
              </div>

              {/* Fila 3: Región y Comuna */}
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
                    value={formData.commune}
                    onChange={(e) => setFormData({ ...formData, commune: e.target.value })}
                    disabled={!formData.region}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
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

              {/* Fila 4: Precio y Gastos Comunes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Precio ({formData.listing_type === 'venta' ? 'Venta' : 'Arriendo mensual'}) *
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

              {/* Fila 5: Dormitorios, Baños y Superficie */}
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
                    Superficie (m²)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.area_sqm}
                    onChange={(e) => setFormData({ ...formData, area_sqm: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="120"
                  />
                </div>
              </div>

              {/* Fila 6: Descripción */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Describe las características principales de la propiedad, ubicación, amenidades, etc."
                />
              </div>
            </div>
          </div>

          {/* Sección: Datos del Propietario */}
          <div className="space-y-6">
            <div className="border-b pb-2">
              <h2 className="text-xl font-bold text-gray-900">Datos del Propietario</h2>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {/* Fila 1: Nombre Completo del Propietario */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre Completo del Propietario *
                </label>
                <input
                  type="text"
                  required
                  value={formData.owner_full_name}
                  onChange={(e) => setFormData({ ...formData, owner_full_name: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.owner_full_name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Ej: Juan Carlos Pérez González"
                />
                {errors.owner_full_name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.owner_full_name}
                  </p>
                )}
              </div>

              {/* Fila 2: Dirección del Propietario */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Dirección del Propietario *
                </label>
                <input
                  type="text"
                  required
                  value={formData.owner_address}
                  onChange={(e) => setFormData({ ...formData, owner_address: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.owner_address ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Ej: Av. Providencia 2500, Las Condes, Santiago"
                />
                {errors.owner_address && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.owner_address}
                  </p>
                )}
              </div>

              {/* Fila 3: Departamento/Oficina/Casa N° del Propietario */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Departamento / Oficina / Casa N° del Propietario (Opcional)
                </label>
                <input
                  type="text"
                  value={formData.owner_apartment_number}
                  onChange={(e) => setFormData({ ...formData, owner_apartment_number: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Ej: Depto 1205, Casa 8, Oficina 45"
                />
              </div>

              {/* Fila 4: Región y Comuna del Propietario */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Región del Propietario *
                  </label>
                  <select
                    required
                    value={formData.owner_region}
                    onChange={(e) => handleRegionChange(e.target.value, true)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
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
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
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

              {/* Fila 5: Estado Civil */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Estado Civil *
                  </label>
                  <select
                    required
                    value={formData.marital_status}
                    onChange={(e) => setFormData({ ...formData, marital_status: e.target.value, property_regime: '' })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">Seleccionar régimen</option>
                      <option value="sociedad_conyugal">Sociedad conyugal</option>
                      <option value="separacion_bienes">Separación total de bienes</option>
                      <option value="participacion_gananciales">Participación en los gananciales</option>
                    </select>
                  </div>
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

          {/* Sección: Disponibilidad para Visitas */}
          <div className="space-y-6">
            <div className="border-b pb-2">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Calendar className="h-6 w-6 mr-2 text-blue-600" />
                Disponibilidad para Visitas (Opcional)
              </h2>
              <p className="text-sm text-gray-600 mt-2">
                Selecciona los días y horarios en los que generalmente puedes mostrar la propiedad. 
                Esto facilitará la coordinación con los interesados.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Días de la Semana */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Días Disponibles</h3>
                <div className="space-y-3">
                  {[
                    { value: 'lunes', label: 'Lunes' },
                    { value: 'martes', label: 'Martes' },
                    { value: 'miercoles', label: 'Miércoles' },
                    { value: 'jueves', label: 'Jueves' },
                    { value: 'viernes', label: 'Viernes' },
                    { value: 'sabado', label: 'Sábado' },
                    { value: 'domingo', label: 'Domingo' }
                  ].map((day) => (
                    <label key={day.value} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.availableDays.includes(day.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              availableDays: [...prev.availableDays, day.value]
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              availableDays: prev.availableDays.filter(d => d !== day.value)
                            }));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-gray-700 font-medium">{day.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Bloques Horarios */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Horarios Disponibles</h3>
                <div className="space-y-3">
                  {[
                    { value: 'morning', label: 'Mañana (9:00 - 12:00)' },
                    { value: 'afternoon', label: 'Tarde (14:00 - 17:00)' },
                    { value: 'evening', label: 'Tarde-Noche (17:00 - 20:00)' }
                  ].map((timeSlot) => (
                    <label key={timeSlot.value} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.availableTimeSlots.includes(timeSlot.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              availableTimeSlots: [...prev.availableTimeSlots, timeSlot.value]
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              availableTimeSlots: prev.availableTimeSlots.filter(t => t !== timeSlot.value)
                            }));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-gray-700 font-medium">{timeSlot.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Información adicional */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-900">Información sobre disponibilidad</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Esta información es opcional y solo sirve como referencia. Los interesados podrán 
                    solicitar visitas en cualquier momento y tú podrás coordinar directamente con ellos.
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* Sección: Documentación Legal */}
          <div className="space-y-6">
            <div className="border-b pb-2">
              <h2 className="text-xl font-bold text-gray-900">Documentación Legal</h2>
            </div>

            {/* Documentos Requeridos */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Documentos Requeridos</h3>
              <div className="space-y-3">
                {requiredDocuments.map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{label}</p>
                      {formData.documents[key as keyof typeof formData.documents] && (
                        <p className="text-sm text-green-600 mt-1 flex items-center">
                          <Check className="h-4 w-4 mr-1" />
                          {(formData.documents[key as keyof typeof formData.documents] as File)?.name}
                        </p>
                      )}
                      {errors[key] && (
                        <p className="text-sm text-red-600 mt-1 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors[key]}
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
                            accept=".pdf,.doc,.docx"
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

            {/* Documentos Opcionales */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Documentos Opcionales</h3>
              <div className="space-y-3">
                {optionalDocuments.map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{label}</p>
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
                            accept=".pdf,.doc,.docx"
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