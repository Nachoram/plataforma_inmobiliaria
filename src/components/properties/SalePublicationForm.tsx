import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Building, AlertCircle, Upload, X, User, MapPin, DollarSign } from 'lucide-react';

const CHILE_REGIONS_COMMUNES = {
  'region-metropolitana': {
    name: 'Región Metropolitana',
    communes: [
      'Santiago', 'Las Condes', 'Providencia', 'Ñuñoa', 'La Reina', 'Macul', 'Peñalolén',
      'La Florida', 'Puente Alto', 'Pirque', 'San José de Maipo', 'Cordillera', 'San Bernardo',
      'Buin', 'Paine', 'Calera de Tango', 'El Bosque', 'La Cisterna', 'Lo Espejo', 'Pedro Aguirre Cerda',
      'San Miguel', 'San Joaquín', 'La Granja', 'San Ramón', 'La Pintana', 'El Monte', 'Isla de Maipo',
      'Padre Hurtado', 'Peñaflor', 'Talagante', 'Melipilla', 'Alhué', 'Curacaví', 'María Pinto',
      'San Pedro', 'Pudahuel', 'Quilicura', 'Lampa', 'Colina', 'Tiltil', 'Vitacura', 'Lo Barnechea',
      'Huechuraba', 'Renca', 'Quinta Normal', 'Lo Prado', 'Cerro Navia', 'Independencia', 'Conchalí',
      'Recoleta', 'Estación Central', 'Cerrillos', 'Maipú'
    ]
  },
  'valparaiso': {
    name: 'Región de Valparaíso',
    communes: [
      'Valparaíso', 'Viña del Mar', 'Concón', 'Quilpué', 'Villa Alemana', 'Quillota'
    ]
  }
};

export const SalePublicationForm: React.FC = () => {
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
    area_sqm: '',
    description: '',

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
    property_regime: '',

    // Archivos
    photos_urls: [] as string[],
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

  // Validación del formulario
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validar información de la propiedad
    if (!formData.address_street.trim()) newErrors.address_street = 'La calle es requerida';
    if (!formData.address_number.trim()) newErrors.address_number = 'El número es requerido';
    if (!formData.region) newErrors.region = 'La región es requerida';
    if (!formData.commune) newErrors.commune = 'La comuna es requerida';
    if (!formData.price.trim()) newErrors.price = 'El precio de venta es requerido';
    if (!formData.area_sqm.trim()) newErrors.area_sqm = 'La superficie es requerida';
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

    // Generate a temporary UUID for this transaction
    const tempPropertyId = crypto.randomUUID();

    try {
      // Ensure the user's profile exists (opcional, no crítico)
      try {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            first_name: formData.owner_first_name,
            paternal_last_name: formData.owner_paternal_last_name,
            maternal_last_name: formData.owner_maternal_last_name,
            email: user.email || '',
            phone: null,
            address_street: formData.owner_address_street,
            address_number: formData.owner_address_number,
            address_commune: formData.owner_commune,
            address_region: formData.owner_region,
            profession: null,
            marital_status: formData.marital_status,
            property_regime: formData.marital_status === 'casado' ? formData.property_regime : null,
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
        listing_type: 'venta' as const,
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
        surface_m2: areaSqm,
        description: formData.description,
        created_at: new Date().toISOString()
      };

      const { data: propertyResult, error } = await supabase
        .from('properties')
        .insert(propertyData)
        .select()
        .single();

      if (error) throw error;

      // Insert sale owner information with specific ID capture
      if (propertyResult?.id) {
        const { data: ownerResult, error: ownerError } = await supabase
          .from('sale_owners')
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
          console.warn('Warning inserting sale owner:', ownerError);
          // Continue anyway - owner creation is not critical for property creation
        } else {
          console.log('✅ Sale owner creado con ID específico:', ownerResult.id);
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
    } catch (error) {
      console.error('Error saving sale property:', error);
      setErrors({ submit: 'Error al publicar la propiedad. Intente nuevamente.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Publicar Propiedad en Venta
          </h1>
          <p className="text-gray-600">
            Completa todos los campos para publicar tu propiedad en venta
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Sección 1: Información de la Propiedad */}
          <div className="space-y-6">
            <div className="border-b pb-2">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Building className="h-6 w-6 mr-2 text-blue-600" />
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
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
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
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.commune ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    disabled={!formData.region}
                  >
                    <option value="">Seleccionar comuna</option>
                    {getAvailableCommunes(formData.region).map((commune) => (
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

              {/* Precio y Gastos Comunes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Precio de Venta (CLP) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.price ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Ej: 150000000"
                  />
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.price}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Gastos Comunes (CLP) (Opcional)
                  </label>
                  <input
                    type="number"
                    value={formData.common_expenses}
                    onChange={(e) => setFormData({ ...formData, common_expenses: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Ej: 50000"
                  />
                </div>
              </div>

              {/* Características */}
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
                    {[1, 2, 3, 4, 5, 6].map(num => (
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
                    {[1, 2, 3, 4, 5].map(num => (
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
                    value={formData.area_sqm}
                    onChange={(e) => setFormData({ ...formData, area_sqm: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.area_sqm ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Ej: 120"
                  />
                  {errors.area_sqm && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.area_sqm}
                    </p>
                  )}
                </div>
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
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.description ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Describe las características principales de la propiedad..."
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
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <User className="h-6 w-6 mr-2 text-blue-600" />
                Datos del Propietario
              </h2>
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
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
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
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
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
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
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
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
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

              {/* Dirección del Propietario */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Calle del Propietario *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.owner_address_street}
                    onChange={(e) => setFormData({ ...formData, owner_address_street: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.owner_address_street ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Ej: Av. Principal"
                  />
                  {errors.owner_address_street && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.owner_address_street}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Número del Propietario *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.owner_address_number}
                    onChange={(e) => setFormData({ ...formData, owner_address_number: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.owner_address_number ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Ej: 567"
                  />
                  {errors.owner_address_number && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.owner_address_number}
                    </p>
                  )}
                </div>
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
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.owner_commune ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    disabled={!formData.owner_region}
                  >
                    <option value="">Seleccionar comuna</option>
                    {getAvailableCommunes(formData.owner_region).map((commune) => (
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

              {/* Estado Civil y Régimen Patrimonial */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Estado Civil *
                  </label>
                  <select
                    required
                    value={formData.marital_status}
                    onChange={(e) => setFormData({ ...formData, marital_status: e.target.value })}
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

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Régimen Patrimonial
                  </label>
                  <select
                    value={formData.property_regime}
                    onChange={(e) => setFormData({ ...formData, property_regime: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.property_regime ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    disabled={formData.marital_status !== 'casado'}
                  >
                    <option value="">Seleccionar régimen</option>
                    <option value="sociedad conyugal">Sociedad Conyugal</option>
                    <option value="separación de bienes">Separación de Bienes</option>
                    <option value="participación en los gananciales">Participación en los Gananciales</option>
                  </select>
                  {errors.property_regime && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.property_regime}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/portfolio')}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Publicando...
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Publicar Propiedad
                </>
              )}
            </button>
          </div>

          {/* Error general */}
          {errors.submit && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                {errors.submit}
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
