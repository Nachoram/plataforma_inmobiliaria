import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, X, FileText, Image, Check, AlertCircle, Loader2,
  Building, MapPin, Car, DollarSign, User, Calendar, Home
} from 'lucide-react';
import { supabase, Property } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import FormStep from './FormStep';
import FormProgressBar, { FormStepInfo } from './FormProgressBar';
import ParkingSpaceForm, { ParkingSpace } from './ParkingSpaceForm';
import { CustomButton } from '../common';
import toast from 'react-hot-toast';

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

interface SalePublicationFormProps {
  initialData?: Property;
  isEditing?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Form data interface
interface SaleFormData {
  // Basic Info
  tipoPropiedad: string;
  title: string;
  description: string;
  price: string;
  common_expenses: string;

  // Location
  address_street: string;
  address_number: string;
  address_department: string;
  region: string;
  commune: string;

  // Characteristics
  bedrooms: string;
  bathrooms: string;
  estacionamientos: string;
  ubicacionEstacionamiento: string;
  metrosUtiles: string;
  metrosTotales: string;
  anoConstruccion: string;
  tieneTerraza: string;
  tieneSalaEstar: string;
  tieneBodega: string;
  metrosBodega: string;
  ubicacionBodega: string;
  numeroBodega: string;
  parcela_number: string;

  // Amenities
  sistemaAguaCaliente: string;
  tipoCocina: string;

  // Images
  property_images: File[];

  // Parking Spaces
  parkingSpaces: ParkingSpace[];

