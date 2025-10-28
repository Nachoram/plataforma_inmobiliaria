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

// Interface for Property Form Data with conditional fields
interface PropertyFormData {
  // Basic fields
  type: 'venta' | 'arriendo';
  address: string;
  street: string;
  number: string;
  apartment: string;
  region: string;
  comuna: string;
  description: string;
  photos_urls: string[];

  // Property type and conditional fields
  tipo_propiedad: 'Casa' | 'Departamento' | 'Oficina' | 'Local Comercial' | 'Estacionamiento' | 'Bodega' | 'Parcela';

  // Measurement fields (conditional based on property type)
  useful_area?: number; // M² Útiles - not required for Bodega/Estacionamiento
  total_area?: number; // M² Totales - required except for Estacionamiento

  // Property features (conditional based on property type)
  bedrooms: number;
  bathrooms: number;
  parking_spots: number;
  parking_location?: string; // Only when parking_spots > 0
  has_terrace: boolean;

  // Storage-specific field
  storage_number?: string; // Only for Bodega type

  // Parcela-specific field
  parcela_number?: string; // Only for Parcela type (optional)

  // Pricing
  price: string;
  common_expenses: string;

  // Documents
  documents: {
    tax_assessment: File | null;
    ownership_certificate: File | null;
    ownership_history: File | null;
    marriage_certificate: File | null;
    power_of_attorney: File | null;
    property_plans: File | null;
    previous_contracts: File | null;
    previous_reports: File | null;
  };
}

