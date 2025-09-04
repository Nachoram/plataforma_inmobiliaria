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
    address: '',
    apartment_number: '',
    region: '',
    commune: '',
    price: '',
    common_expenses: '',
    bedrooms: '1',
    bathrooms: '1',
    area_sqm: '',
    description: '',
    
    // Datos del Propietario
    owner_full_name: '',
    owner_address: '',
    owner_apartment_number: '',
    owner_region: '',
    owner_commune: '',
    marital_status: '',
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
    if (!formData.address.trim()) newErrors.address = 'La dirección es requerida';
    if (!formData.region) newErrors.region = 'La región es requerida';
    if (!formData.commune) newErrors.commune = 'La comuna es requerida';
    if (!formData.price.trim()) newErrors.price = 'El precio de arriendo es requerido';
    if (!formData.area_sqm.trim()) newErrors.area_sqm = 'La superficie es requerida';
    if (!formData.description.trim()) newErrors.description = 'La descripción es requerida';
    if (!formData.owner_full_name.trim()) newErrors.owner_full_name = 'El nombre del propietario es requerido';
    if (!formData.owner_address.trim()) newErrors.owner_address = 'La dirección del propietario es requerida';
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

  // Upload files to Supabase Storage
  const uploadFiles = async () => {
    const uploadedPhotoUrls: string[] = [];
    const uploadedDocumentUrls: string[] = [];

    // Upload photos to images bucket
    for (const file of photoFiles) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${Date.now()}-${Math.random()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('images')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(data.path);

      uploadedPhotoUrls.push(publicUrl);
    }

    // Upload documents to files bucket
    for (const [key, file] of Object.entries(formData.documents)) {
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user?.id}/${key}-${Date.now()}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('files')
          .upload(fileName, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('files')
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

    // Validate user is authenticated
    if (!user?.id) {
      setErrors({ submit: 'Debes estar autenticado para publicar una propiedad.' });
      return;
    }

    setLoading(true);

    try {
      // Ensure the user's profile exists (opcional, no crítico)
      try {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            full_name: formData.owner_full_name,
            contact_email: user.email || '',
            contact_phone: null,
          }, {
            onConflict: 'id'
          });

        if (profileError) {
          console.warn('Warning upserting profile:', profileError);
          // Continue anyway - profile creation is not critical
        }
      } catch (error) {
        console.warn('Profile upsert failed, continuing anyway:', error);
      }

      // Upload files only if they exist (optional)
      let uploadedPhotoUrls: string[] = [];
      let uploadedDocumentUrls: string[] = [];
      
      if (photoFiles.length > 0 || Object.values(formData.documents).some(doc => doc !== null)) {
        setUploading(true);
        try {
          const { uploadedPhotoUrls: photos, uploadedDocumentUrls: docs } = await uploadFiles();
          uploadedPhotoUrls = photos;
          uploadedDocumentUrls = docs;
        } catch (error) {
          console.warn('File upload failed, continuing without files:', error);
          // Continue without files - they are optional
        } finally {
          setUploading(false);
        }
      }

      // Parse numeric values with validation
      const price = parseFloat(formData.price);
      const areaSqm = parseInt(formData.area_sqm);
      const commonExpenses = formData.common_expenses ? parseFloat(formData.common_expenses) : 0;
      const bedrooms = parseInt(formData.bedrooms);
      const bathrooms = parseInt(formData.bathrooms);
      
      if (isNaN(price) || isNaN(areaSqm) || isNaN(bedrooms) || isNaN(bathrooms)) {
        throw new Error('Valores numéricos inválidos');
      }

      const propertyData = {
        owner_id: user.id,
        type: 'arriendo' as const,
        address: formData.address,
        street: formData.address.split(' ').slice(0, -1).join(' ') || formData.address,
        number: formData.address.split(' ').pop() || 'S/N',
        apartment: formData.apartment_number || null,
        region: formData.region,
        comuna: formData.commune,
        description: formData.description,
        price: price,
        common_expenses: commonExpenses,
        bedrooms: bedrooms,
        bathrooms: bathrooms,
        surface: areaSqm,
        photos_urls: uploadedPhotoUrls,
        documents_urls: uploadedDocumentUrls,
        status: 'active' as const
      };

      const { error } = await supabase
        .from('properties')
        .insert(propertyData);
      
      if (error) throw error;

      alert('Propiedad publicada exitosamente!');
      navigate('/portfolio');
    } catch (error) {
      console.error('Error saving rental property:', error);
      setErrors({ submit: 'Error al publicar la propiedad. Intente nuevamente.' });
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
              {/* Dirección */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Dirección *
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                    errors.address ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Ej: Av. Libertador 1234"
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.address}
                  </p>
                )}
              </div>

              {/* Número de Departamento */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Número de Departamento (opcional)
                </label>
                <input
                  type="text"
                  value={formData.apartment_number}
                  onChange={(e) => setFormData({ ...formData, apartment_number: e.target.value })}
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

              {/* Superficie */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Superficie (m²) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.area_sqm}
                  onChange={(e) => setFormData({ ...formData, area_sqm: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                    errors.area_sqm ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="120"
                />
                {errors.area_sqm && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.area_sqm}
                  </p>
                )}
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

          {/* Sección 2: Datos del Propietario */}
          <div className="space-y-6">
            <div className="border-b pb-2">
              <h2 className="text-xl font-bold text-gray-900">Datos del Propietario</h2>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {/* Nombre Completo del Propietario */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre Completo del Propietario *
                </label>
                <input
                  type="text"
                  required
                  value={formData.owner_full_name}
                  onChange={(e) => setFormData({ ...formData, owner_full_name: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
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

              {/* Dirección del Propietario */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Dirección del Propietario *
                </label>
                <input
                  type="text"
                  required
                  value={formData.owner_address}
                  onChange={(e) => setFormData({ ...formData, owner_address: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                    errors.owner_address ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Ej: Av. Providencia 2500"
                />
                {errors.owner_address && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.owner_address}
                  </p>
                )}
              </div>

              {/* Número de Departamento del Propietario */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Número de Departamento del Propietario (opcional)
                </label>
                <input
                  type="text"
                  value={formData.owner_apartment_number}
                  onChange={(e) => setFormData({ ...formData, owner_apartment_number: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="Ej: 45A"
                />
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