  // Owner info (will be handled separately)
  ownerInfo: any;
}

interface SaleDocument {
  type: string;
  label: string;
  required?: boolean;
  file?: File;
  url?: string;
  uploaded?: boolean;
}

// ========================================================================
// MAIN COMPONENT - SALE PUBLICATION FORM WITH STEPS
// ========================================================================

export const SalePublicationForm: React.FC<SalePublicationFormProps> = ({
  initialData,
  isEditing = false,
  onSuccess,
  onCancel
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Form steps definition
  const formSteps: FormStepInfo[] = [
    {
      id: 'basic-info',
      title: 'Información Básica',
      description: 'Título, descripción y precio de venta',
      required: true
    },
    {
      id: 'location',
      title: 'Ubicación',
      description: 'Dirección completa de la propiedad',
      required: true
    },
    {
      id: 'characteristics',
      title: 'Características',
      description: 'Habitaciones, baños, superficie y amenities',
      required: true
    },
    {
      id: 'parking',
      title: 'Estacionamientos',
      description: 'Configuración de espacios de estacionamiento',
      required: false
    },
    {
      id: 'images',
      title: 'Imágenes',
      description: 'Fotos de la propiedad',
      required: true
    },
    {
      id: 'documents',
      title: 'Documentos',
      description: 'Documentos legales requeridos para venta',
      required: true
    }
  ];

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Form data state
  const getInitialFormData = useMemo(() => ({
    tipoPropiedad: initialData?.tipo_propiedad || 'Casa',
    title: initialData?.description?.split('\n')[0] || '',
    description: initialData?.description || '',
    price: initialData?.price_clp?.toString() || '',
    common_expenses: initialData?.common_expenses_clp?.toString() || '',

    address_street: initialData?.address_street || '',
    address_number: initialData?.address_number || '',
    address_department: initialData?.address_department || '',
    region: initialData?.address_region || '',
    commune: initialData?.address_commune || '',

    bedrooms: initialData?.bedrooms?.toString() || '0',
    bathrooms: initialData?.bathrooms?.toString() || '0',
    estacionamientos: initialData?.estacionamientos?.toString() || '0',
    ubicacionEstacionamiento: initialData?.parking_location || '',
    metrosUtiles: initialData?.metros_utiles?.toString() || '',
    metrosTotales: initialData?.metros_totales?.toString() || '',
    anoConstruccion: initialData?.ano_construccion?.toString() || '',
    tieneTerraza: initialData?.tiene_terraza ? 'Sí' : 'No',
    tieneSalaEstar: initialData?.tiene_sala_estar ? 'Sí' : 'No',
    tieneBodega: initialData?.tiene_bodega ? 'Sí' : 'No',
    metrosBodega: initialData?.metros_bodega?.toString() || '',
    ubicacionBodega: initialData?.storage_number || '',
    numeroBodega: '',
    parcela_number: initialData?.parcela_number || '',

    sistemaAguaCaliente: initialData?.sistema_agua_caliente || '',
    tipoCocina: initialData?.tipo_cocina || '',

    property_images: [] as File[],
    parkingSpaces: [] as ParkingSpace[],
    ownerInfo: null
  }), [initialData]);

  const [formData, setFormData] = useState<SaleFormData>(getInitialFormData);

  // Update formData when getInitialFormData changes
  useEffect(() => {
    setFormData(getInitialFormData);
  }, [getInitialFormData, isEditing, initialData]);

  // Helper functions
  const getAvailableCommunes = (region: string) => {
    return CHILE_REGIONS_COMMUNES[region as keyof typeof CHILE_REGIONS_COMMUNES]?.communes || [];
  };

  const isPropertyType = (type: string) => formData.tipoPropiedad === type;
  const isParking = isPropertyType('Estacionamiento');

  // Update form data
  const updateFormData = (updates: Partial<SaleFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  // Step navigation
  const canNavigateToStep = (stepIndex: number): boolean => {
    // Allow going back to any previous step
    if (stepIndex < currentStep) return true;

    // For forward navigation, check if current step is completed
    return completedSteps.has(currentStep);
  };

  const handleStepChange = (stepIndex: number) => {
    if (canNavigateToStep(stepIndex)) {
      setCurrentStep(stepIndex);
    }
  };

  const validateCurrentStep = (): boolean => {
    const errors: Record<string, string> = {};

    switch (currentStep) {
      case 0: // Basic Info
        if (!formData.title.trim()) errors.title = 'Título es requerido';
        if (!formData.description.trim()) errors.description = 'Descripción es requerida';
        if (!formData.price || parseInt(formData.price) <= 0) errors.price = 'Precio válido es requerido';
        break;

      case 1: // Location
        if (!formData.address_street.trim()) errors.address_street = 'Calle es requerida';
        if (!formData.address_number.trim()) errors.address_number = 'Número es requerido';
        if (!formData.region) errors.region = 'Región es requerida';
        if (!formData.commune) errors.commune = 'Comuna es requerida';
        break;

      case 2: // Characteristics
        if (!isParking && !isPropertyType('Bodega') && !isPropertyType('Parcela')) {
          if (!formData.bedrooms || parseInt(formData.bedrooms) < 0) errors.bedrooms = 'Dormitorios requeridos';
          if (!formData.bathrooms || parseInt(formData.bathrooms) < 0) errors.bathrooms = 'Baños requeridos';
        }
        if (!formData.metrosTotales || parseFloat(formData.metrosTotales) <= 0) {
          errors.metrosTotales = 'Superficie total es requerida';
        }
        break;

      case 4: // Images
        if (formData.property_images.length === 0) {
          errors.images = 'Al menos una imagen es requerida';
        }
        break;
    }

    // Update step completion status
    if (Object.keys(errors).length === 0) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      return true;
    } else {
      setCompletedSteps(prev => {
        const newSet = new Set(prev);
        newSet.delete(currentStep);
        return newSet;
      });
      return false;
    }
  };

  const handleNext = () => {
    if (validateCurrentStep() && currentStep < formSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    try {
      setLoading(true);

      // Validate all required steps are completed
      const allRequiredCompleted = formSteps
        .filter(step => step.required)
        .every(step => completedSteps.has(formSteps.indexOf(step)));

      if (!allRequiredCompleted) {
        toast.error('Complete todos los pasos requeridos antes de publicar');
        return;
      }

      // Prepare property data
      const propertyData = {
        owner_id: user?.id,
        listing_type: 'venta',
        tipo_propiedad: formData.tipoPropiedad,
        address_street: formData.address_street,
        address_number: formData.address_number,
        address_department: formData.address_department || null,
        address_commune: formData.commune,
        address_region: formData.region,
        price_clp: parseInt(formData.price),
        common_expenses_clp: formData.common_expenses ? parseInt(formData.common_expenses) : null,
        bedrooms: parseInt(formData.bedrooms) || 0,
        bathrooms: parseInt(formData.bathrooms) || 0,
        surface_m2: parseFloat(formData.metrosTotales) || null,
        metros_utiles: formData.metrosUtiles ? parseFloat(formData.metrosUtiles) : null,
        metros_totales: parseFloat(formData.metrosTotales) || null,
        estacionamientos: parseInt(formData.estacionamientos) || 0,
        parking_location: formData.ubicacionEstacionamiento || null,
        ano_construccion: formData.anoConstruccion ? parseInt(formData.anoConstruccion) : null,
        tiene_terraza: formData.tieneTerraza === 'Sí',
        tiene_sala_estar: formData.tieneSalaEstar === 'Sí',
        tiene_bodega: formData.tieneBodega === 'Sí',
        metros_bodega: formData.metrosBodega ? parseFloat(formData.metrosBodega) : null,
        storage_number: formData.ubicacionBodega || null,
        parcela_number: formData.parcela_number || null,
        sistema_agua_caliente: formData.sistemaAguaCaliente || null,
        tipo_cocina: formData.tipoCocina || null,
        description: `${formData.title}\n\n${formData.description}`,
        is_visible: true,
        status: 'disponible'
      };

      let propertyId: string;

      if (isEditing && initialData?.id) {
        // Update existing property
        const { error } = await supabase
          .from('properties')
          .update(propertyData)
          .eq('id', initialData.id);

        if (error) throw error;
        propertyId = initialData.id;
      } else {
        // Create new property
        const { data, error } = await supabase
          .from('properties')
          .insert(propertyData)
          .select('id')
          .single();

        if (error) throw error;
        propertyId = data.id;
      }

      // Handle image uploads
      if (formData.property_images.length > 0) {
        await uploadPropertyImages(propertyId, formData.property_images);
      }

      // Handle parking spaces
      if (formData.parkingSpaces.length > 0) {
        await saveParkingSpaces(propertyId, formData.parkingSpaces);
      }

      toast.success(isEditing ? 'Propiedad actualizada exitosamente' : 'Propiedad publicada exitosamente');

      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/dashboard');
      }

    } catch (error: any) {
      console.error('Error saving property:', error);
      toast.error('Error al guardar la propiedad: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const uploadPropertyImages = async (propertyId: string, images: File[]) => {
    const uploadPromises = images.map(async (image, index) => {
      const fileName = `property_${propertyId}_${Date.now()}_${index}.${image.name.split('.').pop()}`;
      const filePath = `properties/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('properties')
        .upload(filePath, image);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('properties')
        .getPublicUrl(filePath);

      // Save image reference in database
      const { error: dbError } = await supabase
        .from('property_images')
        .insert({
          property_id: propertyId,
          image_url: publicUrl,
          storage_path: filePath,
          display_order: index
        });

      if (dbError) throw dbError;
    });

    await Promise.all(uploadPromises);
  };

  const saveParkingSpaces = async (propertyId: string, parkingSpaces: ParkingSpace[]) => {
    // Save parking spaces to a parking_spaces table (to be created)
    // For now, we'll store this information in the property metadata
    const parkingData = {
      parking_spaces: parkingSpaces
    };

    await supabase
      .from('properties')
      .update({ parking_spaces: parkingData })
      .eq('id', propertyId);
  };

  // Update steps completion status when form data changes
  useEffect(() => {
    validateCurrentStep();
  }, [formData, currentStep]);

  // Render current step content
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderBasicInfoStep();
      case 1:
        return renderLocationStep();
      case 2:
        return renderCharacteristicsStep();
      case 3:
        return renderParkingStep();
      case 4:
        return renderImagesStep();
      case 5:
        return renderDocumentsStep();
      default:
        return null;
    }
  };

  const renderBasicInfoStep = () => (
    <FormStep
      title="Información Básica"
      description="Datos principales de la propiedad en venta"
    >
      <div className="space-y-6">
        {/* Property Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Propiedad *
          </label>
          <select
            value={formData.tipoPropiedad}
            onChange={(e) => {
              const newType = e.target.value;
              updateFormData({ tipoPropiedad: newType });

              // Reset fields based on property type
              if (newType === 'Estacionamiento') {
                updateFormData({
                  bedrooms: '0',
                  bathrooms: '0',
                  estacionamientos: '1',
                  ubicacionEstacionamiento: '',
                  metrosUtiles: '',
                  tieneTerraza: 'No',
                  tieneSalaEstar: 'No',
                  tieneBodega: 'No',
                  metrosBodega: '',
                  ubicacionBodega: '',
                  parcela_number: ''
                });
              } else if (newType === 'Bodega') {
                updateFormData({
                  bedrooms: '0',
                  bathrooms: '0',
                  estacionamientos: '0',
                  metrosUtiles: '',
                  tieneTerraza: 'No',
                  tieneSalaEstar: 'No',
                  tieneBodega: 'Sí',
                  parcela_number: ''
                });
              } else if (newType === 'Parcela') {
                updateFormData({
                  bedrooms: '0',
                  bathrooms: '0',
                  estacionamientos: '0',
                  metrosUtiles: '',
                  metrosTotales: '',
                  tieneTerraza: 'No',
                  tieneSalaEstar: 'No',
                  tieneBodega: 'No',
                  metrosBodega: '',
                  ubicacionBodega: '',
                  parcela_number: ''
                });
              } else {
                // Reset to defaults for habitable properties
                updateFormData({
                  bedrooms: '0',
                  bathrooms: '0',
                  estacionamientos: '0',
                  ubicacionEstacionamiento: '',
                  metrosUtiles: '',
                  tieneTerraza: 'No',
                  tieneSalaEstar: 'No',
                  tieneBodega: 'No',
                  metrosBodega: '',
                  ubicacionBodega: '',
                  parcela_number: ''
                });
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Casa">Casa</option>
            <option value="Departamento">Departamento</option>
            <option value="Oficina">Oficina</option>
            <option value="Local Comercial">Local Comercial</option>
            <option value="Estacionamiento">Estacionamiento</option>
            <option value="Bodega">Bodega</option>
            <option value="Parcela">Parcela</option>
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Título de la Publicación *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => updateFormData({ title: e.target.value })}
            placeholder="Ej: Hermosa casa en Las Condes"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descripción *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => updateFormData({ description: e.target.value })}
            rows={4}
            placeholder="Describe detalladamente la propiedad, sus características principales, ubicación, etc."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Price */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Precio de Venta (CLP) *
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => updateFormData({ price: e.target.value })}
              placeholder="150000000"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gastos Comunes (Opcional)
            </label>
            <input
              type="number"
              value={formData.common_expenses}
              onChange={(e) => updateFormData({ common_expenses: e.target.value })}
              placeholder="50000"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    </FormStep>
  );

  const renderLocationStep = () => (
    <FormStep
      title="Ubicación"
      description="Dirección completa de la propiedad"
    >
      <div className="space-y-6">
        {/* Street and Number */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Calle *
            </label>
            <input
              type="text"
              value={formData.address_street}
              onChange={(e) => updateFormData({ address_street: e.target.value })}
              placeholder="Ej: Avenida Providencia"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número *
            </label>
            <input
              type="text"
              value={formData.address_number}
              onChange={(e) => updateFormData({ address_number: e.target.value })}
              placeholder="123"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Department */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Departamento (Opcional)
          </label>
          <input
            type="text"
            value={formData.address_department}
            onChange={(e) => updateFormData({ address_department: e.target.value })}
            placeholder="Ej: 401"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Region and Commune */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Región *
            </label>
            <select
              value={formData.region}
              onChange={(e) => updateFormData({ region: e.target.value, commune: '' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Seleccionar región</option>
              {Object.entries(CHILE_REGIONS_COMMUNES).map(([key, region]) => (
                <option key={key} value={key}>
                  {region.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comuna *
            </label>
            <select
              value={formData.commune}
              onChange={(e) => updateFormData({ commune: e.target.value })}
              disabled={!formData.region}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            >
              <option value="">Seleccionar comuna</option>
              {formData.region && getAvailableCommunes(formData.region).map(commune => (
                <option key={commune} value={commune}>
                  {commune}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </FormStep>
  );

  const renderCharacteristicsStep = () => (
    <FormStep
      title="Características"
      description="Especificaciones técnicas de la propiedad"
    >
      <div className="space-y-6">
        {/* Bedrooms and Bathrooms - Only for habitable properties */}
        {!isParking && !isPropertyType('Bodega') && !isPropertyType('Parcela') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dormitorios *
              </label>
              <select
                value={formData.bedrooms}
                onChange={(e) => updateFormData({ bedrooms: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Baños *
              </label>
              <select
                value={formData.bathrooms}
                onChange={(e) => updateFormData({ bathrooms: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Surface Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Metros Totales (m²) *
            </label>
            <input
              type="number"
              value={formData.metrosTotales}
              onChange={(e) => updateFormData({ metrosTotales: e.target.value })}
              placeholder="120"
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Metros Útiles (m²) - Opcional
            </label>
            <input
              type="number"
              value={formData.metrosUtiles}
              onChange={(e) => updateFormData({ metrosUtiles: e.target.value })}
              placeholder="100"
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Construction Year */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Año de Construcción
          </label>
          <input
            type="number"
            value={formData.anoConstruccion}
            onChange={(e) => updateFormData({ anoConstruccion: e.target.value })}
            placeholder="2020"
            min="1900"
            max={new Date().getFullYear()}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Additional Features */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900">Características Adicionales</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ¿Tiene terraza?
              </label>
              <select
                value={formData.tieneTerraza}
                onChange={(e) => updateFormData({ tieneTerraza: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="No">No</option>
                <option value="Sí">Sí</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ¿Tiene sala de estar?
              </label>
              <select
                value={formData.tieneSalaEstar}
                onChange={(e) => updateFormData({ tieneSalaEstar: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="No">No</option>
                <option value="Sí">Sí</option>
              </select>
            </div>
          </div>

          {/* Storage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ¿Tiene bodega?
            </label>
            <select
              value={formData.tieneBodega}
              onChange={(e) => updateFormData({ tieneBodega: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="No">No</option>
              <option value="Sí">Sí</option>
            </select>
          </div>

          {formData.tieneBodega === 'Sí' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Metros de Bodega
                </label>
                <input
                  type="number"
                  value={formData.metrosBodega}
                  onChange={(e) => updateFormData({ metrosBodega: e.target.value })}
                  placeholder="10"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ubicación de Bodega
                </label>
                <input
                  type="text"
                  value={formData.ubicacionBodega}
                  onChange={(e) => updateFormData({ ubicacionBodega: e.target.value })}
                  placeholder="Subsuelo, Primer piso, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* Parcel Number - for land plots */}
          {isPropertyType('Parcela') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Parcela
              </label>
              <input
                type="text"
                value={formData.parcela_number}
                onChange={(e) => updateFormData({ parcela_number: e.target.value })}
                placeholder="Ej: Parcela 15, Manzana A"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}
        </div>

        {/* Amenities */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900">Servicios e Instalaciones</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sistema de Agua Caliente
              </label>
              <select
                value={formData.sistemaAguaCaliente}
                onChange={(e) => updateFormData({ sistemaAguaCaliente: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccionar</option>
                <option value="Calefón">Calefón</option>
                <option value="Termo Eléctrico">Termo Eléctrico</option>
                <option value="Caldera Central">Caldera Central</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Cocina
              </label>
              <select
                value={formData.tipoCocina}
                onChange={(e) => updateFormData({ tipoCocina: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccionar</option>
                <option value="Cerrada">Cerrada</option>
                <option value="Americana">Americana</option>
                <option value="Integrada">Integrada</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </FormStep>
  );

  const renderParkingStep = () => (
    <FormStep
      title="Estacionamientos"
      description="Configuración detallada de espacios de estacionamiento"
    >
      <ParkingSpaceForm
        parkingSpaces={formData.parkingSpaces}
        onChange={(parkingSpaces) => updateFormData({ parkingSpaces })}
        propertyId={isEditing ? initialData?.id : undefined}
      />
    </FormStep>
  );

  const renderImagesStep = () => (
    <FormStep
      title="Imágenes"
      description="Fotos profesionales de la propiedad"
    >
      <div className="space-y-4">
        {/* Image Upload Area */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
          <div className="text-center">
            <Image className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="image-upload" className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  Subir imágenes
                </span>
                <span className="mt-1 block text-sm text-gray-500">
                  PNG, JPG hasta 10MB cada una
                </span>
              </label>
              <input
                id="image-upload"
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  updateFormData({ property_images: [...formData.property_images, ...files] });
                }}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Uploaded Images Preview */}
        {formData.property_images.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Imágenes seleccionadas ({formData.property_images.length})
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {formData.property_images.map((file, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => {
                      const newImages = formData.property_images.filter((_, i) => i !== index);
                      updateFormData({ property_images: newImages });
                    }}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 mr-3" />
            <div>
              <h4 className="text-sm font-medium text-blue-800">
                Consejos para mejores fotos
              </h4>
              <ul className="mt-2 text-sm text-blue-700 space-y-1">
                <li>• Usa buena iluminación natural</li>
                <li>• Toma fotos desde diferentes ángulos</li>
                <li>• Incluye fotos del exterior e interior</li>
                <li>• La primera imagen es la más importante</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </FormStep>
  );

  const renderDocumentsStep = () => (
    <FormStep
      title="Documentos Legales"
      description="Documentos requeridos para la venta de propiedades"
    >
      <div className="space-y-6">
        {/* Required Documents for Sale */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 mr-3" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">
                Documentos requeridos para venta
              </h4>
              <p className="mt-1 text-sm text-yellow-700">
                Para publicar una propiedad en venta, debes proporcionar los siguientes documentos legales.
              </p>
            </div>
          </div>
        </div>

        {/* Document List */}
        <div className="space-y-4">
          {[
            { type: 'title_study', label: 'Estudio de Título', required: true, description: 'Documento que certifica la propiedad del inmueble' },
            { type: 'property_deed', label: 'Escritura de Propiedad', required: true, description: 'Documento legal de propiedad' },
            { type: 'id_owner', label: 'Cédula del Propietario', required: true, description: 'Identificación del vendedor' },
            { type: 'tax_receipt', label: 'Boleta de Contribuciones', required: false, description: 'Comprobante de pago de impuestos' },
            { type: 'certificate_freedom', label: 'Certificado de Libertad de Gravámenes', required: false, description: 'Confirma que la propiedad está libre de deudas' }
          ].map((doc) => (
            <div key={doc.type} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-gray-400" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    {doc.label}
                    {doc.required && <span className="text-red-500 ml-1">*</span>}
                  </h4>
                  <p className="text-sm text-gray-600">{doc.description}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  doc.required ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {doc.required ? 'Requerido' : 'Opcional'}
                </span>
                <CustomButton size="sm" variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Subir
                </CustomButton>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 mr-3" />
            <div>
              <h4 className="text-sm font-medium text-green-800">
                ¿Por qué son importantes estos documentos?
              </h4>
              <ul className="mt-2 text-sm text-green-700 space-y-1">
                <li>• Garantizan la legalidad de la transacción</li>
                <li>• Protegen tanto al comprador como al vendedor</li>
                <li>• Son requeridos por la legislación chilena</li>
                <li>• Facilitan el proceso notarial</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </FormStep>
  );

  // Update form steps with completion status
  const updatedSteps = formSteps.map((step, index) => ({
    ...step,
    completed: completedSteps.has(index),
    error: currentStep === index ? undefined : undefined // Add validation errors here if needed
  }));

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Editar Propiedad en Venta' : 'Publicar Propiedad en Venta'}
          </h1>
          {onCancel && (
            <CustomButton onClick={onCancel} variant="outline">
              Cancelar
            </CustomButton>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <FormProgressBar
          steps={updatedSteps}
          currentStep={currentStep}
          onStepChange={handleStepChange}
          canNavigateToStep={(stepIndex) => completedSteps.has(stepIndex) || stepIndex <= currentStep}
        />
      </div>

      {/* Current Step Content */}
      <div className="mb-8">
        {renderCurrentStep()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <CustomButton
          onClick={handlePrevious}
          disabled={currentStep === 0}
          variant="outline"
        >
          Anterior
        </CustomButton>

        <div className="flex space-x-3">
          {currentStep === formSteps.length - 1 ? (
            <CustomButton
              onClick={handleSubmit}
              loading={loading}
              className="min-w-32"
            >
              {isEditing ? 'Actualizar Propiedad' : 'Publicar Propiedad'}
            </CustomButton>
          ) : (
            <CustomButton
              onClick={handleNext}
              className="min-w-32"
            >
              Siguiente
            </CustomButton>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalePublicationForm;