export const PropertyForm: React.FC = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const isEditing = Boolean(id);
  const listingType = searchParams.get('type') as 'venta' | 'arriendo' || 'arriendo'; // Default to arriendo

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form data state with conditional fields
  const [formData, setFormData] = useState<PropertyFormData>({
    type: listingType,
    address: '',
    street: '',
    number: '',
    apartment: '',
    region: '',
    comuna: '',
    description: '',
    photos_urls: [] as string[],

    // Property type and conditional fields
    tipo_propiedad: '',
    useful_area: undefined,
    total_area: undefined,
    bedrooms: 1,
    bathrooms: 1,
    parking_spots: 0,
    parking_location: undefined,
    has_terrace: false,
    storage_number: undefined,
    parcela_number: undefined,

    // Pricing
    price: '',
    common_expenses: '',

    // Documents
    documents: {
      tax_assessment: null,
      ownership_certificate: null,
      ownership_history: null,
      marriage_certificate: null,
      power_of_attorney: null,
      property_plans: null,
      previous_contracts: null,
      previous_reports: null,
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
          property_images!inner (
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

        // Location fields
        region: data.address_region || '',
        comuna: data.address_commune || '',

        // Property type and conditional fields
        property_type: data.tipo_propiedad || '',
        useful_area: data.metros_utiles || undefined,
        total_area: data.metros_totales || undefined,
        bedrooms: data.bedrooms || 1,
        bathrooms: data.bathrooms || 1,
        parking_spots: data.estacionamientos || 0,
        parking_location: data.parking_location || undefined,
        has_terrace: data.tiene_terraza || false,
        storage_number: data.storage_number || data.ubicacion_bodega || undefined,
        parcela_number: data.parcela_number || undefined,

        // Pricing
        description: data.description || '',
        price: data.price_clp?.toString() || data.price?.toString() || '',
        common_expenses: data.common_expenses_clp?.toString() || data.common_expenses?.toString() || '',

        // Photos
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

  // Handle property type change with automatic field cleanup
  const handlePropertyTypeChange = (newType: string) => {
    const propertyType = newType as PropertyFormData['tipo_propiedad'];

    // Base update with new type
    const updatedData: Partial<PropertyFormData> = {
      tipo_propiedad: propertyType
    };

    // Clean up fields that should be hidden/optional for certain types
    if (propertyType === 'Bodega') {
      // For Bodega: clear fields that are not applicable
      updatedData.apartment = ''; // Departamento / Oficina
      updatedData.parking_spots = 0; // Estacionamientos
      updatedData.parking_location = undefined; // Ubicación estacionamiento
      updatedData.useful_area = undefined; // M² Útiles
      updatedData.has_terrace = false; // ¿Tiene Terraza?
      // Keep storage_number if it exists
    } else if (propertyType === 'Estacionamiento') {
      // For Estacionamiento: clear most fields
      updatedData.apartment = ''; // Departamento / Oficina
      updatedData.has_terrace = false; // ¿Tiene Terraza?
      updatedData.useful_area = undefined; // M² Útiles
      updatedData.total_area = undefined; // M² Totales
      // Keep parking_spots and parking_location
    } else if (propertyType === 'Parcela') {
      // For Parcela: clear urban-specific fields
      updatedData.apartment = ''; // Departamento / Oficina
      updatedData.has_terrace = false; // ¿Tiene Terraza?
      updatedData.parking_spots = 0; // Estacionamientos
      updatedData.parking_location = undefined; // Ubicación estacionamiento
      // Keep useful_area and total_area
    }

    // If changing FROM Bodega to another type, clear storage_number
    if (formData.property_type === 'Bodega' && propertyType !== 'Bodega') {
      updatedData.storage_number = undefined;
    }

    // If changing FROM Estacionamiento to another type, clear parking_location
    if (formData.property_type === 'Estacionamiento' && propertyType !== 'Estacionamiento') {
      updatedData.parking_location = undefined;
    }

    // If changing FROM Parcela to another type, clear parcela_number
    if (formData.property_type === 'Parcela' && propertyType !== 'Parcela') {
      updatedData.parcela_number = undefined;
    }

    setFormData(prev => ({
      ...prev,
      ...updatedData
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

  // Validation with conditional field requirements
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Basic required fields
    if (!formData.address.trim()) newErrors.address = 'La dirección es requerida';
    if (!formData.street.trim()) newErrors.street = 'La calle es requerida';
    if (!formData.number.trim()) newErrors.number = 'El número es requerido';
    if (!formData.region) newErrors.region = 'La región es requerida';
    if (!formData.comuna) newErrors.comuna = 'La comuna es requerida';
    if (!formData.price.trim()) newErrors.price = 'El precio es requerido';
    if (!formData.description.trim()) newErrors.description = 'La descripción es requerida';

    // Property type specific validation
    const isStorage = formData.property_type === 'Bodega';
    const isParking = formData.property_type === 'Estacionamiento';
    const isParcela = formData.property_type === 'Parcela';
    const requiresUsefulArea = !isStorage && !isParking && !isParcela; // Useful area required except for Bodega, Estacionamiento, and Parcela
    const requiresTotalArea = !isParking; // Total area required for all except parking

    // Storage-specific validation
    if (isStorage) {
      if (!formData.storage_number || formData.storage_number.trim() === '') {
        newErrors.storage_number = 'El número de bodega es requerido';
      }
      if (!formData.total_area || formData.total_area <= 0) {
        newErrors.total_area = 'Los M² de la bodega son requeridos y deben ser mayores a 0';
      }
    }
    // Standard property validation (Casa, Departamento, Oficina, Local Comercial)
    if (requiresUsefulArea) {
      if (!formData.useful_area || formData.useful_area <= 0) {
        newErrors.useful_area = 'Los M² Útiles son requeridos y deben ser mayores a 0';
      }
    }
    // Total area validation for all property types except parking
    if (requiresTotalArea) {
      if (!formData.total_area || formData.total_area <= 0) {
        newErrors.total_area = isParcela
          ? 'Los M² Totales del Terreno son requeridos y deben ser mayores a 0'
          : 'Los M² Totales son requeridos y deben ser mayores a 0';
      }
    }
    // Cross-validation between useful and total area (only when both are present)
    if (formData.useful_area && formData.total_area && formData.useful_area > formData.total_area) {
      newErrors.useful_area = 'Los M² Útiles no pueden ser mayores que los M² Totales';
    }

    // Parking location validation (only when parking spots exist)
    if (formData.parking_spots > 0 && (!formData.parking_location || formData.parking_location.trim() === '')) {
      newErrors.parking_location = 'La ubicación de estacionamiento es requerida cuando hay estacionamientos';
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

      // Prepare property data with conditional fields
      const isStorage = formData.property_type === 'Bodega';
      const isParking = formData.property_type === 'Estacionamiento';

      const propertyData = {
        owner_id: user.id,
        listing_type: formData.type,

        // Basic address fields
        address_street: formData.street || formData.address.split(' ')[0] || 'Sin especificar',
        address_number: formData.number || 'S/N',
        address_department: formData.apartment || null,
        address_region: formData.region,
        address_commune: formData.comuna,

        // Property type and conditional fields
        tipo_propiedad: formData.property_type,
        metros_utiles: formData.useful_area || null,
        metros_totales: formData.total_area || null,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        estacionamientos: formData.parking_spots,
        parking_location: formData.parking_location || null,
        tiene_terraza: formData.has_terrace,
        storage_number: formData.storage_number || null,
        ubicacion_bodega: formData.storage_number || null, // Legacy field
        parcela_number: formData.parcela_number || null,

        // Pricing and description
        description: formData.description || 'Sin descripción',
        price_clp: parseInt(formData.price),
        common_expenses_clp: formData.common_expenses ? parseInt(formData.common_expenses) : 0,

        // Status
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

              {/* Fila 5: Tipo de Propiedad */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tipo de Propiedad *
                </label>
                <select
                  required
                  value={formData.property_type}
                  onChange={(e) => handlePropertyTypeChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">Seleccionar tipo</option>
                  <option value="Casa">Casa</option>
                  <option value="Departamento">Departamento</option>
                  <option value="Oficina">Oficina</option>
                  <option value="Local Comercial">Local Comercial</option>
                  <option value="Estacionamiento">Estacionamiento</option>
                  <option value="Bodega">Bodega</option>
                  <option value="Parcela">Parcela</option>
                </select>
              </div>

              {/* Conditional fields based on property type */}
              {(() => {
                const isStorage = formData.property_type === 'Bodega';
                const isParking = formData.property_type === 'Estacionamiento';
                const isParcela = formData.property_type === 'Parcela';
                const showStandardFields = !isStorage && !isParking && !isParcela;
                const requiresUsefulArea = !isStorage && !isParking;

                return (
                  <>
                    {/* Campo específico: Número de Bodega - SOLO PARA BODEGA */}
                    {isStorage && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 transition-all duration-300">
                        <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
                          <span className="mr-2">📦</span>
                          Información de la Bodega
                        </h3>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Número de Bodega *
                          </label>
                          <input
                            type="text"
                            value={formData.storage_number || ''}
                            onChange={(e) => setFormData({...formData, storage_number: e.target.value})}
                            placeholder="Ej: B-115 (piso -1)"
                            maxLength={50}
                            required={isStorage}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                              errors.storage_number ? 'border-red-500 bg-red-50' : 'border-gray-300'
                            }`}
                          />
                          {errors.storage_number && (
                            <p className="mt-1 text-sm text-red-600 flex items-center">
                              <AlertCircle className="h-4 w-4 mr-1" />
                              {errors.storage_number}
                            </p>
                          )}
                          <p className="mt-2 text-xs text-gray-600">
                            Ingrese el número o ubicación específica de la bodega
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Campo específico: Número de Parcela - SOLO PARA PARCELA */}
                    {isParcela && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 transition-all duration-300">
                        <h3 className="text-sm font-semibold text-green-900 mb-3 flex items-center">
                          <span className="mr-2">🏡</span>
                          Información de la Parcela
                        </h3>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Número de Parcela (Opcional)
                          </label>
                          <input
                            type="text"
                            value={formData.parcela_number || ''}
                            onChange={(e) => setFormData({...formData, parcela_number: e.target.value})}
                            placeholder="Ej: Parcela 21"
                            maxLength={30}
                            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                          />
                          <p className="mt-2 text-xs text-green-700">
                            Indique el número o ubicación de la parcela si aplica
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Campo: Departamento / Oficina - OCULTAR PARA BODEGA, ESTACIONAMIENTO Y PARCELA */}
                    {showStandardFields && (
                      <div className="transition-all duration-300">
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
                    )}

                    {/* Campos de área condicionales */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Campo: M² Útiles - OCULTAR PARA BODEGA Y ESTACIONAMIENTO */}
                      {requiresUsefulArea && (
                        <div className="transition-all duration-300">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            M² Útiles {isParcela ? '(Opcional)' : '*'}
                          </label>
                          <input
                            type="number"
                            value={formData.useful_area || ''}
                            onChange={(e) => setFormData({...formData, useful_area: parseFloat(e.target.value) || undefined})}
                            placeholder="Ej: 45.5"
                            min="0"
                            step="0.1"
                            required={requiresUsefulArea && !isParcela}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                              errors.useful_area ? 'border-red-500 bg-red-50' : 'border-gray-300'
                            }`}
                          />
                          {errors.useful_area && (
                            <p className="mt-1 text-sm text-red-600 flex items-center">
                              <AlertCircle className="h-4 w-4 mr-1" />
                              {errors.useful_area}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-gray-500">
                            Superficie útil de la propiedad en metros cuadrados
                          </p>
                        </div>
                      )}

                      {/* Campo: M² Totales / M² de la Bodega - VISIBLE PARA TODOS EXCEPTO ESTACIONAMIENTO */}
                      {!isParking && (
                        <div className="transition-all duration-300">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            {isStorage ? 'M² de la Bodega' : isParcela ? 'M² Totales del Terreno' : 'M² Totales'} *
                          </label>
                          <input
                            type="number"
                            value={formData.total_area || ''}
                            onChange={(e) => setFormData({...formData, total_area: parseFloat(e.target.value) || undefined})}
                            placeholder={isStorage ? "Ej: 8.5" : "Ej: 55.0"}
                            min="0"
                            step="0.1"
                            required={!isParking}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                              errors.total_area ? 'border-red-500 bg-red-50' : 'border-gray-300'
                            }`}
                          />
                          {errors.total_area && (
                            <p className="mt-1 text-sm text-red-600 flex items-center">
                              <AlertCircle className="h-4 w-4 mr-1" />
                              {errors.total_area}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-gray-500">
                            {isStorage
                              ? 'Superficie de la bodega en metros cuadrados'
                              : 'Superficie total incluyendo áreas comunes'
                            }
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Campos estándar: Dormitorios, Baños, Estacionamientos - OCULTAR PARA BODEGA Y ESTACIONAMIENTO */}
                    {showStandardFields && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Dormitorios *
                            </label>
                            <select
                              required
                              value={formData.bedrooms}
                              onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value) })}
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
                              onChange={(e) => setFormData({ ...formData, bathrooms: parseInt(e.target.value) })}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            >
                              {[1, 2, 3, 4, 5, 6].map(num => (
                                <option key={num} value={num}>{num}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Estacionamientos
                            </label>
                            <input
                              type="number"
                              value={formData.parking_spots}
                              onChange={(e) => setFormData({...formData, parking_spots: parseInt(e.target.value) || 0})}
                              placeholder="Ej: 1"
                              min="0"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                              Número de estacionamientos incluidos
                            </p>
                          </div>
                        </div>

                        {/* Campo: Ubicación Estacionamiento - SOLO CUANDO HAY ESTACIONAMIENTOS */}
                        {formData.parking_spots > 0 && (
                          <div className="transition-all duration-300">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Ubicación/Nº Estacionamiento(s) *
                            </label>
                            <input
                              type="text"
                              value={formData.parking_location || ''}
                              onChange={(e) => setFormData({...formData, parking_location: e.target.value})}
                              placeholder="Ej: E-23, E-24"
                              maxLength={100}
                              required={formData.parking_spots > 0}
                              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                                errors.parking_location ? 'border-red-500 bg-red-50' : 'border-gray-300'
                              }`}
                            />
                            {errors.parking_location && (
                              <p className="mt-1 text-sm text-red-600 flex items-center">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                {errors.parking_location}
                              </p>
                            )}
                            <p className="mt-1 text-xs text-gray-500">
                              Número(s) o ubicación de los estacionamientos
                            </p>
                          </div>
                        )}

                        {/* Campo: ¿Tiene Terraza? - OCULTAR PARA BODEGA, ESTACIONAMIENTO, OFICINA Y PARCELA */}
                        {formData.property_type !== 'Oficina' && !isParcela && (
                          <div className="transition-all duration-300">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              ¿Tiene Terraza?
                            </label>
                            <select
                              value={formData.has_terrace ? 'Sí' : 'No'}
                              onChange={(e) => setFormData({...formData, has_terrace: e.target.value === 'Sí'})}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            >
                              <option value="No">No</option>
                              <option value="Sí">Sí</option>
                            </select>
                          </div>
                        )}
                      </>
                    )}

                    {/* Mensaje informativo para Estacionamiento */}
                    {isParking && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 transition-all duration-300">
                        <h3 className="text-sm font-semibold text-amber-900 mb-2 flex items-center">
                          <span className="mr-2">🚗</span>
                          Información del Estacionamiento
                        </h3>
                        <p className="text-xs text-amber-700">
                          Para estacionamientos no se requieren datos de superficie ni unidad.
                          Complete los demás campos del formulario.
                        </p>
                      </div>
                    )}

                    {/* Fila: Precio y Gastos Comunes */}
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
                            placeholder={isStorage ? "50000" : "1000000"}
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
                  </>
                );
              })()}
            </div>
          </div>

              {/* Fila 7: Descripción */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Descripción {formData.property_type === 'Bodega' && '(Opcional)'}
                </label>
                <textarea
                  rows={4}
                  required={formData.property_type !== 'Bodega'}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.description ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder={
                    formData.property_type === 'Bodega'
                      ? "Ej: Bodega amplia en subterráneo, acceso por ascensor, ideal para almacenamiento"
                      : "Describe las características principales de la propiedad, ubicación, amenidades, etc."
                  }
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.description}
                  </p>
                )}
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
                <span>
                  {isEditing
                    ? 'Actualizar Propiedad'
                    : formData.property_type === 'Bodega'
                      ? 'Publicar Bodega en Arriendo'
                      : 'Publicar Propiedad'
                  }
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};