import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Upload, X, FileText, Image } from 'lucide-react';
import { supabase, Property } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

export const PropertyForm: React.FC = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const isEditing = Boolean(id);
  const listingType = searchParams.get('type') as 'venta' | 'arriendo' || 'venta';
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    listing_type: listingType,
    address: '',
    city: '',
    country: 'Chile',
    description: '',
    price: '',
    bedrooms: '1',
    bathrooms: '1',
    area_sqm: '',
    photos_urls: [] as string[],
    documents_urls: [] as string[],
  });

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
      
      setFormData({
        listing_type: data.listing_type,
        address: data.address,
        city: data.city,
        country: data.country,
        description: data.description || '',
        price: data.price.toString(),
        bedrooms: data.bedrooms.toString(),
        bathrooms: data.bathrooms.toString(),
        area_sqm: data.area_sqm?.toString() || '',
        photos_urls: data.photos_urls || [],
        documents_urls: data.documents_urls || [],
      });
    } catch (error) {
      console.error('Error fetching property:', error);
    }
  };

  const handleFileUpload = async (files: FileList, type: 'photos' | 'documents') => {
    if (!files.length) return;

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
        const bucket = type === 'photos' ? 'property-photos' : 'property-documents';

        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(fileName, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(data.path);

        uploadedUrls.push(publicUrl);
      }

      const field = type === 'photos' ? 'photos_urls' : 'documents_urls';
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], ...uploadedUrls]
      }));
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (url: string, type: 'photos' | 'documents') => {
    const field = type === 'photos' ? 'photos_urls' : 'documents_urls';
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter(u => u !== url)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const propertyData = {
        owner_id: user?.id,
        listing_type: formData.listing_type,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        description: formData.description,
        price: parseFloat(formData.price),
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseInt(formData.bathrooms),
        area_sqm: formData.area_sqm ? parseInt(formData.area_sqm) : null,
        photos_urls: formData.photos_urls,
        documents_urls: formData.documents_urls,
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

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar Propiedad' : `Publicar Propiedad en ${listingType.charAt(0).toUpperCase() + listingType.slice(1)}`}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEditing ? 'Actualiza la información de tu propiedad' : 'Completa los datos para publicar tu propiedad'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección *
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Av. Libertador 1234"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ciudad *
              </label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Santiago"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                País *
              </label>
              <input
                type="text"
                required
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Chile"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio ({formData.listing_type === 'venta' ? 'Venta' : 'Arriendo mensual'}) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1000000"
                />
              </div>
            </div>
          </div>

          {/* Property Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dormitorios *
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.bedrooms}
                onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Baños *
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.bathrooms}
                onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Superficie (m²)
              </label>
              <input
                type="number"
                min="0"
                value={formData.area_sqm}
                onChange={(e) => setFormData({ ...formData, area_sqm: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="120"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe las características principales de la propiedad..."
            />
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fotos de la Propiedad
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files, 'photos')}
                className="hidden"
                id="photo-upload"
              />
              <label htmlFor="photo-upload" className="cursor-pointer">
                <div className="text-center">
                  <Image className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Haz clic para subir fotos o arrastra y suelta
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    PNG, JPG hasta 10MB cada una
                  </p>
                </div>
              </label>
            </div>

            {/* Photo Preview */}
            {formData.photos_urls.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.photos_urls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={url} 
                      alt={`Foto ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(url, 'photos')}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Document Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Documentos (Opcional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 transition-colors">
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files, 'documents')}
                className="hidden"
                id="document-upload"
              />
              <label htmlFor="document-upload" className="cursor-pointer">
                <div className="text-center">
                  <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Haz clic para subir documentos
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    PDF, DOC, DOCX hasta 10MB cada uno
                  </p>
                </div>
              </label>
            </div>

            {/* Document List */}
            {formData.documents_urls.length > 0 && (
              <div className="mt-4 space-y-2">
                {formData.documents_urls.map((url, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-700">Documento {index + 1}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(url, 'documents')}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {uploading && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
              Subiendo archivos...
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/portfolio')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || uploading}
              className="px-6 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Guardando...' : (isEditing ? 'Actualizar Propiedad' : 'Publicar Propiedad')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};