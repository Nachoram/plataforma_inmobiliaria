import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, X, FileText, Image, Check, AlertCircle, Loader2,
  Building, MapPin, Car, DollarSign, User, Calendar, Home, CheckCircle
} from 'lucide-react';
import { supabase, Property } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import ParkingSpaceForm, { ParkingSpace } from './ParkingSpaceForm';
import StorageSpaceForm, { StorageSpace } from './StorageSpaceForm';
import ProprietariosStep from './ProprietariosStep';
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

// Import OwnerData from ProprietariosStep
import { OwnerData } from './ProprietariosStep';

// Lista de nacionalidades disponibles
const NACIONALITIES = [
  'Chilena',
  'Argentina',
  'Peruana',
  'Colombiana',
  'Venezolana',
  'Ecuatoriana',
  'Boliviana',
  'Uruguaya',
  'Paraguaya',
  'Brasileña',
  'Mexicana',
  'Española',
  'Estadounidense',
  'Canadiense',
  'Otra'
];

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
  parcela_number: string;

  // Amenities
  sistemaAguaCaliente: string;
  tipoCocina: string;

  // Owner Address
  owner_address_street: string;
  owner_address_number: string;
  owner_region: string;
  owner_commune: string;
  owner_unit_type: string;
  owner_apartment_number: string;

  // Images
  property_images: File[];

  // Parking Spaces
  parkingSpaces: ParkingSpace[];

  // Storage Spaces
  storageSpaces: StorageSpace[];

  // Owners
  owners: OwnerData[];

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

  const [loading, setLoading] = useState(false);
  const [adminMode, setAdminMode] = useState(false);

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
    parcela_number: initialData?.parcela_number || '',

    sistemaAguaCaliente: initialData?.sistema_agua_caliente || '',
    tipoCocina: initialData?.tipo_cocina || '',


    property_images: [] as File[],
    parkingSpaces: [] as ParkingSpace[],
    storageSpaces: [] as StorageSpace[],
    owners: [
      {
        id: 'owner-1',
        type: 'natural',
        address: {
          type: 'casa',
          street: '',
          number: '',
          unit: null,
          city: '',
          region: '',
          postal_code: null
        },
        natural: {
          name: '',
          rut: '',
          email: '',
          phone: '',
          ownership_percentage: 100
        }
      }
    ] as OwnerData[],
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

  // Validation
  const validateForm = () => {
    const errors: Record<string, string> = {};

    // Basic validations
        if (!formData.address_street.trim()) errors.address_street = 'Calle es requerida';
        if (!formData.address_number.trim()) errors.address_number = 'Número es requerido';
        if (!formData.region) errors.region = 'Región es requerida';
        if (!formData.commune) errors.commune = 'Comuna es requerida';
    if (!formData.price || parseInt(formData.price) <= 0) errors.price = 'Precio válido es requerido';
        if (!formData.metrosTotales || parseFloat(formData.metrosTotales) <= 0) {
          errors.metrosTotales = 'Superficie total es requerida';
        }
    if (!formData.description.trim()) errors.description = 'Descripción es requerida';

    // Owner validations
    if (!formData.owners || formData.owners.length === 0) {
      errors.owners = 'Al menos un propietario es requerido';
    } else {
      // Validate each owner
      let totalPercentage = 0;

      formData.owners.forEach((owner, index) => {
        const prefix = formData.owners.length > 1 ? `Propietario ${index + 1}: ` : '';

        if (owner.type === 'natural' && owner.natural) {
          if (!owner.natural.name.trim()) errors[`owner_${index}_name`] = `${prefix}Nombre completo es requerido`;
          if (!owner.natural.rut.trim()) errors[`owner_${index}_rut`] = `${prefix}RUT es requerido`;
          if (!owner.natural.email.trim()) errors[`owner_${index}_email`] = `${prefix}Email es requerido`;
          if (!owner.natural.phone.trim()) errors[`owner_${index}_phone`] = `${prefix}Teléfono es requerido`;
          if (!owner.natural.ownership_percentage || owner.natural.ownership_percentage <= 0 || owner.natural.ownership_percentage > 100) {
            errors[`owner_${index}_percentage`] = `${prefix}Porcentaje debe ser entre 1 y 100`;
          }

          totalPercentage += owner.natural.ownership_percentage;
        } else if (owner.type === 'juridica' && owner.juridica) {
          if (!owner.juridica.company_name.trim()) errors[`owner_${index}_company_name`] = `${prefix}Razón social es requerida`;
          if (!owner.juridica.company_rut.trim()) errors[`owner_${index}_company_rut`] = `${prefix}RUT empresa es requerido`;
          if (!owner.juridica.email.trim()) errors[`owner_${index}_company_email`] = `${prefix}Email empresa es requerido`;
          if (!owner.juridica.phone.trim()) errors[`owner_${index}_company_phone`] = `${prefix}Teléfono empresa es requerido`;
          if (!owner.juridica.legal_representative.name.trim()) errors[`owner_${index}_rep_name`] = `${prefix}Nombre del representante es requerido`;
          if (!owner.juridica.legal_representative.rut.trim()) errors[`owner_${index}_rep_rut`] = `${prefix}RUT del representante es requerido`;
          if (!owner.juridica.ownership_percentage || owner.juridica.ownership_percentage <= 0 || owner.juridica.ownership_percentage > 100) {
            errors[`owner_${index}_percentage`] = `${prefix}Porcentaje debe ser entre 1 y 100`;
          }

          totalPercentage += owner.juridica.ownership_percentage;
        }

        // Validate address (common for both types)
        if (!owner.address.street.trim()) errors[`owner_${index}_street`] = `${prefix}Calle es requerida`;
        if (!owner.address.number.trim()) errors[`owner_${index}_number`] = `${prefix}Número es requerido`;
        if (!owner.address.city.trim()) errors[`owner_${index}_city`] = `${prefix}Ciudad es requerida`;
        if (!owner.address.region.trim()) errors[`owner_${index}_region`] = `${prefix}Región es requerida`;
      });

      // Validate total percentage
      if (totalPercentage !== 100) {
        errors.ownership_percentage_total = 'La suma de porcentajes de propiedad debe ser exactamente 100%';
      }
    }

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Complete todos los campos requeridos antes de publicar');
      return;
    }

    try {
      setLoading(true);

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
        parcela_number: formData.parcela_number || null,
        sistema_agua_caliente: formData.sistemaAguaCaliente || null,
        tipo_cocina: formData.tipoCocina || null,
        description: `${formData.title}\n\n${formData.description}`,
        owners: formData.owners,
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

      // Handle storage spaces
      if (formData.storageSpaces.length > 0) {
        await saveStorageSpaces(propertyId, formData.storageSpaces);
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

  const saveStorageSpaces = async (propertyId: string, storageSpaces: StorageSpace[]) => {
    // Save storage spaces to a storage_spaces table (to be created)
    // For now, we'll store this information in the property metadata
    const storageData = {
      storage_spaces: storageSpaces
    };

    await supabase
      .from('properties')
      .update({ storage_spaces: storageData })
      .eq('id', propertyId);
  };


  return (
    <>
    <div className="space-y-6">
        {/* Street and Number */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Calle *
            </label>
            <input
              type="text"
              value={formData.address_street}
              onChange={(e) => updateFormData({ address_street: e.target.value })}
              placeholder="Ej: Avenida Providencia"
              className="w-full px-3 py-2 text-sm min-h-[100px] border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="w-full px-3 py-2 text-sm min-h-[100px] border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            className="w-full px-3 py-2 text-sm min-h-[100px] border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Region and Commune */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Región *
            </label>
            <select
              value={formData.region}
              onChange={(e) => updateFormData({ region: e.target.value, commune: '' })}
              className="w-full px-3 py-2 text-sm min-h-[100px] border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
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

      <div className="px-6 space-y-6">
        {/* Sección 1: Información de la Propiedad */}
        <div className="bg-white border-2 border-green-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Building className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Información de la Propiedad</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tipo de Propiedad */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                      parcela_number: ''
                    });
                  }
                }}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
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

            {/* Calle */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Calle *
              </label>
              <input
                type="text"
                value={formData.address_street}
                onChange={(e) => updateFormData({ address_street: e.target.value })}
                placeholder="Ej: Avenida Providencia"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* Número */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Número *
              </label>
              <input
                type="text"
                value={formData.address_number}
                onChange={(e) => updateFormData({ address_number: e.target.value })}
                placeholder="123"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* Departamento/Oficina */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Departamento/Oficina (Opcional)
              </label>
              <input
                type="text"
                value={formData.address_department}
                onChange={(e) => updateFormData({ address_department: e.target.value })}
                placeholder="Ej: 401"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* Región */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Región *
              </label>
              <select
                value={formData.region}
                onChange={(e) => updateFormData({ region: e.target.value, commune: '' })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Seleccionar región</option>
                {Object.entries(CHILE_REGIONS_COMMUNES).map(([key, region]) => (
                  <option key={key} value={key}>
                    {region.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Comuna */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Comuna *
              </label>
              <select
                value={formData.commune}
                onChange={(e) => updateFormData({ commune: e.target.value })}
                disabled={!formData.region}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
              >
                <option value="">Seleccionar comuna</option>
                {formData.region && getAvailableCommunes(formData.region).map(commune => (
                  <option key={commune} value={commune}>
                    {commune}
                  </option>
                ))}
              </select>
            </div>

            {/* Precio de Venta */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Precio de Venta (CLP) *
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => updateFormData({ price: e.target.value })}
                placeholder="150000000"
                min="0"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* M² Útiles */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                M² Útiles
              </label>
              <input
                type="number"
                value={formData.metrosUtiles}
                onChange={(e) => updateFormData({ metrosUtiles: e.target.value })}
                placeholder="100"
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* M² Totales */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                M² Totales *
              </label>
              <input
                type="number"
                value={formData.metrosTotales}
                onChange={(e) => updateFormData({ metrosTotales: e.target.value })}
                placeholder="120"
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* Año de Construcción */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Año de Construcción
              </label>
              <input
                type="number"
                value={formData.anoConstruccion}
                onChange={(e) => updateFormData({ anoConstruccion: e.target.value })}
                placeholder="2020"
                min="1900"
                max={new Date().getFullYear()}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* Descripción */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Descripción *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateFormData({ description: e.target.value })}
                rows={4}
                placeholder="Describe detalladamente la propiedad, sus características principales, ubicación, etc."
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
        </div>

        {/* Sección 2: Datos del Propietario */}
        <ProprietariosStep
          owners={formData.owners}
          onChange={(owners) => updateFormData({ owners })}
        />


        {/* Sección 4: Fotos de la Propiedad */}
        <div className="bg-white border-2 border-orange-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Image className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Fotos de la Propiedad (Opcional)</h2>
          </div>

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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
        </div>

        {/* Sección 4: Documentos para Estudio de Título */}
        <div className="bg-white border-2 border-yellow-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Documentos para Estudio de Título</h2>
              <p className="text-sm text-gray-600">Documentos requeridos por ley para formalizar la compraventa</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* GRUPO 1: Documentos del Propietario */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">Documentos del Propietario</h3>

              <div className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Cédula de Identidad (fotocopia)</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      REQUERIDO
                    </span>
                    <CustomButton size="sm" variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Subir
                    </CustomButton>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Certificado de Matrimonio/Soltería</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      REQUERIDO
                    </span>
                    <CustomButton size="sm" variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Subir
                    </CustomButton>
                  </div>
                </div>
              </div>
            </div>

            {/* GRUPO 2: Documentos del Conservador de Bienes Raíces */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">Conservador de Bienes Raíces</h3>

              <div className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Certificado de Dominio Vigente</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      REQUERIDO
                    </span>
                    <CustomButton size="sm" variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Subir
                    </CustomButton>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Certificado de Hipotecas y Gravámenes</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      REQUERIDO
                    </span>
                    <CustomButton size="sm" variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Subir
                    </CustomButton>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Inscripciones de Dominio (últimos 10 años)</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      REQUERIDO
                    </span>
                    <CustomButton size="sm" variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Subir
                    </CustomButton>
                  </div>
                </div>
              </div>
            </div>

            {/* GRUPO 3: Documentos del SII */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">Servicio de Impuestos Internos (SII)</h3>

              <div className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Certificado de Avalúo Fiscal</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      REQUERIDO
                    </span>
                    <CustomButton size="sm" variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Subir
                    </CustomButton>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Certificado de Contribuciones Pagadas</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      REQUERIDO
                    </span>
                    <CustomButton size="sm" variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Subir
                    </CustomButton>
                  </div>
                </div>
              </div>
            </div>

            {/* GRUPO 4: Documentos Municipales */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">Documentos Municipales</h3>

              <div className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Certificado de Recepción Final</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      REQUERIDO
                    </span>
                    <CustomButton size="sm" variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Subir
                    </CustomButton>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Certificado de No Expropiación (Municipal)</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      REQUERIDO
                    </span>
                    <CustomButton size="sm" variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Subir
                    </CustomButton>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Certificado de Número Municipal</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      REQUERIDO
                    </span>
                    <CustomButton size="sm" variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Subir
                    </CustomButton>
                  </div>
                </div>
              </div>
            </div>

            {/* GRUPO 5: Otros Documentos (Condicional) */}
            <div className="md:col-span-2 space-y-3">
              <h3 className="font-semibold text-gray-800">Otros Documentos (Condicional)</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Reglamento de Copropiedad</h4>
                      <p className="text-xs text-gray-600">Si es departamento/condominio</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        OPCIONAL
                      </span>
                      <CustomButton size="sm" variant="outline">
                        <Upload className="h-4 w-4 mr-2" />
                        Subir
                      </CustomButton>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Certificado de No Expropiación (SERVIU)</h4>
                      <p className="text-xs text-gray-600">Recomendado</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        RECOMENDADO
                      </span>
                      <CustomButton size="sm" variant="outline">
                        <Upload className="h-4 w-4 mr-2" />
                        Subir
                      </CustomButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botones Finales */}
      <div className="flex justify-center gap-4 mt-8 px-6">
        <CustomButton
          onClick={onCancel}
          variant="outline"
          className="px-8 py-3 border-2 border-gray-300 text-gray-700 bg-white rounded-full font-medium hover:bg-gray-50"
        >
          Cancelar
        </CustomButton>
        <CustomButton
          onClick={handleSubmit}
          loading={loading}
          className="px-8 py-3 bg-green-600 text-white rounded-full font-medium hover:bg-green-700"
        >
          {isEditing ? 'Actualizar Propiedad' : 'Publicar Propiedad'}
        </CustomButton>
      </div>

  return (
    <div className="max-w-4xl mx-auto publication-form">
      {/* Header */}
      <div className="bg-blue-600 text-white py-6 mb-8">
        <div className="px-6">
        <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                Publicar Propiedad en Venta
            </h1>
              <p className="text-blue-100 mt-1">
                Completa todos los campos para publicar tu propiedad en venta
              </p>
            </div>
            {adminMode && (
              <div className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                Modo Administrador
              </div>
            )}
          </div>
          </div>
        </div>

      {/* Admin Mode Warning */}
        {adminMode && (
        <div className="mb-6 px-6">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-400 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800">
                  Modo Administrador Activado
                </h4>
                <p className="text-sm text-yellow-700">
                  Puedes navegar por todos los pasos sin completar campos obligatorios.
                  Las validaciones están desactivadas para facilitar el desarrollo y testing.
                </p>
              </div>
              </div>
            </div>
          </div>
        )}

      {/* Form Content */}
      <div className="px-6 space-y-6">
        {/* Sección 1: Información de la Propiedad */}
        <div className="bg-white border-2 border-green-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Building className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Información de la Propiedad</h2>
      </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tipo de Propiedad */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                      parcela_number: ''
                    });
                  }
                }}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
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

            {/* Calle */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Calle *
              </label>
              <input
                type="text"
                value={formData.address_street}
                onChange={(e) => updateFormData({ address_street: e.target.value })}
                placeholder="Ej: Avenida Providencia"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

            {/* Número */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Número *
              </label>
              <input
                type="text"
                value={formData.address_number}
                onChange={(e) => updateFormData({ address_number: e.target.value })}
                placeholder="123"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

            {/* Departamento/Oficina */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Departamento/Oficina (Opcional)
              </label>
              <input
                type="text"
                value={formData.address_department}
                onChange={(e) => updateFormData({ address_department: e.target.value })}
                placeholder="Ej: 401"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
      </div>

            {/* Región */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Región *
              </label>
              <select
                value={formData.region}
                onChange={(e) => updateFormData({ region: e.target.value, commune: '' })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Seleccionar región</option>
                {Object.entries(CHILE_REGIONS_COMMUNES).map(([key, region]) => (
                  <option key={key} value={key}>
                    {region.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Comuna */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Comuna *
              </label>
              <select
                value={formData.commune}
                onChange={(e) => updateFormData({ commune: e.target.value })}
                disabled={!formData.region}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
              >
                <option value="">Seleccionar comuna</option>
                {formData.region && getAvailableCommunes(formData.region).map(commune => (
                  <option key={commune} value={commune}>
                    {commune}
                  </option>
                ))}
              </select>
            </div>

            {/* Precio de Venta */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Precio de Venta (CLP) *
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => updateFormData({ price: e.target.value })}
                placeholder="150000000"
                min="0"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* M² Útiles */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                M² Útiles
              </label>
              <input
                type="number"
                value={formData.metrosUtiles}
                onChange={(e) => updateFormData({ metrosUtiles: e.target.value })}
                placeholder="100"
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* M² Totales */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                M² Totales *
              </label>
              <input
                type="number"
                value={formData.metrosTotales}
                onChange={(e) => updateFormData({ metrosTotales: e.target.value })}
                placeholder="120"
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* Año de Construcción */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Año de Construcción
              </label>
              <input
                type="number"
                value={formData.anoConstruccion}
                onChange={(e) => updateFormData({ anoConstruccion: e.target.value })}
                placeholder="2020"
                min="1900"
                max={new Date().getFullYear()}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* Descripción */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Descripción *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateFormData({ description: e.target.value })}
                rows={4}
                placeholder="Describe detalladamente la propiedad, sus características principales, ubicación, etc."
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
        </div>

        {/* Sección 3: Dirección del Propietario */}
        <div className="bg-white border-2 border-purple-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Dirección del Propietario</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Calle del Propietario *
              </label>
              <input
                type="text"
                value={formData.owner_address_street || ''}
                onChange={(e) => updateFormData({ owner_address_street: e.target.value })}
                placeholder="Ej: Avenida Providencia"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Número del Propietario *
              </label>
              <input
                type="text"
                value={formData.owner_address_number || ''}
                onChange={(e) => updateFormData({ owner_address_number: e.target.value })}
                placeholder="123"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tipo de Unidad *
              </label>
              <select
                value={formData.owner_unit_type || 'Casa'}
                onChange={(e) => updateFormData({ owner_unit_type: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="Casa">Casa</option>
                <option value="Departamento">Departamento</option>
                <option value="Oficina">Oficina</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                N° Depto/Casa/Oficina
              </label>
              <input
                type="text"
                value={formData.owner_apartment_number || ''}
                onChange={(e) => updateFormData({ owner_apartment_number: e.target.value })}
                placeholder="Ej: 401"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Región del Propietario *
              </label>
              <select
                value={formData.owner_region || ''}
                onChange={(e) => updateFormData({ owner_region: e.target.value, owner_commune: '' })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Comuna del Propietario *
              </label>
              <select
                value={formData.owner_commune || ''}
                onChange={(e) => updateFormData({ owner_commune: e.target.value })}
                disabled={!formData.owner_region}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100"
              >
                <option value="">Seleccionar comuna</option>
                {formData.owner_region && getAvailableCommunes(formData.owner_region).map(commune => (
                  <option key={commune} value={commune}>
                    {commune}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Sección 3: Fotos de la Propiedad */}
        <div className="bg-white border-2 border-orange-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Image className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Fotos de la Propiedad (Opcional)</h2>
          </div>

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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
        </div>

        {/* Sección 4: Documentos para Estudio de Título */}
        <div className="bg-white border-2 border-yellow-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Documentos para Estudio de Título</h2>
              <p className="text-sm text-gray-600">Documentos requeridos por ley para formalizar la compraventa</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* GRUPO 1: Documentos del Propietario */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">Documentos del Propietario</h3>

              <div className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Cédula de Identidad (fotocopia)</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      REQUERIDO
                    </span>
                    <CustomButton size="sm" variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Subir
                    </CustomButton>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Certificado de Matrimonio/Soltería</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      REQUERIDO
                    </span>
                    <CustomButton size="sm" variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Subir
                    </CustomButton>
                  </div>
                </div>
              </div>
            </div>

            {/* GRUPO 2: Documentos del Conservador de Bienes Raíces */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">Conservador de Bienes Raíces</h3>

              <div className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Certificado de Dominio Vigente</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      REQUERIDO
                    </span>
                    <CustomButton size="sm" variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Subir
                    </CustomButton>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Certificado de Hipotecas y Gravámenes</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      REQUERIDO
                    </span>
                    <CustomButton size="sm" variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Subir
                    </CustomButton>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Inscripciones de Dominio (últimos 10 años)</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      REQUERIDO
                    </span>
                    <CustomButton size="sm" variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Subir
                    </CustomButton>
                  </div>
                </div>
              </div>
            </div>

            {/* GRUPO 3: Documentos del SII */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">Servicio de Impuestos Internos (SII)</h3>

              <div className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Certificado de Avalúo Fiscal</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      REQUERIDO
                    </span>
                    <CustomButton size="sm" variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Subir
                    </CustomButton>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Certificado de Contribuciones Pagadas</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      REQUERIDO
                    </span>
                    <CustomButton size="sm" variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Subir
                    </CustomButton>
                  </div>
                </div>
              </div>
            </div>

            {/* GRUPO 4: Documentos Municipales */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">Documentos Municipales</h3>

              <div className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Certificado de Recepción Final</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      REQUERIDO
                    </span>
                    <CustomButton size="sm" variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Subir
                    </CustomButton>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Certificado de No Expropiación (Municipal)</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      REQUERIDO
                    </span>
                    <CustomButton size="sm" variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Subir
                    </CustomButton>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Certificado de Número Municipal</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      REQUERIDO
                    </span>
                    <CustomButton size="sm" variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Subir
                    </CustomButton>
                  </div>
                </div>
              </div>
            </div>

            {/* GRUPO 5: Otros Documentos (Condicional) */}
            <div className="md:col-span-2 space-y-3">
              <h3 className="font-semibold text-gray-800">Otros Documentos (Condicional)</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Reglamento de Copropiedad</h4>
                      <p className="text-xs text-gray-600">Si es departamento/condominio</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        OPCIONAL
                      </span>
                      <CustomButton size="sm" variant="outline">
                        <Upload className="h-4 w-4 mr-2" />
                        Subir
                      </CustomButton>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Certificado de No Expropiación (SERVIU)</h4>
                      <p className="text-xs text-gray-600">Recomendado</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        RECOMENDADO
                      </span>
                      <CustomButton size="sm" variant="outline">
                        <Upload className="h-4 w-4 mr-2" />
                        Subir
                      </CustomButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botones Finales */}
      <div className="flex justify-center gap-4 mt-8 px-6">
        <CustomButton
          onClick={onCancel}
          variant="outline"
          className="px-8 py-3 border-2 border-gray-300 text-gray-700 bg-white rounded-full font-medium hover:bg-gray-50"
        >
          Cancelar
        </CustomButton>
        <CustomButton
          onClick={handleSubmit}
          loading={loading}
          className="px-8 py-3 bg-green-600 text-white rounded-full font-medium hover:bg-green-700"
        >
          {isEditing ? 'Actualizar Propiedad' : 'Publicar Propiedad'}
        </CustomButton>
      </div>

    </div>
    </>
  );
};

export default SalePublicationForm;
