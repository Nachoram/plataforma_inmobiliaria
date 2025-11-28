import React, { memo } from 'react';
import { Upload, X, Image } from 'lucide-react';
import { PropertyPhotosProps } from '../../types';

/**
 * Componente PropertyPhotos - Gestión de fotos de propiedad
 *
 * Responsabilidades:
 * - Subida múltiple de fotos
 * - Vista previa de imágenes
 * - Eliminación de fotos seleccionadas
 * - Validación de formato y tamaño
 */
export const PropertyPhotos: React.FC<PropertyPhotosProps> = memo(({
  photoFiles,
  photoPreviews,
  onPhotosChange,
  maxPhotos = 20,
  uploading = false,
  errors
}) => {
  // Función interna para manejar subida de fotos
  const handlePhotoUpload = (files: FileList) => {
    const newFiles = Array.from(files);
    const newPreviews: string[] = [];

    // Validar cantidad máxima
    if (photoFiles.length + newFiles.length > maxPhotos) {
      alert(`Máximo ${maxPhotos} fotos permitidas`);
      return;
    }

    newFiles.forEach(file => {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        alert(`El archivo ${file.name} no es una imagen válida`);
        return;
      }

      // Validar tamaño (10MB máximo)
      if (file.size > 10 * 1024 * 1024) {
        alert(`La imagen ${file.name} es demasiado grande (máximo 10MB)`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          newPreviews.push(result);
        }

        // Cuando todas las imágenes se han procesado
        if (newPreviews.length === newFiles.length) {
          const updatedFiles = [...photoFiles, ...newFiles];
          const updatedPreviews = [...photoPreviews, ...newPreviews];
          onPhotosChange(updatedFiles, updatedPreviews);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Función interna para eliminar foto
  const removePhoto = (index: number) => {
    const updatedFiles = photoFiles.filter((_, i) => i !== index);
    const updatedPreviews = photoPreviews.filter((_, i) => i !== index);
    onPhotosChange(updatedFiles, updatedPreviews);
  };

  return (
    <div className="space-y-3">
      <div className="border-b pb-2">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <Image className="h-6 w-6 mr-2 text-emerald-600" />
          Fotos de la Propiedad (Opcional)
        </h2>
      </div>

      <div className="space-y-3">
        {/* Upload de fotos */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Subir Fotos
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-emerald-400 transition-colors">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => e.target.files && handlePhotoUpload(e.target.files)}
              className="hidden"
              id="photo-upload"
              data-testid="photo-upload"
              disabled={uploading}
            />
            <label htmlFor="photo-upload" className="cursor-pointer">
              <Upload className={`mx-auto h-12 w-12 ${uploading ? 'text-gray-300' : 'text-gray-400'}`} />
              <p className="mt-2 text-sm text-gray-600">
                {uploading ? 'Subiendo fotos...' : 'Haz clic para subir fotos o arrastra y suelta'}
              </p>
              <p className="text-xs text-gray-500">PNG, JPG hasta 10MB (máximo {maxPhotos} fotos)</p>
            </label>
          </div>
          {errors?.photo && (
            <p className="mt-1 text-sm text-red-600">{errors.photo}</p>
          )}
        </div>

        {/* Preview de fotos */}
        {photoPreviews.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Fotos Seleccionadas ({photoFiles.length})
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    disabled={uploading}
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Estado vacío */}
        {photoPreviews.length === 0 && !uploading && (
          <div className="text-center py-8 text-gray-500">
            <Image className="mx-auto h-12 w-12 text-gray-300 mb-2" />
            <p className="text-sm">No hay fotos seleccionadas</p>
            <p className="text-xs mt-1">Las fotos ayudan a mostrar mejor tu propiedad</p>
          </div>
        )}
      </div>
    </div>
  );
});

PropertyPhotos.displayName = 'PropertyPhotos';
