import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, FileText, Image, Check, AlertCircle, Loader2, Building, User, Building2, CheckCircle, Car } from 'lucide-react';
import { supabase, Property } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import ParkingSpaceForm, { ParkingSpace } from './ParkingSpaceForm';
import StorageSpaceForm, { StorageSpace } from './StorageSpaceForm';
import { ProgressiveDocumentUpload, DocumentType } from '../documents/ProgressiveDocumentUpload';

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

// Lista de nacionalidades disponibles
const NATIONALITIES = [
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

interface RentalPublicationFormProps {
  initialData?: Property;
  isEditing?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Interface para documentos de propietario
interface RentalOwnerDocument {
  type: string;
  label: string;
  required: boolean;
  file?: File;
  url?: string;
  uploaded?: boolean;
}

// Interface para propietario individual
interface Owner {
  id: string;
  owner_type: 'natural' | 'juridica';
  // Campos para persona natural
  owner_first_name?: string;
  owner_paternal_last_name?: string;
  owner_maternal_last_name?: string;
  owner_rut?: string;
  owner_email?: string;
  owner_phone?: string;
  property_regime?: string;
  // Campos para persona jurídica
  owner_company_name?: string;
  owner_company_rut?: string;
  owner_company_business?: string;
  owner_company_email?: string;
  owner_company_phone?: string;
  owner_representative_first_name?: string;
  owner_representative_paternal_last_name?: string;
  owner_representative_maternal_last_name?: string;
  owner_representative_rut?: string;
  owner_representative_email?: string;
  owner_representative_phone?: string;
  // Campos de personería jurídica (condicionales)
  constitution_type?: 'empresa_en_un_dia' | 'tradicional';
  constitution_date?: string;
  cve_code?: string; // Solo para empresa_en_un_dia
  notary_name?: string; // Solo para tradicional
  repertory_number?: string; // Solo para tradicional
  // Campos de dirección (comunes)
  owner_address_street?: string;
  owner_address_number?: string;
  owner_region?: string;
  owner_commune?: string;
  // Nuevo campo: nacionalidad del propietario
  owner_nationality?: string;
  // Nuevo campo: tipo de unidad (Casa/Departamento/Oficina)
  owner_unit_type?: string;
  // Nuevo campo: número de departamento/casa/oficina
  owner_apartment_number?: string;
  // Campo para porcentaje de propiedad (opcional)
  ownership_percentage?: number;
  // Documentos del propietario
  documents?: RentalOwnerDocument[];
}

const RENTAL_DOCUMENTS: DocumentType[] = [
  { id: 'dom_vigente', label: 'Certificado de Dominio Vigente', type: 'certificado_dominio', optional: true },
  { id: 'avaluo', label: 'Certificado de Avalúo Fiscal', type: 'avaluo_fiscal', optional: true },
  { id: 'hipotecas', label: 'Certificado de Hipoteca y Gravamen', type: 'certificado_hipotecas', optional: true },
  { id: 'owner_id', label: 'Fotocopia de Cédula de Identidad del Propietario', type: 'cedula_identidad', optional: true },
  { id: 'poder', label: 'Poder (si aplica)', type: 'poder_notarial', optional: true },
  { id: 'evaluacion', label: 'Evaluación Comercial de la Propiedad', type: 'evaluacion_comercial', optional: true },
  { id: 'personeria', label: 'Certificado de Personería', type: 'certificado_personeria', optional: true },
];

export const RentalPublicationForm: React.FC<RentalPublicationFormProps> = ({
  initialData,
  isEditing = false,
  onSuccess,
  onCancel
}) => {
  const { user } = useAuth();
  const [showDocUpload, setShowDocUpload] = useState(false);
  const [createdPropertyId, setCreatedPropertyId] = useState<string | null>(null);
  const navigate = useNavigate();

  console.log('🏗️ RENTAL FORM: Component rendered - isEditing:', isEditing, 'initialData exists:', !!initialData);
  console.log('🏗️ RENTAL FORM: initialData content:', initialData);

  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(isEditing);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Función para inicializar propietarios
  const getInitialOwners = useMemo((): Owner[] => {
    console.log('🎯 GET INITIAL OWNERS: isEditing:', isEditing, 'initialData:', !!initialData);

    if (isEditing && initialData) {
      // For editing, we need to load owners from the database
      // For now, return a loading state - owners will be loaded in useEffect
      console.log('🎯 GET INITIAL OWNERS: Returning empty array for editing - owners will be loaded via useEffect');
      return [];
    }

    // Para nueva propiedad, empezar con un propietario vacío
    const defaultOwner: Owner = {
      id: 'owner-1',
      owner_type: 'natural',
      owner_first_name: '',
      owner_paternal_last_name: '',
      owner_maternal_last_name: '',
      owner_rut: '',
      owner_email: '',
      owner_phone: '',
      owner_company_name: '',
      owner_company_rut: '',
      owner_company_business: '',
      owner_company_email: '',
      owner_company_phone: '',
      owner_representative_first_name: '',
      owner_representative_paternal_last_name: '',
      owner_representative_maternal_last_name: '',
      owner_representative_rut: '',
      owner_representative_email: '',
      owner_representative_phone: '',
      // Campos de personería jurídica
      constitution_type: undefined,
      constitution_date: '',
      cve_code: '',
      notary_name: '',
      repertory_number: '',
      owner_address_street: '',
      owner_address_number: '',
      owner_region: '',
      owner_commune: '',
      owner_nationality: '',
      owner_unit_type: 'Casa', // Valor por defecto
      owner_apartment_number: '',
      property_regime: '',
      ownership_percentage: undefined,
      documents: [] // Inicializar vacío, se poblará en useEffect
    };
    return [defaultOwner];
  }, [isEditing, initialData]);

  // Inicializar documentos de propietarios cuando el componente se monte
  useEffect(() => {
    setOwners(prev => prev.map(owner => {
      const requiredDocs = getRequiredOwnerDocuments(owner.owner_type);
      const existingDocs = owner.documents || [];
      const hasAllRequiredDocs = requiredDocs.every(requiredDoc =>
        existingDocs.some(existingDoc => existingDoc.type === requiredDoc.type)
      );

      // Si no tiene todos los documentos requeridos, agregar los que faltan
      if (!hasAllRequiredDocs) {
        const missingDocs = requiredDocs.filter(requiredDoc =>
          !existingDocs.some(existingDoc => existingDoc.type === requiredDoc.type)
        );

        return {
          ...owner,
          documents: [...existingDocs, ...missingDocs]
        };
      }

      // Si ya tiene documentos pero no están inicializados, usar los existentes
      if (existingDocs.length > 0) {
        return {
          ...owner,
          documents: existingDocs
        };
      }

      // Caso por defecto: inicializar con documentos requeridos
      return {
        ...owner,
        documents: requiredDocs
      };
    }));
  }, []);

  // Función para obtener documentos requeridos según tipo de propietario
  const getRequiredOwnerDocuments = (ownerType: 'natural' | 'juridica'): RentalOwnerDocument[] => {
    if (ownerType === 'natural') {
      return [{
        type: 'cedula_identidad',
        label: 'Cédula de Identidad del Propietario',
        required: true
      }];
    } else if (ownerType === 'juridica') {
      return [
        {
          type: 'constitucion_sociedad',
          label: 'Escritura de Constitución de la Sociedad',
          required: true
        },
        {
          type: 'poder_representante',
          label: 'Poder del Representante Legal',
          required: false
        },
        {
          type: 'cedula_representante',
          label: 'Cédula de Identidad del Representante Legal',
          required: true
        }
      ];
    }
    return [];
  };

  // Función auxiliar para obtener el label de un documento por tipo
  const getDocumentLabel = (docType: string): string => {
    const labels: Record<string, string> = {
      'cedula_identidad': 'Cédula de Identidad del Propietario',
      'constitucion_sociedad': 'Escritura de Constitución de la Sociedad',
      'poder_representante': 'Poder del Representante Legal',
      'cedula_representante': 'Cédula de Identidad del Representante Legal'
    };
    return labels[docType] || docType;
  };

  // Función auxiliar para verificar si un documento es requerido
  const isDocumentRequired = (docType: string, ownerType: string): boolean => {
    if (ownerType === 'natural') {
      return docType === 'cedula_identidad';
    } else if (ownerType === 'juridica') {
      return docType === 'constitucion_sociedad' || docType === 'cedula_representante';
    }
    return false;
  };

  // Función para inicializar formData
  const getInitialFormData = useMemo(() => {
    console.log('🎯 GET INITIAL FORM DATA: isEditing:', isEditing, 'initialData:', !!initialData);

    if (isEditing && initialData) {
      console.log('🎯 GET INITIAL FORM DATA: Using initialData for editing');
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
        tipoPropiedad: initialData.tipo_propiedad || 'Casa',
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
        ubicacionBodega: initialData.ubicacion_bodega || '',
        ubicacionEstacionamiento: initialData.ubicacion_estacionamiento || initialData.parking_location || '',
        numeroBodega: initialData.storage_number || '',
        parcela_number: initialData.parcela_number || '',

        // Parking Spaces - inicializar con datos existentes o vacío
        parkingSpaces: [] as ParkingSpace[],

        // Storage Spaces - inicializar con datos existentes o vacío
        storageSpaces: [] as StorageSpace[],

        // Amenidades - Tabla eliminada, inicializar vacío
        amenidades: [],

        // Arrays - inicializar vacíos, se manejarán por separado
        photos_urls: [],
        availableDays: [],
        availableTimeSlots: [],

        // Documentos - inicializar con documentos existentes o array vacío
      documents: Array.isArray(initialData.documents) ? initialData.documents : [],
      };

      console.log('✅ GET INITIAL FORM DATA: Final initialized formData:', {
        tipoPropiedad: formData.tipoPropiedad,
        address_street: formData.address_street,
        price: formData.price,
        bedrooms: formData.bedrooms,
        tieneBodega: formData.tieneBodega,
        metrosBodega: formData.metrosBodega,
        ubicacionBodega: formData.ubicacionBodega,
        ubicacionEstacionamiento: formData.ubicacionEstacionamiento,
        numeroBodega: formData.numeroBodega,
        documents: formData.documents
      });

      return formData;
    }

    console.log('🎯 GET INITIAL FORM DATA: Using default values for new property');
    // Valores por defecto para nueva propiedad
    return {
      // Información de la Propiedad
      tipoPropiedad: 'Casa',
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

      // Parking Spaces
      parkingSpaces: [] as ParkingSpace[],

      // Storage Spaces
      storageSpaces: [] as StorageSpace[],

      // Archivos
      photos_urls: [] as string[],
      availableDays: [] as string[],
      availableTimeSlots: [] as string[],
      documents: {}
    };
  }, [isEditing, initialData]);

  // Estado para el tipo de propiedad seleccionado (para lógica de campos dinámicos)
  const [propertyType, setPropertyType] = useState(() => {
    return isEditing && initialData ? initialData.tipo_propiedad || '' : '';
  });

  // Constante para verificar si es estacionamiento
  const isParking = propertyType === 'Estacionamiento';

  // Estado para propietarios
  const [owners, setOwners] = useState<Owner[]>(getInitialOwners);

  // Form data state - inicializar con useMemo
  const [formData, setFormData] = useState(getInitialFormData);

  // Photo preview state
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  // Actualizar formData y owners cuando cambien los datos iniciales y cargar fotos
  useEffect(() => {
    console.log('🔄 RENTAL FORM: Updating formData with getInitialFormData');
    setFormData(getInitialFormData);
    setOwners(getInitialOwners);

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
  }, [getInitialFormData, getInitialOwners, isEditing, initialData]);

  // Debug: Monitorear cambios en formData
  useEffect(() => {
    if (isEditing) {
      console.log('📊 RENTAL FORM: formData changed:', {
        tipoPropiedad: formData.tipoPropiedad,
        address_street: formData.address_street,
        price: formData.price,
        bedrooms: formData.bedrooms,
        tieneBodega: formData.tieneBodega,
        documentsCount: Object.keys(formData.documents || {}).length
      });
    }
  }, [formData, isEditing]);

  // Load owners for editing
  useEffect(() => {
    const loadOwnersForEditing = async () => {
      if (!isEditing || !initialData?.id) return;

      console.log('🔄 Loading owners for editing property:', initialData.id);

      try {
        // Load owners with their relationships
        const { data: relationships, error: relError } = await supabase
          .from('property_rental_owners')
          .select(`
            ownership_percentage,
            rental_owner_id,
            rental_owners!inner(*)
          `)
          .eq('property_id', initialData.id);

        if (relError) {
          console.error('❌ Error loading owner relationships:', relError);
          return;
        }

        if (!relationships || relationships.length === 0) {
          console.log('⚠️ No owners found for property, using default owner');
          setOwners(getInitialOwners);
          return;
        }

        // Convert database records to Owner interface
        const loadedOwners: Owner[] = await Promise.all(relationships.map(async (rel: any, index: number) => {
          const ownerData = rel.rental_owners;
          const rentalOwnerId = ownerData.id;

          // Load documents for this owner
          let ownerDocuments: RentalOwnerDocument[] = [];
          try {
            const { data: documents, error: docsError } = await supabase
              .from('rental_owner_documents')
              .select('*')
              .eq('rental_owner_id', rentalOwnerId);

            if (!docsError && documents) {
              // Convert database documents to RentalOwnerDocument format
              ownerDocuments = documents.map(doc => ({
                type: doc.doc_type,
                label: getDocumentLabel(doc.doc_type),
                required: isDocumentRequired(doc.doc_type, ownerData.owner_type),
                url: doc.file_url,
                uploaded: true
              }));
            }
          } catch (docError) {
            console.warn(`⚠️ Could not load documents for owner ${rentalOwnerId}:`, docError);
          }

          // If no documents loaded, initialize with default required documents
          if (ownerDocuments.length === 0) {
            ownerDocuments = getRequiredOwnerDocuments(ownerData.owner_type || 'natural');
          }

          const owner: Owner = {
            id: `loaded-owner-${index}`,
            owner_type: ownerData.owner_type || 'natural',
            // Address fields (common)
            owner_address_street: ownerData.address_street || '',
            owner_address_number: ownerData.address_number || '',
            owner_region: ownerData.address_region || '',
            owner_commune: ownerData.address_commune || '',
            owner_nationality: ownerData.nationality || '',
            owner_unit_type: ownerData.unit_type || 'Casa', // Nuevo campo con valor por defecto
            owner_apartment_number: ownerData.apartment_number || '',
            // Natural person fields
            owner_first_name: ownerData.first_name || '',
            owner_paternal_last_name: ownerData.paternal_last_name || '',
            owner_maternal_last_name: ownerData.maternal_last_name || '',
            owner_rut: ownerData.rut || '',
            owner_email: ownerData.email || '',
            owner_phone: ownerData.phone || '',
            property_regime: ownerData.property_regime || '',
            // Legal entity fields
            owner_company_name: ownerData.company_name || '',
            owner_company_rut: ownerData.company_rut || '',
            owner_company_business: ownerData.company_business || '',
            owner_company_email: ownerData.company_email || '',
            owner_company_phone: ownerData.company_phone || '',
            owner_representative_first_name: ownerData.representative_first_name || '',
            owner_representative_paternal_last_name: ownerData.representative_paternal_last_name || '',
            owner_representative_maternal_last_name: ownerData.representative_maternal_last_name || '',
            owner_representative_rut: ownerData.representative_rut || '',
            owner_representative_email: ownerData.representative_email || '',
            owner_representative_phone: ownerData.representative_phone || '',
            // Legal entity constitution fields
            constitution_type: ownerData.constitution_type,
            constitution_date: ownerData.constitution_date,
            cve_code: ownerData.cve_code,
            notary_name: ownerData.notary_name,
            repertory_number: ownerData.repertory_number,
            // Ownership percentage
            ownership_percentage: rel.ownership_percentage,
            // Documents
            documents: ownerDocuments
          };
          return owner;
        }));

        console.log('✅ Loaded owners for editing:', loadedOwners.length);
        setOwners(loadedOwners);

      } catch (error) {
        console.error('❌ Error loading owners for editing:', error);
        // Fallback to default owner
        setOwners(getInitialOwners);
      }
    };

    loadOwnersForEditing();
  }, [isEditing, initialData?.id]);

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

  // Funciones para manejar propietarios
  const addOwner = () => {
    if (owners.length >= 5) return; // Máximo 5 propietarios

    const newOwner: Owner = {
      id: `owner-${Date.now()}`,
      owner_type: 'natural',
      owner_first_name: '',
      owner_paternal_last_name: '',
      owner_maternal_last_name: '',
      owner_rut: '',
      owner_email: '',
      owner_phone: '',
      owner_company_name: '',
      owner_company_rut: '',
      owner_company_business: '',
      owner_company_email: '',
      owner_company_phone: '',
      owner_representative_first_name: '',
      owner_representative_paternal_last_name: '',
      owner_representative_maternal_last_name: '',
      owner_representative_rut: '',
      owner_representative_email: '',
      owner_representative_phone: '',
      // Campos de personería jurídica
      constitution_type: undefined,
      constitution_date: '',
      cve_code: '',
      notary_name: '',
      repertory_number: '',
      owner_address_street: '',
      owner_address_number: '',
      owner_region: '',
      owner_commune: '',
      owner_nationality: '',
      owner_unit_type: 'Casa', // Valor por defecto
      owner_apartment_number: '',
      property_regime: '',
      ownership_percentage: undefined
    };

    setOwners(prev => [...prev, newOwner]);
  };

  const removeOwner = (ownerId: string) => {
    if (owners.length <= 1) return; // Mínimo 1 propietario

    setOwners(prev => prev.filter(owner => owner.id !== ownerId));
  };

  const updateOwner = (ownerId: string, field: keyof Owner, value: string) => {
    setOwners(prev => prev.map(owner => {
      if (owner.id === ownerId) {
        const updatedOwner = { ...owner, [field]: value };

        // Si cambió el tipo de propietario, actualizar documentos
        if (field === 'owner_type' && value) {
          // Forzar la inicialización de documentos para el nuevo tipo
          updatedOwner.documents = getRequiredOwnerDocuments(value as 'natural' | 'juridica');
        }

        return updatedOwner;
      }
      return owner;
    }));
  };

  // Funciones para manejar documentos de propietarios
  const handleOwnerDocumentUpload = (ownerId: string, documentType: string, file: File) => {
    setOwners(prev => prev.map(owner =>
      owner.id === ownerId ? {
        ...owner,
        documents: owner.documents?.map(doc =>
          doc.type === documentType
            ? { ...doc, file, uploaded: false, url: undefined }
            : doc
        )
      } : owner
    ));
  };

  const handleOwnerDocumentRemove = (ownerId: string, documentType: string) => {
    setOwners(prev => prev.map(owner =>
      owner.id === ownerId ? {
        ...owner,
        documents: owner.documents?.map(doc =>
          doc.type === documentType
            ? { ...doc, file: undefined, uploaded: false, url: undefined }
            : doc
        )
      } : owner
    ));
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
    // Actualizar el estado del formulario con el archivo subido
    setFormData(prev => {
      // Ensure documents is an array (handle migration from object format)
      const currentDocuments = Array.isArray(prev.documents) ? prev.documents : [];

      return {
        ...prev,
        documents: [
          ...currentDocuments.filter(doc => doc.document_type !== documentType), // Remove existing document of same type
          {
            id: `${documentType}-${Date.now()}`, // Generate temporary ID
            document_type: documentType,
            file_name: file.name,
            created_at: new Date().toISOString(),
            file: file // Store the file for upload
          }
        ]
      };
    });
    console.log('Document upload:', documentType, file.name);
  };

  // Remove document
  const removeDocument = (documentType: string) => {
    setFormData(prev => {
      // Ensure documents is an array (handle migration from object format)
      const currentDocuments = Array.isArray(prev.documents) ? prev.documents : [];

      return {
        ...prev,
        documents: currentDocuments.filter(doc => doc.document_type !== documentType)
      };
    });
    console.log('Remove document:', documentType);
  };

  // Validation
  const validateForm = () => {
    try {
      console.log('🔍 Validando formulario...');
      const newErrors: Record<string, string> = {};

    // Required fields validation
    if (!formData.address_street || !formData.address_street.trim()) newErrors.address_street = 'La calle es requerida';
    if (!formData.address_number || !formData.address_number.trim()) newErrors.address_number = 'El número es requerido';
    if (!formData.region) newErrors.region = 'La región es requerida';
    if (!formData.commune) newErrors.commune = 'La comuna es requerida';
    if (!formData.price || !formData.price.trim()) newErrors.price = 'El precio de arriendo es requerido';

    // Validación específica para Bodega
    if (propertyType === 'Bodega') {
      if (!formData.numeroBodega || formData.numeroBodega.trim() === '') {
        newErrors.numeroBodega = 'El número de bodega es requerido';
      }
      if (!formData.metrosTotales || !formData.metrosTotales.trim()) newErrors.metrosTotales = 'Los M² de la bodega son requeridos';
      // Descripción opcional para bodegas
    } else if (propertyType === 'Estacionamiento') {
      // Validación específica para Estacionamiento
      if (!formData.ubicacionEstacionamiento || formData.ubicacionEstacionamiento.trim() === '') {
        newErrors.ubicacionEstacionamiento = 'El número de estacionamiento es obligatorio para propiedades de tipo Estacionamiento';
      } else {
        // Validar que solo contenga letras, números y algunos caracteres especiales comunes
        const parkingNumberRegex = /^[a-zA-Z0-9\s\-_.]+$/;
        if (!parkingNumberRegex.test(formData.ubicacionEstacionamiento.trim())) {
          newErrors.ubicacionEstacionamiento = 'El número de estacionamiento solo puede contener letras, números y caracteres como guion, punto o guion bajo';
        }
      }
    } else {
      // M² son requeridos solo si NO es estacionamiento, NO es bodega y NO es Parcela
      if (!isParking && propertyType !== 'Parcela' && (!formData.metrosUtiles || !formData.metrosUtiles.trim())) newErrors.metrosUtiles = 'Los metros útiles son requeridos';
      if (!isParking && (!formData.metrosTotales || !formData.metrosTotales.trim())) newErrors.metrosTotales = 'Los metros totales son requeridos';
      if (!formData.description || !formData.description.trim()) newErrors.description = 'La descripción es requerida';
    }
    // Validaciones para cada propietario
    owners.forEach((owner, index) => {
      const prefix = owners.length > 1 ? `Propietario ${index + 1}: ` : '';

      if (owner.owner_type === 'natural') {
        if (!owner.owner_first_name || !owner.owner_first_name.trim()) newErrors[`owner_${owner.id}_first_name`] = `${prefix}El nombre del propietario es requerido`;
        if (!owner.owner_paternal_last_name || !owner.owner_paternal_last_name.trim()) newErrors[`owner_${owner.id}_paternal_last_name`] = `${prefix}El apellido paterno del propietario es requerido`;
        if (!owner.owner_maternal_last_name || !owner.owner_maternal_last_name.trim()) newErrors[`owner_${owner.id}_maternal_last_name`] = `${prefix}El apellido materno del propietario es requerido`;
        if (!owner.owner_rut || !owner.owner_rut.trim()) newErrors[`owner_${owner.id}_rut`] = `${prefix}El RUT del propietario es requerido`;
        if (!owner.owner_nationality || !owner.owner_nationality.trim()) newErrors[`owner_${owner.id}_nationality`] = `${prefix}La nacionalidad del propietario es requerida`;

        // Validación de email para personas naturales
        if (!owner.owner_email || !owner.owner_email.trim()) {
          newErrors[`owner_${owner.id}_email`] = `${prefix}El email del propietario es requerido`;
        }

      } else if (owner.owner_type === 'juridica') {
        if (!owner.owner_company_name || !owner.owner_company_name.trim()) newErrors[`owner_${owner.id}_company_name`] = `${prefix}La razón social es requerida`;
        if (!owner.owner_company_rut || !owner.owner_company_rut.trim()) newErrors[`owner_${owner.id}_company_rut`] = `${prefix}El RUT de la empresa es requerido`;

        // Validaciones para personería jurídica
        if (!owner.constitution_type) newErrors[`owner_${owner.id}_constitution_type`] = `${prefix}El tipo de constitución es requerido para personas jurídicas`;
        if (!owner.constitution_date) newErrors[`owner_${owner.id}_constitution_date`] = `${prefix}La fecha de constitución es requerida para personas jurídicas`;

        // Validaciones condicionales según tipo de constitución
        if (owner.constitution_type === 'empresa_en_un_dia' && (!owner.cve_code || !owner.cve_code.trim())) {
          newErrors[`owner_${owner.id}_cve_code`] = `${prefix}El código CVE es requerido para empresas constituidas en un día`;
        }
        if (owner.constitution_type === 'tradicional') {
          if (!owner.notary_name || !owner.notary_name.trim()) {
            newErrors[`owner_${owner.id}_notary_name`] = `${prefix}El nombre de la notaría es requerido para constituciones tradicionales`;
          }
          if (!owner.repertory_number || !owner.repertory_number.trim()) {
            newErrors[`owner_${owner.id}_repertory_number`] = `${prefix}El número de repertorio es requerido para constituciones tradicionales`;
          }
        }

        // Validaciones para el representante legal
        if (!owner.owner_representative_first_name || !owner.owner_representative_first_name.trim()) newErrors[`owner_${owner.id}_representative_first_name`] = `${prefix}El nombre del representante legal es requerido`;
        if (!owner.owner_representative_paternal_last_name || !owner.owner_representative_paternal_last_name.trim()) newErrors[`owner_${owner.id}_representative_paternal_last_name`] = `${prefix}El apellido paterno del representante legal es requerido`;
        if (!owner.owner_representative_rut || !owner.owner_representative_rut.trim()) newErrors[`owner_${owner.id}_representative_rut`] = `${prefix}El RUT del representante legal es requerido`;

        // Validación de email para representantes legales de personas jurídicas
        if (!owner.owner_representative_email || !owner.owner_representative_email.trim()) {
          newErrors[`owner_${owner.id}_representative_email`] = `${prefix}El email del representante legal es requerido`;
        }
      }

      // Validaciones comunes para ambos tipos (dirección)
      if (!owner.owner_address_street || !owner.owner_address_street.trim()) newErrors[`owner_${owner.id}_address_street`] = `${prefix}La calle del propietario es requerida`;
      if (!owner.owner_address_number || !owner.owner_address_number.trim()) newErrors[`owner_${owner.id}_address_number`] = `${prefix}El número del propietario es requerido`;
      if (!owner.owner_region) newErrors[`owner_${owner.id}_region`] = `${prefix}La región del propietario es requerida`;
      if (!owner.owner_commune) newErrors[`owner_${owner.id}_commune`] = `${prefix}La comuna del propietario es requerida`;
      if (!owner.owner_unit_type || !['Casa', 'Departamento', 'Oficina'].includes(owner.owner_unit_type)) newErrors[`owner_${owner.id}_unit_type`] = `${prefix}El tipo de unidad es requerido`;
    });

    // Validación de duplicados: RUTs y emails únicos entre propietarios
    const ruts = new Map<string, number>();
    const emails = new Map<string, number>();

    owners.forEach((owner, index) => {
      // Validar RUT único
      const rutKey = owner.owner_type === 'natural' ? owner.owner_rut : owner.owner_company_rut;
      if (rutKey && rutKey.trim()) {
        if (ruts.has(rutKey)) {
          const firstIndex = ruts.get(rutKey)!;
          newErrors[`owner_${owner.id}_rut`] = `Este RUT ya está registrado para ${owners.length > 1 ? `el propietario ${firstIndex + 1}` : 'otro propietario'}`;
        } else {
          ruts.set(rutKey, index);
        }
      }

      // Validar email único
      const emailKey = owner.owner_type === 'natural' ? owner.owner_email : owner.owner_company_email;
      if (emailKey && emailKey.trim()) {
        if (emails.has(emailKey)) {
          const firstIndex = emails.get(emailKey)!;
          newErrors[`owner_${owner.id}_email`] = `Este email ya está registrado para ${owners.length > 1 ? `el propietario ${firstIndex + 1}` : 'otro propietario'}`;
        } else {
          emails.set(emailKey, index);
        }
      }
    });

    // Validar documentos de propietarios (solo si ya están inicializados)
    owners.forEach((owner, index) => {
      const ownerPrefix = owners.length > 1 ? `Propietario ${index + 1}` : '';

      if (owner.documents && owner.documents.length > 0) {
        owner.documents.forEach(doc => {
          if (doc.required) {
            const isUploaded = doc.uploaded || (doc.file || doc.url);
            if (!isUploaded) {
              newErrors[`owner_${owner.id}_${doc.type}`] = `${ownerPrefix} ${doc.label} es requerido${ownerPrefix ? '' : ''}`;
            }
          }
        });
      }
    });

    // Validate personería certificate for legal entities - TEMPORARILY DISABLED FOR DEVELOPMENT
    // const hasLegalEntity = owners.some(owner => owner.owner_type === 'juridica');
    // if (hasLegalEntity && !formData.documents.some((doc: any) => doc.document_type === 'personeria_certificate')) {
    //   newErrors.personeria_certificate = 'El certificado de personería es requerido para personas jurídicas';
    // }

    // Validaciones específicas para bodega (Casa, Departamento, Oficina, Bodega)
    if (propertyType === 'Casa' || propertyType === 'Departamento' || propertyType === 'Oficina' || propertyType === 'Bodega') {
      // Validar M² Bodega si tiene bodega
      if (formData.tieneBodega === 'Sí') {
        if (!formData.metrosBodega || parseFloat(formData.metrosBodega) <= 0) {
          newErrors.metrosBodega = 'Los metros cuadrados de bodega son requeridos y deben ser mayor a 0';
        }
      }
    }

    // Photos and documents are now OPTIONAL - no validation required
    setErrors(newErrors);

    const isValid = Object.keys(newErrors).length === 0;
    console.log(`📋 Validación completada. Errores encontrados: ${Object.keys(newErrors).length}`);
    if (!isValid) {
      console.log('❌ Errores de validación:', newErrors);
    } else {
      console.log('✅ Formulario válido');
    }

      return isValid;
    } catch (error) {
      console.error('❌ Error en validación:', error);
      console.error('Stack trace:', error.stack);
      // En caso de error, mostrar mensaje genérico
      setErrors({ submit: 'Error en la validación del formulario. Revisa los campos e intenta nuevamente.' });
      return false;
    }
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

  // Función para subir documentos de un propietario específico
  const uploadOwnerDocuments = async (rentalOwnerId: string, documents: RentalOwnerDocument[]) => {
    const documentsToUpload = documents.filter(doc => doc.file && !doc.url);

    if (documentsToUpload.length === 0) return;

    console.log(`📄 Subiendo ${documentsToUpload.length} documentos para propietario:`, rentalOwnerId);

    for (const doc of documentsToUpload) {
      if (!doc.file) continue;

      try {
        // Generar nombre único para el archivo
        const fileName = `${rentalOwnerId}/${doc.type}/${Date.now()}_${doc.file.name}`;
        const filePath = `rental-owner-documents/${fileName}`;

        // Subir archivo a Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('user-documents')
          .upload(filePath, doc.file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error(`Error uploading owner document ${doc.type}:`, uploadError);
          throw new Error(`Error al subir ${doc.label}`);
        }

        // Obtener URL pública del archivo
        const { data: urlData } = supabase.storage
          .from('user-documents')
          .getPublicUrl(filePath);

        if (!urlData.publicUrl) {
          throw new Error(`Error al obtener URL pública para ${doc.label}`);
        }

        // Guardar registro del documento en la tabla rental_owner_documents
        const { error: dbError } = await supabase
          .from('rental_owner_documents')
          .insert({
            rental_owner_id: rentalOwnerId,
            doc_type: doc.type,
            file_name: doc.file.name,
            file_url: urlData.publicUrl,
            storage_path: filePath,
            uploaded_by: user?.id,
            uploaded_at: new Date().toISOString(),
            created_at: new Date().toISOString()
          });

        if (dbError) {
          console.error('❌ Error insertando registro de documento de propietario:', dbError);
          throw new Error(`Error guardando registro de documento: ${dbError.message}`);
        }

        console.log(`✅ Documento ${doc.type} guardado exitosamente`);
      } catch (error) {
        console.error(`❌ Error procesando documento ${doc.type}:`, error);
        throw error;
      }
    }
  };

  const saveParkingSpaces = async (propertyId: string, parkingSpaces: ParkingSpace[]) => {
    try {
      // For now, we'll store this information in the property metadata
      // In a real implementation, you'd have a parking_spaces table
      const parkingData = {
        parking_spaces: parkingSpaces
      };

      const { error } = await supabase
        .from('properties')
        .update({ parking_spaces: parkingData })
        .eq('id', propertyId);

      if (error) {
        console.error('Error saving parking spaces:', error);
        throw error;
      }

      console.log('✅ Parking spaces saved successfully');
    } catch (error) {
      console.error('Error saving parking spaces:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 Iniciando handleSubmit...');
    console.log('📋 Estado del formulario:', {
      tipoPropiedad: formData.tipoPropiedad,
      address_street: formData.address_street,
      address_number: formData.address_number,
      price: formData.price,
      region: formData.region,
      commune: formData.commune,
    });

    if (!validateForm()) {
      console.log('❌ Validación fallida, deteniendo submit');
      return;
    }
    console.log('✅ Validación exitosa, continuando...');

    // Validate user is authenticated
    if (!user?.id) {
      console.log('❌ Usuario no autenticado');
      setErrors({ submit: 'Debes estar autenticado para publicar una propiedad.' });
      return;
    }
    console.log('✅ Usuario autenticado:', user.id);

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

      // Validate tipo_propiedad (required and cannot be empty)
      if (!formData.tipoPropiedad || formData.tipoPropiedad.trim() === '') {
        throw new Error('El tipo de propiedad es requerido. Por favor selecciona un tipo de propiedad.');
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
        propertyData.estacionamientos = parkingSpaces;
        propertyData.metros_utiles = null; // NO aplica para Bodega
        propertyData.metros_totales = metrosTotales; // Can be null if not provided
        propertyData.tiene_terraza = false;
        // Campos legacy - solo si existen en BD
        if (formData.numeroBodega) {
          propertyData.numero_bodega = formData.numeroBodega;
          propertyData.storage_number = formData.numeroBodega;
        }

      } else if (formData.tipoPropiedad === 'Estacionamiento') {
        // Estacionamiento: Mínimos campos, solo ubicación opcional
        propertyData.bedrooms = 0;
        propertyData.bathrooms = 0;
        propertyData.estacionamientos = 0; // No aplica contar estacionamientos para este tipo
        propertyData.metros_utiles = null; // NO aplica
        propertyData.metros_totales = null; // NO aplica
        propertyData.tiene_terraza = false;
        propertyData.ubicacion_estacionamiento = formData.ubicacionEstacionamiento || null;

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
        propertyData.ubicacion_estacionamiento = parkingSpaces > 0 ? formData.ubicacionEstacionamiento || null : null;

        // Campos específicos de bodega - permitidos para Casa, Departamento, Oficina y Bodega
        if (formData.tipoPropiedad === 'Casa' || formData.tipoPropiedad === 'Departamento' || formData.tipoPropiedad === 'Oficina' || formData.tipoPropiedad === 'Bodega') {
          propertyData.tiene_bodega = formData.tieneBodega === 'Sí';
          propertyData.metros_bodega = metrosBodega;
          propertyData.ubicacion_bodega = formData.ubicacionBodega || null;
        }
      }

      // DEBUGGING: Log propertyData to verify all numeric fields are correctly parsed
      console.log('🏠 PropertyData to submit:', JSON.stringify(propertyData, null, 2));
      console.log('📊 Form data being saved:', {
        tipoPropiedad: formData.tipoPropiedad,
        tieneBodega: formData.tieneBodega,
        metrosBodega: formData.metrosBodega,
        ubicacionBodega: formData.ubicacionBodega,
        ubicacionEstacionamiento: formData.ubicacionEstacionamiento,
        estacionamientos: formData.estacionamientos
      });

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

      // Insert/Update rental owner information and relationships
      if (propertyResult?.id) {
        console.log('💾 Guardando propietarios:', owners.length);

        // First, handle existing relationships for editing
        if (isEditing) {
          // Remove existing relationships for this property
          const { error: deleteError } = await supabase
            .from('property_rental_owners')
            .delete()
            .eq('property_id', propertyResult.id);

          if (deleteError) {
            console.error('❌ Error eliminando relaciones existentes:', deleteError);
            throw new Error(`Error actualizando propietarios: ${deleteError.message}`);
          }

          // Remove existing rental_owners for this property
          const { error: deleteOwnersError } = await supabase
            .from('rental_owners')
            .delete()
            .eq('property_id', propertyResult.id);

          if (deleteOwnersError) {
            console.error('❌ Error eliminando propietarios existentes:', deleteOwnersError);
            throw new Error(`Error actualizando propietarios: ${deleteOwnersError.message}`);
          }
        }

        // Create rental_owners and relationships for each owner
        for (const owner of owners) {
          // Prepare owner data for rental_owners table
          const ownerData: any = {
            property_id: propertyResult.id,
            owner_type: owner.owner_type,
            // Campos comunes
            address_street: owner.owner_address_street,
            address_number: owner.owner_address_number,
            address_department: owner.owner_apartment_number || null,
            address_commune: owner.owner_commune,
            address_region: owner.owner_region,
            phone: owner.owner_phone,
            email: owner.owner_email,
            nationality: owner.owner_nationality,
            unit_type: owner.owner_unit_type || 'Casa', // Nuevo campo requerido
          };

          // Add type-specific fields
          if (owner.owner_type === 'natural') {
            Object.assign(ownerData, {
              first_name: owner.owner_first_name,
              paternal_last_name: owner.owner_paternal_last_name,
              maternal_last_name: owner.owner_maternal_last_name || null,
              rut: owner.owner_rut,
            });
          } else if (owner.owner_type === 'juridica') {
            // Add company fields - explicitly exclude natural person fields
            Object.assign(ownerData, {
              // Explicitly set natural person fields to null for legal entities
              first_name: null,
              paternal_last_name: null,
              maternal_last_name: null,
              rut: null,
              // Company fields
              company_name: owner.owner_company_name,
              company_rut: owner.owner_company_rut,
              company_business: owner.owner_company_business,
              company_email: owner.owner_company_email,
              company_phone: owner.owner_company_phone,
              // Add representative fields
              representative_first_name: owner.owner_representative_first_name,
              representative_paternal_last_name: owner.owner_representative_paternal_last_name,
              representative_maternal_last_name: owner.owner_representative_maternal_last_name,
              representative_rut: owner.owner_representative_rut,
              representative_email: owner.owner_representative_email,
              representative_phone: owner.owner_representative_phone,
              // Add legal entity fields
              constitution_type: owner.constitution_type,
              constitution_date: owner.constitution_date,
              cve_code: owner.cve_code,
              notary_name: owner.notary_name,
              repertory_number: owner.repertory_number,
            });
          }

          console.log(`💾 Guardando propietario ${owner.owner_type}:`, ownerData);

          // Insert into rental_owners
          const { data: ownerResult, error: ownerError } = await supabase
            .from('rental_owners')
            .insert(ownerData)
            .select()
            .single();

          if (ownerError) {
            console.error('❌ Error insertando rental owner:', ownerError);
            const name = owner.owner_type === 'natural'
              ? `${owner.owner_first_name} ${owner.owner_paternal_last_name}`
              : owner.owner_company_name;
            throw new Error(`Error guardando propietario ${name}: ${ownerError.message}`);
          }

          console.log('✅ Rental owner creado con ID:', ownerResult.id);

          // Create relationship in property_rental_owners
          const relationshipData = {
            property_id: propertyResult.id,
            rental_owner_id: ownerResult.id,
            ownership_percentage: owner.ownership_percentage ? parseFloat(owner.ownership_percentage.toString()) : null,
            is_primary_owner: owners.length === 1 ? true : false, // First owner is primary if only one
          };

          const { data: relationshipResult, error: relationshipError } = await supabase
            .from('property_rental_owners')
            .insert(relationshipData)
            .select()
            .single();

          if (relationshipError) {
            console.error('❌ Error creando relación property_rental_owners:', relationshipError);
            throw new Error(`Error creando relación para propietario: ${relationshipError.message}`);
          }

          console.log('✅ Relación property_rental_owners creada con ID:', relationshipResult.id);
          console.log('📋 Datos del propietario:', {
            id: ownerResult.id,
            property_id: ownerResult.property_id,
            type: owner.owner_type,
            name: owner.owner_type === 'natural'
              ? `${ownerResult.first_name} ${ownerResult.paternal_last_name}`
              : ownerResult.company_name,
            percentage: relationshipData.ownership_percentage
          });

          // Upload owner documents if they exist
          if (owner.documents && owner.documents.length > 0) {
            try {
              await uploadOwnerDocuments(ownerResult.id, owner.documents);
              console.log('✅ Documentos del propietario subidos exitosamente');
            } catch (docError) {
              console.error('⚠️ Error al subir documentos del propietario:', docError);
              // No fallar la publicación por error en documentos, pero mostrar advertencia
              alert(`Propiedad creada exitosamente, pero hubo un error al subir algunos documentos del propietario: ${docError instanceof Error ? docError.message : 'Error desconocido'}`);
            }
          }
        }
      }

      // Handle parking spaces
      if (propertyResult?.id && formData.parkingSpaces.length > 0) {
        console.log('🚗 Guardando espacios de estacionamiento:', formData.parkingSpaces.length);
        await saveParkingSpaces(propertyResult.id, formData.parkingSpaces);
      }

      toast.success(isEditing ? 'Propiedad actualizada exitosamente!' : 'Propiedad publicada exitosamente!');

      setCreatedPropertyId(propertyResult.id);
      setShowDocUpload(true);
      window.scrollTo(0, 0);

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
    { key: 'mortgage_lien_certificate', label: 'Certificado de Hipoteca y Gravamen' },
    { key: 'owner_id_copy', label: 'Fotocopia de Cédula de Identidad del Propietario' },
  ];

  // TEMPORARILY DISABLED FOR DEVELOPMENT - Re-enable when document handling is implemented
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
          <div className="p-4 border-b bg-gradient-to-r from-emerald-50 to-green-50">
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

  if (showDocUpload && createdPropertyId) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">¡Propiedad Publicada!</h2>
            <p className="mt-4 text-lg text-gray-600">
              Tu propiedad ha sido creada exitosamente. Ahora puedes subir los documentos legales.
              No te preocupes, puedes hacer esto más tarde si no los tienes a mano.
            </p>
          </div>

          <ProgressiveDocumentUpload
            entityType="property"
            entityId={createdPropertyId}
            requiredDocuments={RENTAL_DOCUMENTS}
            onComplete={() => {
              if (onSuccess) onSuccess();
              else navigate('/portfolio');
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20 rounded-2xl shadow-2xl border border-gray-200">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Building className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            {isEditing ? 'Modificar Propiedad en Arriendo' : 'Publicar Propiedad en Arriendo'}
          </h2>
        </div>
        <div className="bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-white/20">
          <p className="text-gray-600">
            {isEditing
              ? 'Actualiza la información de tu propiedad en arriendo'
              : 'Completa todos los campos para publicar tu propiedad en arriendo'
            }
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Sección 1: Información de la Propiedad */}
          <div className="space-y-3">
            <div className="border-b pb-2">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Building className="h-6 w-6 mr-2 text-emerald-600" />
                Información de la Propiedad
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4">
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
                      // CORREGIDO: Bodega - numeroBodega requerido, campos de bodega permitidos, limpiar campos tradicionales
                      updatedFormData.bedrooms = '0';
                      updatedFormData.bathrooms = '0';
                      // estacionamientos se mantiene para permitir configuración de espacios
                      updatedFormData.metrosUtiles = ''; // NULL en BD
                      // metrosTotales se mantiene (M² de la Bodega)
                      updatedFormData.tieneTerraza = 'No';
                      updatedFormData.tieneSalaEstar = 'No';
                      // campos de bodega se mantienen para permitir configuración de espacios adicionales
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
                      // Casa, Departamento - Campos tradicionales completos
                      // Para Casa y Departamento, mantener campos de bodega ya que son permitidos
                      // Limpiar solo parcela_number que no aplica
                      updatedFormData.parcela_number = '';
                      // Mantener tieneBodega, metrosBodega, ubicacionBodega, numeroBodega
                      // Mantener bedrooms, bathrooms, estacionamientos, metrosUtiles, metrosTotales, terraza
                    }

                    setFormData(updatedFormData);
                  }}
                  className="w-full px-3 py-2 text-sm border-2 sm:border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
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
                      className={`w-full px-3 py-2 text-sm border-2 sm:border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        errors.numeroBodega ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {errors.numeroBodega && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.numeroBodega}
                      </p>
                    )}
                    <p className="mt-1.5 text-xs text-gray-600">
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
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                    errors.address_street ? 'border-red-500 bg-red-50' : ''
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
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                    errors.address_number ? 'border-red-500 bg-red-50' : ''
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

              {/* Número de Estacionamiento - solo para tipo Estacionamiento */}
              {formData.tipoPropiedad === 'Estacionamiento' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Número de Estacionamiento *
                  </label>
                  <input
                    type="text"
                    required={formData.tipoPropiedad === 'Estacionamiento'}
                    value={formData.ubicacionEstacionamiento || ''}
                    onChange={(e) => setFormData({ ...formData, ubicacionEstacionamiento: e.target.value })}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                      errors.ubicacionEstacionamiento ? 'border-red-500 bg-red-50' : ''
                    }`}
                    placeholder="Ej: 25B"
                    maxLength="16"
                  />
                  {errors.ubicacionEstacionamiento && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.ubicacionEstacionamiento}
                    </p>
                  )}
                </div>
              )}

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
                    className="w-full px-3 py-2 text-sm border-2 sm:border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder="Ej: 45A"
                  />
                </div>
              )}

              {/* Región y Comuna */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Región *
                  </label>
                  <select
                    required
                    value={formData.region}
                    onChange={(e) => handleRegionChange(e.target.value)}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                      errors.region ? 'border-red-500 bg-red-50' : ''
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
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                      errors.commune ? 'border-red-500 bg-red-50' : ''
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
                    className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
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
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder="50000"
                  />
                </div>
              </div>

              {/* Dormitorios y Baños - Solo para Casa y Departamento */}
              {['Casa', 'Departamento'].includes(propertyType) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Dormitorios
                    </label>
                    <select
                      value={formData.bedrooms}
                      onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                      className="w-full px-3 py-2 text-sm border-2 sm:border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
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
                      className="w-full px-3 py-2 text-sm border-2 sm:border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
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

              {/* Estacionamientos - Ocultar para Bodega, Estacionamiento, Parcela, Casa y Departamento */}
              {propertyType !== 'Bodega' && !isParking && propertyType !== 'Parcela' && propertyType !== 'Casa' && propertyType !== 'Departamento' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Estacionamientos
                  </label>
                  <select
                    value={formData.estacionamientos}
                    onChange={(e) => setFormData({ ...formData, estacionamientos: e.target.value })}
                    className="w-full px-3 py-2 text-sm border-2 sm:border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
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

              {/* Ubicación de Estacionamientos - Ocultar para Bodega, Estacionamiento, Parcela, Casa y Departamento */}
              {propertyType !== 'Bodega' && !isParking && propertyType !== 'Parcela' && propertyType !== 'Casa' && propertyType !== 'Departamento' && formData.estacionamientos !== '0' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ubicación/Nº Estacionamiento(s) (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.ubicacionEstacionamiento}
                    onChange={(e) => setFormData({ ...formData, ubicacionEstacionamiento: e.target.value })}
                    className="w-full px-3 py-2 text-sm border-2 sm:border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder="Ej: E-21, E-22 (piso -2)"
                  />
                </div>
              )}

              {/* Campos de área condicionales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 transition-all duration-300">
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
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                        errors.metrosUtiles ? 'border-red-500 bg-red-50' : ''
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
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                        errors.metrosTotales ? 'border-red-500 bg-red-50' : ''
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
                    className="w-full px-3 py-2 text-sm border-2 sm:border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                  <p className="mt-1.5 text-xs text-gray-600">
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
                    className="w-full px-3 py-2 text-sm border-2 sm:border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
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
                  className="w-full px-3 py-2 text-sm border-2 sm:border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-vertical min-h-[80px]"
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
            <div className="space-y-3">
              <div className="border-b pb-2">
                <h2 className="text-xl font-bold text-gray-900">Características Internas</h2>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Sistema de Agua Caliente */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Agua Caliente
                  </label>
                  <select
                    value={formData.sistemaAguaCaliente}
                    onChange={(e) => setFormData({ ...formData, sistemaAguaCaliente: e.target.value })}
                    className="w-full px-3 py-2 text-sm border-2 sm:border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
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
                    className="w-full px-3 py-2 text-sm border-2 sm:border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
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
                    className="w-full px-3 py-2 text-sm border-2 sm:border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  >
                    <option value="No">No</option>
                    <option value="Sí">Sí</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Sección 2.5: Espacios de Almacenamiento - Para Casa, Departamento, Oficina y Bodega */}
          {(propertyType === 'Casa' || propertyType === 'Departamento' || propertyType === 'Oficina' || propertyType === 'Bodega') && (
            <div className="space-y-3">
              <div className="border-b pb-2">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <svg className="h-6 w-6 mr-2 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Espacios de Almacenamiento
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {propertyType === 'Bodega'
                    ? 'Configura espacios de almacenamiento adicionales además del espacio principal'
                    : 'Configura espacios de almacenamiento disponibles en la propiedad'
                  }
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {propertyType === 'Bodega' ? '¿Tiene Espacios Adicionales?' : '¿Tiene Bodega?'}
                    </label>
                    <select
                      value={formData.tieneBodega}
                      onChange={(e) => setFormData({
                        ...formData,
                        tieneBodega: e.target.value,
                        metrosBodega: e.target.value === 'No' ? '' : formData.metrosBodega,
                        ubicacionBodega: e.target.value === 'No' ? '' : formData.ubicacionBodega
                      })}
                      className="w-full px-3 py-2 text-sm border-2 sm:border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    >
                      <option value="No">No</option>
                      <option value="Sí">Sí</option>
                    </select>
                  </div>

                  {formData.tieneBodega === 'Sí' && (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          {propertyType === 'Bodega' ? 'M² Espacios Adicionales' : 'M² Bodega'} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          required={formData.tieneBodega === 'Sí'}
                          value={formData.metrosBodega}
                          onChange={(e) => setFormData({ ...formData, metrosBodega: e.target.value })}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                            errors.metrosBodega ? 'border-red-500 bg-red-50' : ''
                          }`}
                          placeholder={propertyType === 'Bodega' ? "Ej: 25" : "Ej: 5"}
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
                          {propertyType === 'Bodega' ? 'Ubicación/Nº Espacios Adicionales' : 'Ubicación/Nº Bodega'} (Opcional)
                        </label>
                        <input
                          type="text"
                          maxLength={50}
                          value={formData.ubicacionBodega}
                          onChange={(e) => setFormData({ ...formData, ubicacionBodega: e.target.value })}
                          className="w-full px-3 py-2 text-sm border-2 sm:border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                          placeholder={propertyType === 'Bodega' ? "Ej: Área B-2, Nivel 2" : "Ej: B-115 (piso -1)"}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Sección 3.5: Características de Oficina - Solo para Oficinas */}
          {propertyType === 'Oficina' && (
            <div className="space-y-3">
              <div className="border-b pb-2">
                <h2 className="text-xl font-bold text-gray-900">Características de Oficina</h2>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Sección de Oficina sin campos de bodega - ahora están unificados */}
              </div>
            </div>
          )}


          {/* Sección 3.7: Estacionamientos */}
          {(propertyType === 'Casa' || propertyType === 'Departamento' || propertyType === 'Oficina' || propertyType === 'Parcela' || propertyType === 'Bodega') && (
            <div className="space-y-3">
              <div className="border-b pb-2">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <Car className="h-6 w-6 mr-2 text-blue-600" />
                  Estacionamientos
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Configura los espacios de estacionamiento disponibles
                </p>
              </div>

              <ParkingSpaceForm
                parkingSpaces={formData.parkingSpaces}
                onChange={(parkingSpaces) => setFormData({ ...formData, parkingSpaces })}
                propertyId={isEditing ? initialData?.id : undefined}
              />
            </div>
          )}

          {/* Sección 4: Datos del Propietario */}
          <div className="space-y-3">
            <div className="border-b pb-2 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Datos del Propietario</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Propietarios: {owners.length}/5</span>
                {owners.length < 5 && (
                  <button
                    type="button"
                    onClick={addOwner}
                    className="px-3 py-1 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600 transition-colors"
                  >
                    + Agregar Propietario
                  </button>
                )}
              </div>
            </div>

            {owners.map((owner, index) => (
              <div key={owner.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Propietario {index + 1}
                  </h3>
                  {owners.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeOwner(owner.id)}
                      className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {/* Selector de Tipo de Propietario */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tipo de Propietario *
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="relative">
                        <input
                          type="radio"
                          name={`owner_type_${owner.id}`}
                          value="natural"
                          checked={owner.owner_type === 'natural'}
                          onChange={() => updateOwner(owner.id, 'owner_type', 'natural')}
                          className="sr-only"
                        />
                        <div className={`p-3 border-2 rounded-xl cursor-pointer transition-all ${
                          owner.owner_type === 'natural'
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-gray-200 hover:border-emerald-300'
                        }`}>
                          <div className="flex items-center gap-3">
                            <User className="h-5 w-5 text-emerald-600" />
                            <div>
                              <div className="font-medium text-gray-900">Persona Natural</div>
                              <div className="text-sm text-gray-600">Individuo</div>
                            </div>
                          </div>
                        </div>
                      </label>

                      <label className="relative">
                        <input
                          type="radio"
                          name={`owner_type_${owner.id}`}
                          value="juridica"
                          checked={owner.owner_type === 'juridica'}
                          onChange={() => updateOwner(owner.id, 'owner_type', 'juridica')}
                          className="sr-only"
                        />
                        <div className={`p-3 border-2 rounded-xl cursor-pointer transition-all ${
                          owner.owner_type === 'juridica'
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-gray-200 hover:border-emerald-300'
                        }`}>
                          <div className="flex items-center gap-3">
                            <Building2 className="h-5 w-5 text-emerald-600" />
                            <div>
                              <div className="font-medium text-gray-900">Persona Jurídica</div>
                              <div className="text-sm text-gray-600">Empresa</div>
                            </div>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Campos de Personería Jurídica - Solo para Persona Jurídica */}
                  {owner.owner_type === 'juridica' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                      <h3 className="text-lg font-semibold text-blue-800 border-b border-blue-200 pb-2">
                        Datos de Personería Jurídica
                      </h3>

                      {/* Tipo de Constitución */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          ¿La persona jurídica está constituida por Empresa en un Día / Tradicional? *
                        </label>
                        <select
                          required={owner.owner_type === 'juridica'}
                          value={owner.constitution_type || ''}
                          onChange={(e) => updateOwner(owner.id, 'constitution_type', e.target.value)}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                            errors[`owner_${owner.id}_constitution_type`] ? 'border-red-500 bg-red-50' : ''
                          }`}
                        >
                          <option value="">Seleccionar tipo de constitución</option>
                          <option value="empresa_en_un_dia">Empresa en un Día</option>
                          <option value="tradicional">Tradicional</option>
                        </select>
                        {errors[`owner_${owner.id}_constitution_type`] && (
                          <p className="mt-1 text-sm text-red-600 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {errors[`owner_${owner.id}_constitution_type`]}
                          </p>
                        )}
                      </div>

                      {/* Campos condicionales según tipo de constitución */}
                      {owner.constitution_type && (
                        <>
                          {/* Fecha de Constitución - Siempre requerida */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Fecha de Constitución *
                            </label>
                            <input
                              type="date"
                              required={owner.owner_type === 'juridica'}
                              value={owner.constitution_date || ''}
                              onChange={(e) => updateOwner(owner.id, 'constitution_date', e.target.value)}
                              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                                errors[`owner_${owner.id}_constitution_date`] ? 'border-red-500 bg-red-50' : ''
                              }`}
                            />
                            {errors[`owner_${owner.id}_constitution_date`] && (
                              <p className="mt-1 text-sm text-red-600 flex items-center">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                {errors[`owner_${owner.id}_constitution_date`]}
                              </p>
                            )}
                          </div>

                          {/* Campos específicos para Empresa en un Día */}
                          {owner.constitution_type === 'empresa_en_un_dia' && (
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                CVE (Código de Verificación Empresa) *
                              </label>
                              <input
                                type="text"
                                required={owner.constitution_type === 'empresa_en_un_dia'}
                                value={owner.cve_code || ''}
                                onChange={(e) => updateOwner(owner.id, 'cve_code', e.target.value)}
                                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                                  errors[`owner_${owner.id}_cve_code`] ? 'border-red-500 bg-red-50' : ''
                                }`}
                                placeholder="Ej: CVE123456789"
                              />
                              {errors[`owner_${owner.id}_cve_code`] && (
                                <p className="mt-1 text-sm text-red-600 flex items-center">
                                  <AlertCircle className="h-4 w-4 mr-1" />
                                  {errors[`owner_${owner.id}_cve_code`]}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Campos específicos para Tradicional */}
                          {owner.constitution_type === 'tradicional' && (
                            <>
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  Notaría *
                                </label>
                                <input
                                  type="text"
                                  required={owner.constitution_type === 'tradicional'}
                                  value={owner.notary_name || ''}
                                  onChange={(e) => updateOwner(owner.id, 'notary_name', e.target.value)}
                                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                                    errors[`owner_${owner.id}_notary_name`] ? 'border-red-500 bg-red-50' : ''
                                  }`}
                                  placeholder="Ej: Notaría Central de Santiago"
                                />
                                {errors[`owner_${owner.id}_notary_name`] && (
                                  <p className="mt-1 text-sm text-red-600 flex items-center">
                                    <AlertCircle className="h-4 w-4 mr-1" />
                                    {errors[`owner_${owner.id}_notary_name`]}
                                  </p>
                                )}
                              </div>

                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  N° Repertorio *
                                </label>
                                <input
                                  type="text"
                                  required={owner.constitution_type === 'tradicional'}
                                  value={owner.repertory_number || ''}
                                  onChange={(e) => updateOwner(owner.id, 'repertory_number', e.target.value)}
                                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                                    errors[`owner_${owner.id}_repertory_number`] ? 'border-red-500 bg-red-50' : ''
                                  }`}
                                  placeholder="Ej: 12345"
                                />
                                {errors[`owner_${owner.id}_repertory_number`] && (
                                  <p className="mt-1 text-sm text-red-600 flex items-center">
                                    <AlertCircle className="h-4 w-4 mr-1" />
                                    {errors[`owner_${owner.id}_repertory_number`]}
                                  </p>
                                )}
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Campos para Persona Natural */}
                  {owner.owner_type === 'natural' && (
                    <>
                      {/* Nombres del Propietario */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Nombres del Propietario *
                        </label>
                        <input
                          type="text"
                          required={owner.owner_type === 'natural'}
                          value={owner.owner_first_name || ''}
                          onChange={(e) => updateOwner(owner.id, 'owner_first_name', e.target.value)}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                            errors[`owner_${owner.id}_first_name`] ? 'border-red-500 bg-red-50' : ''
                          }`}
                          placeholder="Ej: Juan Carlos"
                        />
                        {errors[`owner_${owner.id}_first_name`] && (
                          <p className="mt-1 text-sm text-red-600 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {errors[`owner_${owner.id}_first_name`]}
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
                          required={owner.owner_type === 'natural'}
                          value={owner.owner_paternal_last_name || ''}
                          onChange={(e) => updateOwner(owner.id, 'owner_paternal_last_name', e.target.value)}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                            errors[`owner_${owner.id}_paternal_last_name`] ? 'border-red-500 bg-red-50' : ''
                          }`}
                          placeholder="Ej: Pérez"
                        />
                        {errors[`owner_${owner.id}_paternal_last_name`] && (
                          <p className="mt-1 text-sm text-red-600 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {errors[`owner_${owner.id}_paternal_last_name`]}
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
                          required={owner.owner_type === 'natural'}
                          value={owner.owner_maternal_last_name || ''}
                          onChange={(e) => updateOwner(owner.id, 'owner_maternal_last_name', e.target.value)}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                            errors[`owner_${owner.id}_maternal_last_name`] ? 'border-red-500 bg-red-50' : ''
                          }`}
                          placeholder="Ej: González"
                        />
                        {errors[`owner_${owner.id}_maternal_last_name`] && (
                          <p className="mt-1 text-sm text-red-600 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {errors[`owner_${owner.id}_maternal_last_name`]}
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
                          required={owner.owner_type === 'natural'}
                          value={owner.owner_rut || ''}
                          onChange={(e) => updateOwner(owner.id, 'owner_rut', e.target.value)}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                            errors[`owner_${owner.id}_rut`] ? 'border-red-500 bg-red-50' : ''
                          }`}
                          placeholder="Ej: 12.345.678-9"
                        />
                        {errors[`owner_${owner.id}_rut`] && (
                          <p className="mt-1 text-sm text-red-600 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {errors[`owner_${owner.id}_rut`]}
                          </p>
                        )}
                      </div>

                      {/* Nacionalidad del Propietario */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Nacionalidad del Propietario *
                        </label>
                        <select
                          required={owner.owner_type === 'natural'}
                          value={owner.owner_nationality || ''}
                          onChange={(e) => updateOwner(owner.id, 'owner_nationality', e.target.value)}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                            errors[`owner_${owner.id}_nationality`] ? 'border-red-500 bg-red-50' : ''
                          }`}
                        >
                          <option value="">Seleccionar nacionalidad</option>
                          {NATIONALITIES.map((nationality) => (
                            <option key={nationality} value={nationality}>
                              {nationality}
                            </option>
                          ))}
                        </select>
                        {errors[`owner_${owner.id}_nationality`] && (
                          <p className="mt-1 text-sm text-red-600 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {errors[`owner_${owner.id}_nationality`]}
                          </p>
                        )}
                      </div>


                      {/* Email y Teléfono del Propietario */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Email */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Email del Propietario {owner.owner_type === 'natural' && '*'}
                          </label>
                          <input
                            type="email"
                            required={owner.owner_type === 'natural'}
                            value={owner.owner_email || ''}
                            onChange={(e) => updateOwner(owner.id, 'owner_email', e.target.value)}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                              errors[`owner_${owner.id}_email`] ? 'border-red-500 bg-red-50' : ''
                            }`}
                            placeholder="Ej: propietario@ejemplo.com"
                          />
                          {errors[`owner_${owner.id}_email`] && (
                            <p className="mt-1 text-sm text-red-600 flex items-center">
                              <AlertCircle className="h-4 w-4 mr-1" />
                              {errors[`owner_${owner.id}_email`]}
                            </p>
                          )}
                        </div>

                        {/* Teléfono */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Teléfono del Propietario (Opcional)
                          </label>
                          <input
                            type="tel"
                            value={owner.owner_phone || ''}
                            onChange={(e) => updateOwner(owner.id, 'owner_phone', e.target.value)}
                            className="w-full px-3 py-2 text-sm border-2 sm:border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                            placeholder="Ej: +56 9 1234 5678"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Campos para Persona Jurídica */}
                  {owner.owner_type === 'juridica' && (
                    <>
                      <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Datos de la Empresa</h3>

                      {/* Razón Social */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Razón Social *
                        </label>
                        <input
                          type="text"
                          required={owner.owner_type === 'juridica'}
                          value={owner.owner_company_name || ''}
                          onChange={(e) => updateOwner(owner.id, 'owner_company_name', e.target.value)}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                            errors[`owner_${owner.id}_company_name`] ? 'border-red-500 bg-red-50' : ''
                          }`}
                          placeholder="Ej: Inmobiliaria XYZ Ltda."
                        />
                        {errors[`owner_${owner.id}_company_name`] && (
                          <p className="mt-1 text-sm text-red-600 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {errors[`owner_${owner.id}_company_name`]}
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
                          required={owner.owner_type === 'juridica'}
                          value={owner.owner_company_rut || ''}
                          onChange={(e) => updateOwner(owner.id, 'owner_company_rut', e.target.value)}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                            errors[`owner_${owner.id}_company_rut`] ? 'border-red-500 bg-red-50' : ''
                          }`}
                          placeholder="Ej: 76.123.456-7"
                        />
                        {errors[`owner_${owner.id}_company_rut`] && (
                          <p className="mt-1 text-sm text-red-600 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {errors[`owner_${owner.id}_company_rut`]}
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
                          required={owner.owner_type === 'juridica'}
                          value={owner.owner_representative_first_name || ''}
                          onChange={(e) => updateOwner(owner.id, 'owner_representative_first_name', e.target.value)}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                            errors[`owner_${owner.id}_representative_first_name`] ? 'border-red-500 bg-red-50' : ''
                          }`}
                          placeholder="Ej: María José"
                        />
                        {errors[`owner_${owner.id}_representative_first_name`] && (
                          <p className="mt-1 text-sm text-red-600 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {errors[`owner_${owner.id}_representative_first_name`]}
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
                          required={owner.owner_type === 'juridica'}
                          value={owner.owner_representative_paternal_last_name || ''}
                          onChange={(e) => updateOwner(owner.id, 'owner_representative_paternal_last_name', e.target.value)}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                            errors[`owner_${owner.id}_representative_paternal_last_name`] ? 'border-red-500 bg-red-50' : ''
                          }`}
                          placeholder="Ej: Silva"
                        />
                        {errors[`owner_${owner.id}_representative_paternal_last_name`] && (
                          <p className="mt-1 text-sm text-red-600 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {errors[`owner_${owner.id}_representative_paternal_last_name`]}
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
                          value={owner.owner_representative_maternal_last_name || ''}
                          onChange={(e) => updateOwner(owner.id, 'owner_representative_maternal_last_name', e.target.value)}
                          className="w-full px-3 py-2 text-sm border-2 sm:border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
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
                          required={owner.owner_type === 'juridica'}
                          value={owner.owner_representative_rut || ''}
                          onChange={(e) => updateOwner(owner.id, 'owner_representative_rut', e.target.value)}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                            errors[`owner_${owner.id}_representative_rut`] ? 'border-red-500 bg-red-50' : ''
                          }`}
                          placeholder="Ej: 15.678.901-2"
                        />
                        {errors[`owner_${owner.id}_representative_rut`] && (
                          <p className="mt-1 text-sm text-red-600 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {errors[`owner_${owner.id}_representative_rut`]}
                          </p>
                        )}
                      </div>

                      {/* Email y Teléfono del Representante Legal */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Email */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Email del Representante Legal {owner.owner_type === 'juridica' && '*'}
                          </label>
                          <input
                            type="email"
                            required={owner.owner_type === 'juridica'}
                            value={owner.owner_representative_email || ''}
                            onChange={(e) => updateOwner(owner.id, 'owner_representative_email', e.target.value)}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                              errors[`owner_${owner.id}_representative_email`] ? 'border-red-500 bg-red-50' : ''
                            }`}
                            placeholder="Ej: representante@empresa.com"
                          />
                          {errors[`owner_${owner.id}_representative_email`] && (
                            <p className="mt-1 text-sm text-red-600 flex items-center">
                              <AlertCircle className="h-4 w-4 mr-1" />
                              {errors[`owner_${owner.id}_representative_email`]}
                            </p>
                          )}
                        </div>

                        {/* Teléfono */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Teléfono del Representante Legal (Opcional)
                          </label>
                          <input
                            type="tel"
                            value={owner.owner_representative_phone || ''}
                            onChange={(e) => updateOwner(owner.id, 'owner_representative_phone', e.target.value)}
                            className="w-full px-3 py-2 text-sm border-2 sm:border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                            placeholder="Ej: +56 9 1234 5678"
                          />
                        </div>
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
                      value={owner.owner_address_street || ''}
                      onChange={(e) => updateOwner(owner.id, 'owner_address_street', e.target.value)}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                        errors[`owner_${owner.id}_address_street`] ? 'border-red-500 bg-red-50' : ''
                      }`}
                      placeholder="Ej: Av. Providencia"
                    />
                    {errors[`owner_${owner.id}_address_street`] && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors[`owner_${owner.id}_address_street`]}
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
                      value={owner.owner_address_number || ''}
                      onChange={(e) => updateOwner(owner.id, 'owner_address_number', e.target.value)}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                        errors[`owner_${owner.id}_address_number`] ? 'border-red-500 bg-red-50' : ''
                      }`}
                      placeholder="Ej: 2500"
                    />
                    {errors[`owner_${owner.id}_address_number`] && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors[`owner_${owner.id}_address_number`]}
                      </p>
                    )}
                  </div>

                  {/* Tipo de Unidad */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Tipo de unidad *
                    </label>
                    <div className="flex gap-6">
                      {['Casa', 'Departamento', 'Oficina'].map((unitType) => (
                        <label key={unitType} className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name={`unitType_${owner.id}`}
                            value={unitType}
                            checked={owner.owner_unit_type === unitType}
                            onChange={(e) => updateOwner(owner.id, 'owner_unit_type', e.target.value)}
                            className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500 focus:ring-2"
                            required
                          />
                          <span className="ml-2 text-sm font-medium text-gray-700">
                            {unitType}
                          </span>
                        </label>
                      ))}
                    </div>
                    {errors[`owner_${owner.id}_unit_type`] && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors[`owner_${owner.id}_unit_type`]}
                      </p>
                    )}
                  </div>

                  {/* N° Depto/Casa/Oficina (Opcional) */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      N° Depto/Casa/Oficina (Opcional)
                    </label>
                    <input
                      type="text"
                      value={owner.owner_apartment_number || ''}
                      onChange={(e) => updateOwner(owner.id, 'owner_apartment_number', e.target.value)}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                        errors[`owner_${owner.id}_apartment_number`] ? 'border-red-500 bg-red-50' : ''
                      }`}
                      placeholder="Ej: 405B"
                    />
                    {errors[`owner_${owner.id}_apartment_number`] && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors[`owner_${owner.id}_apartment_number`]}
                      </p>
                    )}
                    <p className="mt-1 text-sm text-gray-600">
                      Completa si aplica
                    </p>
                  </div>

                  {/* Región y Comuna del Propietario */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Región del Propietario *
                      </label>
                      <select
                        required
                        value={owner.owner_region || ''}
                        onChange={(e) => updateOwner(owner.id, 'owner_region', e.target.value)}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                          errors[`owner_${owner.id}_region`] ? 'border-red-500 bg-red-50' : ''
                        }`}
                      >
                        <option value="">Seleccionar región</option>
                        {Object.entries(CHILE_REGIONS_COMMUNES).map(([key, region]) => (
                          <option key={key} value={key}>{region.name}</option>
                        ))}
                      </select>
                      {errors[`owner_${owner.id}_region`] && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors[`owner_${owner.id}_region`]}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Comuna del Propietario *
                      </label>
                      <select
                        required
                        value={owner.owner_commune || ''}
                        onChange={(e) => updateOwner(owner.id, 'owner_commune', e.target.value)}
                        disabled={!owner.owner_region}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                          errors[`owner_${owner.id}_commune`] ? 'border-red-500 bg-red-50' : ''
                        } ${!owner.owner_region ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      >
                        <option value="">
                          {owner.owner_region ? 'Seleccionar comuna' : 'Primero selecciona una región'}
                        </option>
                        {owner.owner_region && getAvailableCommunes(owner.owner_region).map((commune) => (
                          <option key={commune} value={commune}>{commune}</option>
                        ))}
                      </select>
                      {errors[`owner_${owner.id}_commune`] && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors[`owner_${owner.id}_commune`]}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Porcentaje de Propiedad */}
                  {owners.length > 1 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Porcentaje de Propiedad (Opcional)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={owner.ownership_percentage || ''}
                          onChange={(e) => updateOwner(owner.id, 'ownership_percentage', e.target.value)}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                            errors[`owner_${owner.id}_ownership_percentage`] ? 'border-red-500 bg-red-50' : ''
                          }`}
                          placeholder="Ej: 50.00"
                        />
                        <p className="mt-1 text-sm text-gray-600">
                          Si no se especifica, se asumirá propiedad igualitaria entre todos los propietarios.
                        </p>
                        {errors[`owner_${owner.id}_ownership_percentage`] && (
                          <p className="mt-1 text-sm text-red-600 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {errors[`owner_${owner.id}_ownership_percentage`]}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Documentos específicos del propietario */}
                  {((owner.documents && owner.documents.length > 0) || owner.owner_type === 'natural') && (
                    <div className="border-t pt-6">
                      <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-emerald-600" />
                        Documentos Requeridos
                      </h4>

                      <div className="grid gap-3">
                        {owner.documents.map((doc) => {
                          const isUploaded = doc.uploaded || (doc.file || doc.url);

                          return (
                            <div key={doc.type} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                              <div className="flex-shrink-0">
                                <FileText className="h-5 w-5 text-gray-400" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-900 truncate">{doc.label}</span>
                                  {doc.required && (
                                    <span className="text-xs text-red-600 font-medium">*</span>
                                  )}
                                </div>
                                {isUploaded && (
                                  <div className="flex items-center gap-2 mt-1">
                                    <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                                    <span className="text-sm text-green-700">
                                      {doc.file?.name || 'Documento subido'}
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-2 flex-shrink-0">
                                {isUploaded ? (
                                  <button
                                    type="button"
                                    onClick={() => handleOwnerDocumentRemove(owner.id, doc.type)}
                                    className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                                  >
                                    <X className="h-4 w-4" />
                                    Remover
                                  </button>
                                ) : (
                                  <label className="flex items-center gap-1 px-3 py-1 text-sm text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer">
                                    <Upload className="h-4 w-4" />
                                    Subir
                                    <input
                                      type="file"
                                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          handleOwnerDocumentUpload(owner.id, doc.type, file);
                                        }
                                      }}
                                      className="hidden"
                                    />
                                  </label>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                        <p className="text-xs text-emerald-800">
                          <strong>Nota:</strong> Los documentos marcados con (*) son obligatorios según la normativa chilena.
                          El poder del representante es opcional y solo requerido en casos específicos.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            </div>

          {/* Sección 3: Fotos de la Propiedad */}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div className="bg-white border-2 border-blue-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Documentos Legales</h2>
                <p className="text-sm text-gray-600">
                  Estos documentos son necesarios para el arriendo, pero puedes cargarlos después de publicar la propiedad.
                </p>
              </div>
            </div>

            {isEditing && initialData?.id ? (
              <div className="mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-green-800">
                    <strong>Modo Edición:</strong> Puedes gestionar los documentos directamente aquí.
                  </p>
                </div>
                <ProgressiveDocumentUpload
                  entityType="property"
                  entityId={initialData.id}
                  requiredDocuments={RENTAL_DOCUMENTS}
                />
              </div>
            ) : (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-blue-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">Carga Progresiva de Documentos</h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>
                          No es necesario que tengas todos los documentos ahora. Podrás subirlos en cualquier momento desde tu panel de control
                          o después de crear la publicación.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-75">
                   {/* List of documents just for display */}
                   {RENTAL_DOCUMENTS.map(doc => (
                     <div key={doc.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                       <div className="flex items-center justify-between">
                         <span className="text-sm font-medium text-gray-700">{doc.label}</span>
                         <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                           OPCIONAL
                         </span>
                       </div>
                     </div>
                   ))}
                </div>
              </>
            )}
          </div>

          {/* Estado de carga */}
          {uploading && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-lg flex items-center">
              <Loader2 className="h-5 w-5 mr-3 animate-spin" />
              Subiendo archivos...
            </div>
          )}

          {/* Error de envío */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg flex items-center">
              <AlertCircle className="h-5 w-5 mr-3" />
              {errors.submit}
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end pt-8">
            <button
              type="button"
              onClick={() => navigate('/portfolio')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-semibold shadow-md hover:shadow-lg touch-manipulation"
            >
              <X className="h-5 w-5" />
              <span>Cancelar</span>
            </button>
            <button
              type="submit"
              disabled={loading || uploading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Publicando...</span>
                </>
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  <span>Publicar Propiedad en Arriendo</span>
                </>
              )}
            </button>
          </div>
        </form>
    </div>
  );
};
