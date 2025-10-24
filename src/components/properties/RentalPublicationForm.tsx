import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, FileText, Image, Check, AlertCircle, Loader2, Building } from 'lucide-react';
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
  }
};

interface RentalPublicationFormProps {
  initialData?: Property;
  isEditing?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const RentalPublicationForm: React.FC<RentalPublicationFormProps> = ({
  initialData,
  isEditing = false,
  onSuccess,
  onCancel
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  console.log('🏗️ RENTAL FORM: Component rendered - isEditing:', isEditing, 'initialData exists:', !!initialData);
  console.log('🏗️ RENTAL FORM: initialData content:', initialData);

  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(isEditing);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Función para inicializar formData
  const getInitialFormData = useMemo(() => {
    console.log('🎯 GET INITIAL FORM DATA: isEditing:', isEditing, 'initialData:', !!initialData);

    if (isEditing && initialData) {
      console.log('🎯 GET INITIAL FORM DATA: Using initialData for editing');
      console.log('🎯 GET INITIAL FORM DATA: propiedad_amenidades:', initialData.propiedad_amenidades);
      console.log('🎯 GET INITIAL FORM DATA: documents:', initialData.documents);

      // Función helper para convertir boolean a Sí/No con null check
      const boolToYesNo = (value: boolean | null | undefined): string => {
        if (value === null || value === undefined) return 'No';
        return value ? 'Sí' : 'No';
      };

      // Función helper para convertir number a string con null check
      const numberToString = (value: number | null | undefined, defaultValue: string = ''): string => {
        if (value === null || value === undefined) return defaultValue;
        return value.toString();
      };

      const formData = {
        // Información de la Propiedad
        tipoPropiedad: initialData.property_type || '',
        address_street: initialData.address_street || '',
        address_number: initialData.address_number || '',
        address_department: initialData.address_department || '',
        region: initialData.address_region || '',
        commune: initialData.address_commune || '',
        price: numberToString(initialData.price_clp, ''),
        common_expenses: numberToString(initialData.common_expenses_clp, ''),
        bedrooms: numberToString(initialData.bedrooms, '1'),
        bathrooms: numberToString(initialData.bathrooms, '1'),
        estacionamientos: numberToString(initialData.estacionamientos, '0'),
        metrosUtiles: numberToString(initialData.metros_utiles, ''),
        metrosTotales: numberToString(initialData.metros_totales, ''),
        tieneTerraza: boolToYesNo(initialData.tiene_terraza),
        anoConstruccion: numberToString(initialData.ano_construccion, ''),
        description: initialData.description || '',

        // Características Internas
        sistemaAguaCaliente: initialData.sistema_agua_caliente || 'Calefón',
        tipoCocina: initialData.tipo_cocina || 'Cerrada',
        tieneSalaEstar: boolToYesNo(initialData.tiene_sala_estar),

        // Campos condicionales - SIEMPRE inicializar con datos existentes
        tieneBodega: boolToYesNo(initialData.tiene_bodega),
        metrosBodega: numberToString(initialData.metros_bodega, ''),
        ubicacionBodega: '', // Este campo no existe en BD, mantener vacío
        ubicacionEstacionamiento: initialData.parking_location || '',
        numeroBodega: initialData.storage_number || '',
        parcela_number: initialData.parcela_number || '',

        // Amenidades - Cargar desde propiedad_amenidades
        amenidades: initialData.propiedad_amenidades
          ? initialData.propiedad_amenidades.map(pa => pa.amenidades.nombre)
          : [],

        // Datos del Propietario - TODOS los campos con fallbacks robustos
        owner_type: initialData.owner_type || 'natural',
        owner_first_name: initialData.owner_first_name || '',
        owner_paternal_last_name: initialData.owner_paternal_last_name || '',
        owner_maternal_last_name: initialData.owner_maternal_last_name || '',
        owner_rut: initialData.owner_rut || '',
        owner_email: initialData.owner_email || '',
        owner_phone: initialData.owner_phone || '',
        owner_company_name: initialData.owner_company_name || '',
        owner_company_rut: initialData.owner_company_rut || '',
        owner_company_business: initialData.owner_company_business || '',
        owner_company_email: initialData.owner_company_email || '',
        owner_company_phone: initialData.owner_company_phone || '',
        owner_representative_first_name: initialData.owner_representative_first_name || '',
        owner_representative_paternal_last_name: initialData.owner_representative_paternal_last_name || '',
        owner_representative_maternal_last_name: initialData.owner_representative_maternal_last_name || '',
        owner_representative_rut: initialData.owner_representative_rut || '',
        owner_representative_email: initialData.owner_representative_email || '',
        owner_representative_phone: initialData.owner_representative_phone || '',

        // Campos de dirección del propietario (no se usan en edición)
        owner_address_street: '',
        owner_address_number: '',
        owner_region: '',
        owner_commune: '',
        marital_status: '',
        property_regime: '',

        // Arrays - inicializar vacíos, se manejarán por separado
        photos_urls: [],
        availableDays: [],
        availableTimeSlots: [],

        // Documentos - inicializar con documentos existentes o array vacío
      documents: initialData.documents || [],
      };

      console.log('✅ GET INITIAL FORM DATA: Final initialized formData:', {
        tipoPropiedad: formData.tipoPropiedad,
        address_street: formData.address_street,
        price: formData.price,
        bedrooms: formData.bedrooms,
        tieneBodega: formData.tieneBodega,
        numeroBodega: formData.numeroBodega,
        owner_type: formData.owner_type,
        amenidades: formData.amenidades,
        documents: formData.documents
      });

      return formData;
    }

    console.log('🎯 GET INITIAL FORM DATA: Using default values for new property');
    // Valores por defecto para nueva propiedad
    return {
      // Información de la Propiedad
      tipoPropiedad: '',
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
      ubicacionBodega: '',
      ubicacionEstacionamiento: '',

      // Campo específico para Bodega
      numeroBodega: '',

      // Campo específico para Parcela
      parcela_number: '',

      // Amenidades
      amenidades: [],

      // Datos del Propietario
      owner_type: 'natural' as 'natural' | 'juridica',
      owner_first_name: '',
      owner_paternal_last_name: '',
      owner_maternal_last_name: '',
      owner_rut: '',
      owner_company_name: '',
      owner_company_rut: '',
      owner_representative_first_name: '',
      owner_representative_paternal_last_name: '',
      owner_representative_maternal_last_name: '',
      owner_representative_rut: '',
      owner_address_street: '',
      owner_address_number: '',
      owner_region: '',
      owner_commune: '',
      marital_status: '',
      property_regime: '',

      // Archivos
      photos_urls: [] as string[],
      availableDays: [] as string[],
      availableTimeSlots: [] as string[],
      documents: []
    };
  }, [isEditing, initialData]);

  // Estado para el tipo de propiedad seleccionado (para lógica de campos dinámicos)
  const [propertyType, setPropertyType] = useState(() => {
    return isEditing && initialData ? initialData.property_type || '' : '';
  });

  // Constante para verificar si es estacionamiento
  const isParking = propertyType === 'Estacionamiento';

  // Función helper para manejar cambios en amenidades
  const handleAmenidadChange = (amenidad: string, isChecked: boolean) => {
    setFormData({
      ...formData,
      amenidades: isChecked
        ? [...formData.amenidades, amenidad]
        : formData.amenidades.filter(a => a !== amenidad)
    });
  };

  // Form data state - inicializar con useMemo
  const [formData, setFormData] = useState(getInitialFormData);

  // Photo preview state
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  // Actualizar formData cuando cambie getInitialFormData y cargar fotos
  useEffect(() => {
    console.log('🔄 RENTAL FORM: Updating formData with getInitialFormData');
    setFormData(getInitialFormData);

    // Si hay fotos existentes, cargar sus URLs
    if (isEditing && initialData?.property_images) {
      console.log('🖼️ RENTAL FORM: Loading existing photos:', initialData.property_images.length);
      setPhotoPreviews(initialData.property_images.map(img => img.image_url));
    }

    // Marcar como inicializado después de un breve delay para asegurar que el DOM se actualice
    if (isEditing) {
      setTimeout(() => {
        console.log('✅ RENTAL FORM: Initialization complete');
        setInitializing(false);
      }, 100);
    } else {
      setInitializing(false);
    }
  }, [getInitialFormData, isEditing, initialData]);

  // Debug: Monitorear cambios en formData
  useEffect(() => {
    if (isEditing) {
      console.log('📊 RENTAL FORM: formData changed:', {
        tipoPropiedad: formData.tipoPropiedad,
        address_street: formData.address_street,
        price: formData.price,
        bedrooms: formData.bedrooms,
        tieneBodega: formData.tieneBodega,
        owner_type: formData.owner_type,
        amenidades: formData.amenidades,
        documentsCount: formData.documents?.length || 0
      });
    }
  }, [formData, isEditing]);

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
  const handleDocumentUpload = (documentType: string, file: File) => {
    // Por ahora, solo agregamos el archivo al estado de archivos para subir
    // En una implementación completa, esto debería manejar la subida inmediata
    console.log('Document upload:', documentType, file.name);
    // TODO: Implementar subida de documentos
  };

  // Remove document - por ahora no implementado para documentos existentes
  const removeDocument = (documentType: string) => {
    console.log('Remove document:', documentType);
    // TODO: Implementar eliminación de documentos
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

    // Validación específica para Bodega
    if (propertyType === 'Bodega') {
      if (!formData.numeroBodega || formData.numeroBodega.trim() === '') {
        newErrors.numeroBodega = 'El número de bodega es requerido';
      }
      if (!formData.metrosTotales.trim()) newErrors.metrosTotales = 'Los M² de la bodega son requeridos';
      // Descripción opcional para bodegas
    } else {
      // M² son requeridos solo si NO es estacionamiento, NO es bodega y NO es Parcela
      if (!isParking && propertyType !== 'Parcela' && !formData.metrosUtiles.trim()) newErrors.metrosUtiles = 'Los metros útiles son requeridos';
      if (!isParking && !formData.metrosTotales.trim()) newErrors.metrosTotales = 'Los metros totales son requeridos';
      if (!formData.description.trim()) newErrors.description = 'La descripción es requerida';
    }
    // Validaciones condicionales según el tipo de propietario
    if (formData.owner_type === 'natural') {
      if (!formData.owner_first_name.trim()) newErrors.owner_first_name = 'El nombre del propietario es requerido';
      if (!formData.owner_paternal_last_name.trim()) newErrors.owner_paternal_last_name = 'El apellido paterno del propietario es requerido';
      if (!formData.owner_maternal_last_name.trim()) newErrors.owner_maternal_last_name = 'El apellido materno del propietario es requerido';
      if (!formData.owner_rut.trim()) newErrors.owner_rut = 'El RUT del propietario es requerido';
      if (!formData.marital_status) newErrors.marital_status = 'El estado civil es requerido';
    } else if (formData.owner_type === 'juridica') {
      if (!formData.owner_company_name.trim()) newErrors.owner_company_name = 'La razón social es requerida';
      if (!formData.owner_company_rut.trim()) newErrors.owner_company_rut = 'El RUT de la empresa es requerido';

      // Validaciones para el representante legal
      if (!formData.owner_representative_first_name.trim()) newErrors.owner_representative_first_name = 'El nombre del representante legal es requerido';
      if (!formData.owner_representative_paternal_last_name.trim()) newErrors.owner_representative_paternal_last_name = 'El apellido paterno del representante legal es requerido';
      if (!formData.owner_representative_rut.trim()) newErrors.owner_representative_rut = 'El RUT del representante legal es requerido';
    }

    // Validaciones comunes para ambos tipos
    if (!formData.owner_address_street.trim()) newErrors.owner_address_street = 'La calle del propietario es requerida';
    if (!formData.owner_address_number.trim()) newErrors.owner_address_number = 'El número del propietario es requerido';
    if (!formData.owner_region) newErrors.owner_region = 'La región del propietario es requerida';
    if (!formData.owner_commune) newErrors.owner_commune = 'La comuna del propietario es requerida';

    // Validate property_regime if married (solo para personas naturales)
    if (formData.owner_type === 'natural' && formData.marital_status === 'casado' && !formData.property_regime) {
      newErrors.property_regime = 'El régimen patrimonial es requerido para personas casadas';
    }

    // Validate personería certificate for legal entities
    if (formData.owner_type === 'juridica' && !formData.documents.some((doc: any) => doc.document_type === 'personeria_certificate')) {
      newErrors.personeria_certificate = 'El certificado de personería es requerido para personas jurídicas';
    }

    // Validaciones específicas para oficinas
    if (propertyType === 'Oficina') {
      // Validar M² Bodega si tiene bodega
      if (formData.tieneBodega === 'Sí') {
        if (!formData.metrosBodega || parseFloat(formData.metrosBodega) <= 0) {
          newErrors.metrosBodega = 'Los metros cuadrados de bodega son requeridos y deben ser mayor a 0';
        }
      }
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

      // Helper function: Parse number safely, return null if empty/invalid
      const parseNumber = (value: string, isInteger = false): number | null => {
        if (!value || value.trim() === '') return null;
        const parsed = isInteger ? parseInt(value) : parseFloat(value);
        return isNaN(parsed) ? null : parsed;
      };

      // Parse numeric values with safe handling of empty values
      const price = parseNumber(formData.price, false);
      const metrosUtiles = parseNumber(formData.metrosUtiles, true);
      const metrosTotales = parseNumber(formData.metrosTotales, true);
      const metrosBodega = parseNumber(formData.metrosBodega, true);
      const anoConstruccion = parseNumber(formData.anoConstruccion, true);
      const commonExpenses = parseNumber(formData.common_expenses, false) || 0;
      const bedrooms = parseNumber(formData.bedrooms, true) || 0;
      const bathrooms = parseNumber(formData.bathrooms, true) || 0;
      const parkingSpaces = formData.estacionamientos === '5+' ? 5 : (parseNumber(formData.estacionamientos, true) || 0);

      // Validate REQUIRED fields only (price must always be valid)
      if (price === null || price <= 0) {
        throw new Error('El precio es requerido y debe ser mayor a 0');
      }

      // Validate required numeric fields based on property type
      const isStorage = formData.tipoPropiedad === 'Bodega';
      const isParking = formData.tipoPropiedad === 'Estacionamiento';
      const isParcela = formData.tipoPropiedad === 'Parcela';
      const isStandardProperty = !isStorage && !isParking && !isParcela;

      // Validate metros_utiles (required for Casa, Departamento, Oficina, Local Comercial)
      if (isStandardProperty && (metrosUtiles === null || metrosUtiles <= 0)) {
        throw new Error('Los M² Útiles son requeridos para este tipo de propiedad');
      }

      // Validate metros_totales (required for all except Estacionamiento)
      if (!isParking && (metrosTotales === null || metrosTotales <= 0)) {
        throw new Error('Los M² Totales son requeridos para este tipo de propiedad');
      }

      // CORREGIDO: Lógica condicional robusta alineada con BD y tipos de propiedad
      // Limpia campos según el tipo de propiedad para evitar datos inconsistentes

      // Valores base del propertyData - todos los campos numéricos son number o null
      const propertyData: any = {
        owner_id: user.id, // FIXME: This should be the actual owner's user ID, not the advisor's
        listing_type: 'arriendo' as const,
        status: 'disponible' as const,
        tipo_propiedad: formData.tipoPropiedad,
        address_street: formData.address_street,
        address_number: formData.address_number,
        address_department: formData.address_department || null,
        address_commune: formData.commune,
        address_region: formData.region,
        price_clp: price, // Always a valid number (validated above)
        common_expenses_clp: commonExpenses, // 0 or valid number
        description: formData.description,
        created_at: new Date().toISOString(),
      };

      // CORREGIDO: Campos condicionales según tipo de propiedad - COMPATIBLE CON BD ACTUAL
      // Solo incluir campos que existen actualmente en la base de datos
      // TODOS LOS CAMPOS NUMÉRICOS SON number | null (nunca NaN, undefined, ni "")
      if (formData.tipoPropiedad === 'Bodega') {
        // Bodega: Solo numeroBodega requerido, resto de campos tradicionales son NULL/0
        propertyData.bedrooms = 0;
        propertyData.bathrooms = 0;
        propertyData.estacionamientos = 0;
        propertyData.metros_utiles = null; // NO aplica para Bodega
        propertyData.metros_totales = metrosTotales; // Can be null if not provided
        propertyData.tiene_terraza = false;
        // Campos legacy - solo si existen en BD
        if (formData.numeroBodega) {
          propertyData.numero_bodega = formData.numeroBodega;
          // propertyData.storage_number = formData.numeroBodega; // Comentar hasta que se aplique migración
        }

      } else if (formData.tipoPropiedad === 'Estacionamiento') {
        // Estacionamiento: Mínimos campos, solo ubicación opcional
        propertyData.bedrooms = 0;
        propertyData.bathrooms = 0;
        propertyData.estacionamientos = 0; // No aplica contar estacionamientos para este tipo
        propertyData.metros_utiles = null; // NO aplica
        propertyData.metros_totales = null; // NO aplica
        propertyData.tiene_terraza = false;
        // propertyData.ubicacion_estacionamiento = formData.ubicacionEstacionamiento || null; // Comentar hasta migración

      } else if (formData.tipoPropiedad === 'Parcela') {
        // Parcela: Solo metros totales, parcela_number opcional
        propertyData.bedrooms = 0;
        propertyData.bathrooms = 0;
        propertyData.estacionamientos = parkingSpaces; // Can be 0 or more
        propertyData.metros_utiles = null; // NO aplica para Parcela
        propertyData.metros_totales = metrosTotales; // Required for Parcela (validated above)
        propertyData.tiene_terraza = formData.tieneTerraza === 'Sí';
        // propertyData.parcela_number = formData.parcela_number || null; // Comentar hasta migración

      } else {
        // Casa, Departamento, Oficina, Local Comercial: Campos completos
        propertyData.bedrooms = bedrooms;
        propertyData.bathrooms = bathrooms;
        propertyData.estacionamientos = parkingSpaces;
        propertyData.metros_utiles = metrosUtiles; // Required for these types (validated above)
        propertyData.metros_totales = metrosTotales; // Required for these types (validated above)
        // Campos específicos del tipo
        propertyData.tiene_terraza = formData.tieneTerraza === 'Sí';
        propertyData.tiene_sala_estar = formData.tieneSalaEstar === 'Sí';
        propertyData.sistema_agua_caliente = formData.sistemaAguaCaliente;
        propertyData.tipo_cocina = formData.tipoCocina;
        propertyData.ano_construccion = anoConstruccion; // Can be null
        // propertyData.ubicacion_estacionamiento = parkingSpaces > 0 ? formData.ubicacionEstacionamiento || null : null; // Comentar hasta migración

        // Campos específicos para Oficina - solo si existen en BD
        if (formData.tipoPropiedad === 'Oficina') {
          // propertyData.tiene_bodega = formData.tieneBodega === 'Sí'; // Comentar hasta migración
          // propertyData.metros_bodega = metrosBodega; // Comentar hasta migración
          // propertyData.ubicacion_bodega = formData.ubicacionBodega || null; // Comentar hasta migración
        }
      }

      // DEBUGGING: Log propertyData to verify all numeric fields are correctly parsed
      console.log('🏠 PropertyData to submit:', JSON.stringify(propertyData, null, 2));

      // Insert or update property
      let propertyResult;
      if (isEditing && initialData) {
        // Update existing property
        const { data: updateResult, error } = await supabase
          .from('properties')
          .update(propertyData)
          .eq('id', initialData.id)
          .select()
          .single();

        if (error) throw error;
        propertyResult = updateResult;
      } else {
        // Insert new property
        const { data: insertResult, error } = await supabase
          .from('properties')
          .insert(propertyData)
          .select()
          .single();

        if (error) throw error;
        propertyResult = insertResult;
      }

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

      // Insert rental owner information with specific ID capture (only for new properties)
      if (propertyResult?.id && !isEditing) {
        const ownerData = {
          property_id: propertyResult.id,
          // Campos comunes
          address_street: formData.owner_address_street,
          address_number: formData.owner_address_number,
          address_department: null,
          address_commune: formData.owner_commune,
          address_region: formData.owner_region,
        };

        // Agregar campos específicos según el tipo de propietario
        if (formData.owner_type === 'natural') {
          Object.assign(ownerData, {
            first_name: formData.owner_first_name,
            paternal_last_name: formData.owner_paternal_last_name,
            maternal_last_name: formData.owner_maternal_last_name,
            rut: formData.owner_rut,
            marital_status: formData.marital_status,
            property_regime: formData.marital_status === 'casado' ? formData.property_regime : null,
            owner_type: 'natural',
          });
        } else if (formData.owner_type === 'juridica') {
          Object.assign(ownerData, {
            company_name: formData.owner_company_name,
            company_rut: formData.owner_company_rut,
            representative_first_name: formData.owner_representative_first_name,
            representative_paternal_last_name: formData.owner_representative_paternal_last_name,
            representative_maternal_last_name: formData.owner_representative_maternal_last_name,
            representative_rut: formData.owner_representative_rut,
            owner_type: 'juridica',
          });
        }

        const { data: ownerResult, error: ownerError } = await supabase
          .from('rental_owners')
          .insert(ownerData)
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
            type: formData.owner_type,
            name: formData.owner_type === 'natural'
              ? `${ownerResult.first_name} ${ownerResult.paternal_last_name}`
              : ownerResult.company_name,
            rut: formData.owner_type === 'natural' ? ownerResult.rut : ownerResult.company_rut
          });
        }
      }


      alert(isEditing ? 'Propiedad actualizada exitosamente!' : 'Propiedad publicada exitosamente!');

      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/portfolio');
      }
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
    { key: 'personeria_certificate', label: 'Certificado de Personería', conditional: true },
  ];

  // Mostrar loading mientras se inicializa el formulario en modo edición
  if (initializing && isEditing) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b bg-gradient-to-r from-emerald-50 to-green-50">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Modificar Propiedad en Arriendo
            </h1>
            <p className="text-gray-600">
              Cargando información de la propiedad...
            </p>
          </div>
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando datos del formulario...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-emerald-50 to-green-50">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isEditing ? 'Modificar Propiedad en Arriendo' : 'Publicar Propiedad en Arriendo'}
          </h1>
          <p className="text-gray-600">
            {isEditing
              ? 'Actualiza la información de tu propiedad en arriendo'
              : 'Completa todos los campos para publicar tu propiedad en arriendo'
            }
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
              {/* Tipo de Propiedad */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tipo de Propiedad *
                </label>
                <select
                  required
                  value={formData.tipoPropiedad}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setPropertyType(newType);

                    // CORREGIDO: Limpiar valores específicos según el tipo de propiedad - EXACTAMENTE como se envía a BD
                    const updatedFormData = { ...formData, tipoPropiedad: newType };

                    if (newType === 'Bodega') {
                      // CORREGIDO: Bodega - Solo numeroBodega requerido, limpiar campos tradicionales
                      updatedFormData.bedrooms = '0';
                      updatedFormData.bathrooms = '0';
                      updatedFormData.estacionamientos = '0';
                      updatedFormData.ubicacionEstacionamiento = '';
                      updatedFormData.metrosUtiles = ''; // NULL en BD
                      // metrosTotales se mantiene (M² de la Bodega)
                      updatedFormData.tieneTerraza = 'No';
                      updatedFormData.tieneSalaEstar = 'No';
                      updatedFormData.tieneBodega = 'No';
                      updatedFormData.metrosBodega = '';
                      updatedFormData.ubicacionBodega = '';
                      updatedFormData.parcela_number = '';
                      // numeroBodega se mantiene (requerido)

                    } else if (newType === 'Estacionamiento') {
                      // CORREGIDO: Estacionamiento - Mínimos campos aplicables
                      updatedFormData.bedrooms = '0';
                      updatedFormData.bathrooms = '0';
                      updatedFormData.estacionamientos = '0'; // No cuenta estacionamientos para este tipo
                      updatedFormData.metrosUtiles = ''; // NULL
                      updatedFormData.metrosTotales = ''; // NULL
                      updatedFormData.tieneTerraza = 'No';
                      updatedFormData.tieneSalaEstar = 'No';
                      updatedFormData.tieneBodega = 'No';
                      updatedFormData.metrosBodega = '';
                      updatedFormData.ubicacionBodega = '';
                      updatedFormData.numeroBodega = '';
                      updatedFormData.parcela_number = '';
                      // ubicacionEstacionamiento opcional

                    } else if (newType === 'Parcela') {
                      // CORREGIDO: Parcela - Campos limitados
                      updatedFormData.bedrooms = '0';
                      updatedFormData.bathrooms = '0';
                      updatedFormData.metrosUtiles = ''; // NULL
                      // metrosTotales se mantiene (M² del terreno)
                      updatedFormData.tieneSalaEstar = 'No';
                      updatedFormData.tieneBodega = 'No';
                      updatedFormData.metrosBodega = '';
                      updatedFormData.ubicacionBodega = '';
                      updatedFormData.numeroBodega = '';
                      // parcela_number opcional, estacionamientos permitidos, terraza permitida

                    } else if (newType === 'Oficina') {
                      // CORREGIDO: Oficina - Campos completos más campos específicos de bodega
                      updatedFormData.tieneTerraza = 'No'; // Oficinas generalmente no tienen terraza
                      // Mantener todos los demás campos, tieneBodega/metrosBodega/ubicacionBodega condicionales

                    } else {
                      // Casa, Departamento, Local Comercial - Campos tradicionales completos
                      // Limpiar campos específicos que no aplican
                      updatedFormData.tieneBodega = 'No';
                      updatedFormData.metrosBodega = '';
                      updatedFormData.ubicacionBodega = '';
                      updatedFormData.numeroBodega = '';
                      updatedFormData.parcela_number = '';
                      // Mantener bedrooms, bathrooms, estacionamientos, metrosUtiles, metrosTotales, terraza
                    }

                    setFormData(updatedFormData);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                >
                  <option value="Casa">Casa</option>
                  <option value="Departamento">Departamento</option>
                  <option value="Oficina">Oficina</option>
                  <option value="Estacionamiento">Estacionamiento</option>
                  <option value="Bodega">Bodega</option>
                  <option value="Parcela">Parcela</option>
                </select>
              </div>

              {/* Campo específico: Número de Bodega - SOLO PARA BODEGA */}
              {propertyType === 'Bodega' && (
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
                      value={formData.numeroBodega}
                      onChange={(e) => setFormData({ ...formData, numeroBodega: e.target.value })}
                      placeholder="Ej: B-115 (piso -1)"
                      maxLength={50}
                      required={propertyType === 'Bodega'}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        errors.numeroBodega ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {errors.numeroBodega && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.numeroBodega}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-gray-600">
                      Ingrese el número o ubicación específica de la bodega
                    </p>
                  </div>
                </div>
              )}

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

              {/* Departamento / Oficina - Ocultar si es Estacionamiento, Bodega o Parcela */}
              {!isParking && propertyType !== 'Bodega' && propertyType !== 'Parcela' && (
                <div className="transition-all duration-300">
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
              )}

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

              {/* Dormitorios y Baños - Solo para Casa y Departamento */}
              {['Casa', 'Departamento'].includes(propertyType) && (
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
              )}

              {/* Estacionamientos - Ocultar para Bodega, Estacionamiento y Parcela */}
              {propertyType !== 'Bodega' && !isParking && propertyType !== 'Parcela' && (
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
              )}

              {/* Ubicación de Estacionamientos - Ocultar para Bodega, Estacionamiento y Parcela */}
              {propertyType !== 'Bodega' && !isParking && propertyType !== 'Parcela' && formData.estacionamientos !== '0' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ubicación/Nº Estacionamiento(s) (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.ubicacionEstacionamiento}
                    onChange={(e) => setFormData({ ...formData, ubicacionEstacionamiento: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder="Ej: E-21, E-22 (piso -2)"
                  />
                </div>
              )}

              {/* Campos de área condicionales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-300">
                {/* M² Útiles - Ocultar si es Estacionamiento o Bodega */}
                {!isParking && propertyType !== 'Bodega' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      M² Útiles *
                    </label>
                    <input
                      type="number"
                      required={!isParking && propertyType !== 'Bodega'}
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
                )}

                {/* M² Totales / M² de la Bodega - Siempre visible excepto Estacionamiento */}
                {!isParking && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {propertyType === 'Bodega' ? 'M² de la Bodega' : 'M² Totales'} *
                    </label>
                    <input
                      type="number"
                      required={!isParking}
                      min="0"
                      value={formData.metrosTotales}
                      onChange={(e) => setFormData({ ...formData, metrosTotales: e.target.value })}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                        errors.metrosTotales ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder={propertyType === 'Bodega' ? "Ej: 8.5" : "Ej: 95"}
                    />
                    {errors.metrosTotales && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.metrosTotales}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      {propertyType === 'Bodega'
                        ? 'Superficie de la bodega en metros cuadrados'
                        : 'Superficie total incluyendo áreas comunes'
                      }
                    </p>
                  </div>
                )}
              </div>

              {/* Campo específico: Número de Parcela - SOLO PARA PARCELA */}
              {propertyType === 'Parcela' && (
                <div className="transition-all duration-300">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Número de Parcela (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.parcela_number}
                    onChange={(e) => setFormData({ ...formData, parcela_number: e.target.value })}
                    placeholder="Ej: Parcela 21"
                    maxLength={30}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                  <p className="mt-2 text-xs text-gray-600">
                    Indique el número o ubicación específica de la parcela si aplica
                  </p>
                </div>
              )}

              {/* Terraza - Ocultar para Bodega, Estacionamiento, Oficina y Parcela */}
              {!isParking && propertyType !== 'Oficina' && propertyType !== 'Bodega' && propertyType !== 'Parcela' && (
                <div className="transition-all duration-300 ease-in-out">
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
              )}

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

              {/* Mensaje informativo según el tipo de propiedad */}
              {isParking && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 transition-all duration-300">
                  <h3 className="text-sm font-semibold text-amber-900 mb-2">
                    🚗 Información del Estacionamiento
                  </h3>
                  <p className="text-xs text-amber-700">
                    Para estacionamientos no se requieren datos de superficie ni unidad.
                    Complete los demás campos del formulario.
                  </p>
                </div>
              )}

              {/* Mensaje informativo para Bodega */}
              {propertyType === 'Bodega' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 transition-all duration-300">
                  <h3 className="text-sm font-semibold text-blue-900 mb-2">
                    📦 Información de la Bodega
                  </h3>
                  <p className="text-xs text-blue-700">
                    Complete el número de bodega y los metros cuadrados. La descripción es opcional.
                    Complete los demás campos del formulario.
                  </p>
                </div>
              )}

              {/* Descripción */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Descripción {propertyType === 'Bodega' && '(Opcional)'}
                </label>
                <textarea
                  required={propertyType !== 'Bodega'}
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                    errors.description ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder={
                    propertyType === 'Bodega'
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
            </div>
          </div>

          {/* Sección 2: Características Internas - Solo para Casa y Departamento */}
          {['Casa', 'Departamento'].includes(propertyType) && (
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

                {/* Bodega - Solo para Casa y Departamento */}
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
                    <>
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
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Ubicación/Nº Bodega (Opcional)
                        </label>
                        <input
                          type="text"
                          value={formData.ubicacionBodega}
                          onChange={(e) => setFormData({ ...formData, ubicacionBodega: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                          placeholder="Ej: B-115 (piso -1)"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Sección 3: Amenidades y Equipamiento - Solo para Casa y Departamento */}
          {['Casa', 'Departamento'].includes(propertyType) && (
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
                      checked={formData.amenidades.includes('Conserje')}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        const amenidad = 'Conserje';
                        setFormData({
                          ...formData,
                          amenidades: isChecked
                            ? [...formData.amenidades, amenidad]
                            : formData.amenidades.filter(a => a !== amenidad)
                        });
                      }}
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
                      checked={formData.amenidades.includes('Condominio')}
                      onChange={(e) => handleAmenidadChange('Condominio', e.target.checked)}
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
                      checked={formData.amenidades.includes('Piscina')}
                      onChange={(e) => handleAmenidadChange('Piscina', e.target.checked)}
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
                      checked={formData.amenidades.includes('Salón de Eventos')}
                      onChange={(e) => handleAmenidadChange('Salón de Eventos', e.target.checked)}
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
                      checked={formData.amenidades.includes('Gimnasio')}
                      onChange={(e) => handleAmenidadChange('Gimnasio', e.target.checked)}
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
                      checked={formData.amenidades.includes('Cowork')}
                      onChange={(e) => handleAmenidadChange('Cowork', e.target.checked)}
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
                      checked={formData.amenidades.includes('Quincho')}
                      onChange={(e) => handleAmenidadChange('Quincho', e.target.checked)}
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
                      checked={formData.amenidades.includes('Sala de Cine')}
                      onChange={(e) => handleAmenidadChange('Sala de Cine', e.target.checked)}
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
                      checked={formData.amenidades.includes('Áreas Verdes')}
                      onChange={(e) => handleAmenidadChange('Áreas Verdes', e.target.checked)}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                    />
                    <label htmlFor="areasVerdes" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Áreas Verdes
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sección 3.5: Características de Oficina - Solo para Oficinas */}
          {propertyType === 'Oficina' && (
            <div className="space-y-6">
              <div className="border-b pb-2">
                <h2 className="text-xl font-bold text-gray-900">Características de Oficina</h2>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {/* Bodega para Oficinas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      ¿Tiene Bodega?
                    </label>
                    <select
                      value={formData.tieneBodega}
                      onChange={(e) => setFormData({
                        ...formData,
                        tieneBodega: e.target.value,
                        metrosBodega: e.target.value === 'No' ? '' : formData.metrosBodega,
                        ubicacionBodega: e.target.value === 'No' ? '' : formData.ubicacionBodega
                      })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    >
                      <option value="No">No</option>
                      <option value="Sí">Sí</option>
                    </select>
                  </div>

                  {formData.tieneBodega === 'Sí' && (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          M² Bodega <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          required={formData.tieneBodega === 'Sí'}
                          value={formData.metrosBodega}
                          onChange={(e) => setFormData({ ...formData, metrosBodega: e.target.value })}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                            errors.metrosBodega ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                          placeholder="Ej: 5"
                        />
                        {errors.metrosBodega && (
                          <p className="mt-1 text-sm text-red-600 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {errors.metrosBodega}
                          </p>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Ubicación/Nº Bodega (Opcional)
                        </label>
                        <input
                          type="text"
                          maxLength={50}
                          value={formData.ubicacionBodega}
                          onChange={(e) => setFormData({ ...formData, ubicacionBodega: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                          placeholder="Ej: B-115 (piso -1)"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Sección 4: Datos del Propietario */}
          <div className="space-y-6">
            <div className="border-b pb-2">
              <h2 className="text-xl font-bold text-gray-900">Datos del Propietario</h2>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {/* Selector de Tipo de Propietario */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tipo de Propietario *
                </label>
                <select
                  required
                  value={formData.owner_type}
                  onChange={(e) => setFormData({
                    ...formData,
                    owner_type: e.target.value as 'natural' | 'juridica',
                    // Limpiar campos cuando cambia el tipo
                    marital_status: e.target.value === 'natural' ? formData.marital_status : '',
                    property_regime: e.target.value === 'natural' ? formData.property_regime : ''
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                >
                  <option value="natural">Persona Natural</option>
                  <option value="juridica">Persona Jurídica</option>
                </select>
              </div>

              {/* Campos para Persona Natural */}
              {formData.owner_type === 'natural' && (
                <>
                  {/* Nombres del Propietario */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nombres del Propietario *
                    </label>
                    <input
                      type="text"
                      required={formData.owner_type === 'natural'}
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
                      required={formData.owner_type === 'natural'}
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
                      required={formData.owner_type === 'natural'}
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
                      required={formData.owner_type === 'natural'}
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

                  {/* Estado Civil */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Estado Civil *
                    </label>
                    <select
                      required={formData.owner_type === 'natural'}
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
                </>
              )}

              {/* Campos para Persona Jurídica */}
              {formData.owner_type === 'juridica' && (
                <>
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Datos de la Empresa</h3>

                  {/* Razón Social */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Razón Social *
                    </label>
                    <input
                      type="text"
                      required={formData.owner_type === 'juridica'}
                      value={formData.owner_company_name}
                      onChange={(e) => setFormData({ ...formData, owner_company_name: e.target.value })}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                        errors.owner_company_name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Ej: Inmobiliaria XYZ Ltda."
                    />
                    {errors.owner_company_name && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.owner_company_name}
                      </p>
                    )}
                  </div>

                  {/* RUT de la Empresa */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      RUT de la Empresa *
                    </label>
                    <input
                      type="text"
                      required={formData.owner_type === 'juridica'}
                      value={formData.owner_company_rut}
                      onChange={(e) => setFormData({ ...formData, owner_company_rut: e.target.value })}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                        errors.owner_company_rut ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Ej: 76.123.456-7"
                    />
                    {errors.owner_company_rut && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.owner_company_rut}
                      </p>
                    )}
                  </div>

                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mt-6">Datos del Representante Legal</h3>

                  {/* Nombres del Representante Legal */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nombres del Representante Legal *
                    </label>
                    <input
                      type="text"
                      required={formData.owner_type === 'juridica'}
                      value={formData.owner_representative_first_name}
                      onChange={(e) => setFormData({ ...formData, owner_representative_first_name: e.target.value })}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                        errors.owner_representative_first_name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Ej: María José"
                    />
                    {errors.owner_representative_first_name && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.owner_representative_first_name}
                      </p>
                    )}
                  </div>

                  {/* Apellido Paterno del Representante Legal */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Apellido Paterno del Representante Legal *
                    </label>
                    <input
                      type="text"
                      required={formData.owner_type === 'juridica'}
                      value={formData.owner_representative_paternal_last_name}
                      onChange={(e) => setFormData({ ...formData, owner_representative_paternal_last_name: e.target.value })}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                        errors.owner_representative_paternal_last_name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Ej: Silva"
                    />
                    {errors.owner_representative_paternal_last_name && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.owner_representative_paternal_last_name}
                      </p>
                    )}
                  </div>

                  {/* Apellido Materno del Representante Legal */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Apellido Materno del Representante Legal
                    </label>
                    <input
                      type="text"
                      value={formData.owner_representative_maternal_last_name}
                      onChange={(e) => setFormData({ ...formData, owner_representative_maternal_last_name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      placeholder="Ej: Torres"
                    />
                  </div>

                  {/* RUT del Representante Legal */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      RUT del Representante Legal *
                    </label>
                    <input
                      type="text"
                      required={formData.owner_type === 'juridica'}
                      value={formData.owner_representative_rut}
                      onChange={(e) => setFormData({ ...formData, owner_representative_rut: e.target.value })}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                        errors.owner_representative_rut ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Ej: 15.678.901-2"
                    />
                    {errors.owner_representative_rut && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.owner_representative_rut}
                      </p>
                    )}
                  </div>

                </>
              )}

              {/* Dirección del Propietario (común para ambos tipos) */}
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mt-6">Dirección del Propietario</h3>

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
              {/* Documentos Existentes */}
              {formData.documents && formData.documents.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Documentos Existentes</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {formData.documents.map((doc: any) => (
                      <div key={doc.id} className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <Check className="h-5 w-5 text-green-600" />
                        <span className="text-sm text-green-800 flex-1">
                          {doc.document_type}: {doc.file_name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documentos Requeridos */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Documentos Requeridos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {requiredDocuments.map((doc) => (
                    <div key={doc.key} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {doc.label}
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-emerald-400 transition-colors">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => e.target.files?.[0] && handleDocumentUpload(doc.key as any, e.target.files[0])}
                          className="hidden"
                          id={`doc-${doc.key}`}
                        />
                        <label htmlFor={`doc-${doc.key}`} className="cursor-pointer">
                          <Upload className="mx-auto h-8 w-8 text-gray-400" />
                          <p className="mt-1 text-xs text-gray-600">Subir documento</p>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Documentos Opcionales */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Documentos Opcionales</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {optionalDocuments.map((doc) => {
                    // Solo mostrar certificado de personería para persona jurídica
                    if (doc.conditional && formData.owner_type !== 'juridica') {
                      return null;
                    }

                    return (
                      <div key={doc.key} className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          {doc.label}
                          {doc.conditional && <span className="text-red-500 ml-1">*</span>}
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
                              accept={doc.key === 'personeria_certificate' ? ".pdf" : ".pdf,.doc,.docx"}
                              onChange={(e) => e.target.files?.[0] && handleDocumentUpload(doc.key as keyof typeof formData.documents, e.target.files[0])}
                              className="hidden"
                              id={`doc-${doc.key}`}
                              required={doc.conditional && formData.owner_type === 'juridica'}
                            />
                            <label htmlFor={`doc-${doc.key}`} className="cursor-pointer">
                              <Upload className="mx-auto h-8 w-8 text-gray-400" />
                              <p className="mt-1 text-xs text-gray-600">Subir documento</p>
                              {doc.conditional && formData.owner_type === 'juridica' && (
                                <p className="mt-1 text-xs text-red-600">Requerido para personas jurídicas</p>
                              )}
                            </label>
                          </div>
                        )}
                      </div>
                    );
                  })}
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
