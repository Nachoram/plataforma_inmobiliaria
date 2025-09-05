import React, { useState, useEffect } from 'react';
import { supabase, Property, formatPriceCLP } from '../../lib/supabase';

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
    description: '',
    // Datos del propietario
    owner_first_name: '',
    owner_paternal_last_name: '',
    owner_maternal_last_name: '',
    owner_address_street: '',
    owner_address_number: '',
    owner_address_department: '',
    owner_address_commune: '',
    owner_address_region: '',
  });

  const [images, setImages] = useState<File[]>([]);
  const [documents, setDocuments] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Regiones de Chile
  const regions = [
    'Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo',
    'Valparaíso', 'Metropolitana', 'O\'Higgins', 'Maule', 'Ñuble',
    'Biobío', 'La Araucanía', 'Los Ríos', 'Los Lagos', 'Aysén', 'Magallanes'
  ];

  useEffect(() => {
    const loadPropertyData = async () => {
      if (property) {
        // Cargar datos de la propiedad
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
          description: property.description,
          // Campos del propietario (se llenarán con datos del perfil del owner)
          owner_first_name: '',
          owner_paternal_last_name: '',
          owner_maternal_last_name: '',
          owner_address_street: '',
          owner_address_number: '',
          owner_address_department: '',
          owner_address_commune: '',
          owner_address_region: '',
        };

        // Cargar datos del propietario si existe
        try {
          const { data: ownerProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', property.owner_id)
            .single();

          if (ownerProfile) {
            propertyFormData.owner_first_name = ownerProfile.first_name || '';
            propertyFormData.owner_paternal_last_name = ownerProfile.paternal_last_name || '';
            propertyFormData.owner_maternal_last_name = ownerProfile.maternal_last_name || '';
            propertyFormData.owner_address_street = ownerProfile.address_street || '';
            propertyFormData.owner_address_number = ownerProfile.address_number || '';
            propertyFormData.owner_address_department = ownerProfile.address_department || '';
            propertyFormData.owner_address_commune = ownerProfile.address_commune || '';
            propertyFormData.owner_address_region = ownerProfile.address_region || '';
          }
        } catch (error) {
          console.error('Error cargando datos del propietario:', error);
        }

        setFormData(propertyFormData);
      }
    };

    loadPropertyData();
  }, [property]);

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
    const uploadedImages = [];
    
    for (const image of images) {
      const fileExt = image.name.split('.').pop();
      const fileName = `${propertyId}/${Date.now()}.${fileExt}`;
      
      const { error } = await supabase.storage
        .from('property-images')
        .upload(fileName, image);
      
      if (error) {
        throw new Error(`Error subiendo imagen: ${error.message}`);
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(fileName);
      
      // Guardar referencia en la base de datos
      const { error: dbError } = await supabase
        .from('property_images')
        .insert({
          property_id: propertyId,
          image_url: publicUrl,
          storage_path: fileName
        });
      
      if (dbError) {
        throw new Error(`Error guardando imagen: ${dbError.message}`);
      }
      
      uploadedImages.push(publicUrl);
    }
    
    return uploadedImages;
  };

  const uploadDocuments = async (propertyId: string) => {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Usuario no autenticado');
    
    const uploadedDocuments = [];
    
    for (const document of documents) {
      const fileExt = document.name.split('.').pop();
      const fileName = `${user.data.user.id}/${propertyId}/${Date.now()}.${fileExt}`;
      
      const { error } = await supabase.storage
        .from('user-documents')
        .upload(fileName, document);
      
      if (error) {
        throw new Error(`Error subiendo documento: ${error.message}`);
      }
      
      // Guardar referencia en la base de datos
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          uploader_id: user.data.user.id,
          related_entity_id: propertyId,
          related_entity_type: 'property_legal',
          document_type: document.name,
          storage_path: fileName,
          file_name: document.name
        });
      
      if (dbError) {
        throw new Error(`Error guardando documento: ${dbError.message}`);
      }
      
      uploadedDocuments.push(fileName);
    }
    
    return uploadedDocuments;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        throw new Error('Usuario no autenticado');
      }

      // Objeto para la tabla 'properties'
      const propertyData = {
        owner_id: user.data.user.id,
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
        description: formData.description,
      };

      // Objeto para actualizar el perfil del propietario
      const ownerData = {
        first_name: formData.owner_first_name,
        paternal_last_name: formData.owner_paternal_last_name,
        maternal_last_name: formData.owner_maternal_last_name,
        address_street: formData.owner_address_street,
        address_number: formData.owner_address_number,
        address_department: formData.owner_address_department || null,
        address_commune: formData.owner_address_commune,
        address_region: formData.owner_address_region,
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

      // Actualizar perfil del propietario con la información proporcionada
      const { error: ownerError } = await supabase
        .from('profiles')
        .upsert({
          id: user.data.user.id,
          ...ownerData
        });

      if (ownerError) {
        console.error('Error actualizando perfil del propietario:', ownerError);
        // No lanzamos error aquí para no interrumpir el flujo si ya se guardó la propiedad
      }

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {property ? 'Editar Propiedad' : 'Publicar Nueva Propiedad'}
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
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
            <option value="venta">Venta</option>
            <option value="arriendo">Arriendo</option>
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

        {/* Datos del Propietario */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Datos del Propietario</h3>

          <div className="space-y-4">
            {/* Campo para Nombres del Propietario */}
            <div>
              <label htmlFor="owner_first_name" className="block text-sm font-medium text-gray-700 mb-2">
                Nombres del Propietario
              </label>
              <input
                type="text"
                id="owner_first_name"
                name="owner_first_name"
                value={formData.owner_first_name}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Campo para Apellido Paterno */}
            <div>
              <label htmlFor="owner_paternal_last_name" className="block text-sm font-medium text-gray-700 mb-2">
                Apellido Paterno
              </label>
              <input
                type="text"
                id="owner_paternal_last_name"
                name="owner_paternal_last_name"
                value={formData.owner_paternal_last_name}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Campo para Apellido Materno */}
            <div>
              <label htmlFor="owner_maternal_last_name" className="block text-sm font-medium text-gray-700 mb-2">
                Apellido Materno
              </label>
              <input
                type="text"
                id="owner_maternal_last_name"
                name="owner_maternal_last_name"
                value={formData.owner_maternal_last_name}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Dirección del Propietario */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-700">Dirección del Propietario</h4>

              <div>
                <label htmlFor="owner_address_street" className="block text-sm font-medium text-gray-700 mb-2">
                  Calle del Propietario
                </label>
                <input
                  type="text"
                  id="owner_address_street"
                  name="owner_address_street"
                  value={formData.owner_address_street}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="owner_address_number" className="block text-sm font-medium text-gray-700 mb-2">
                  Número del Propietario
                </label>
                <input
                  type="text"
                  id="owner_address_number"
                  name="owner_address_number"
                  value={formData.owner_address_number}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comuna del Propietario *
                  </label>
                  <input
                    type="text"
                    name="owner_address_commune"
                    value={formData.owner_address_commune}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Región del Propietario *
                  </label>
                  <select
                    name="owner_address_region"
                    value={formData.owner_address_region}
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
          </div>
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

        {/* Botones */}
        <div className="flex justify-end space-x-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Guardando...' : (property ? 'Actualizar' : 'Publicar')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PropertyPublicationForm;