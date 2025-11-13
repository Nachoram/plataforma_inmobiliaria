import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, Property } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Building, AlertCircle, User, DollarSign, FileText, X, Upload, Image } from 'lucide-react';
import { DocumentSection } from '../common/DocumentUploader';

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

interface SalePublicationFormProps {
  initialData?: Property;
  isEditing?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface SaleDocument {
  type: string;
  label: string;
  required?: boolean;
  file?: File;
  url?: string;
  uploaded?: boolean;
}

// Interface para documentos de propietario
interface SaleOwnerDocument {
  type: string;
  label: string;
  required: boolean;
  file?: File;
  url?: string;
  uploaded?: boolean;
}

// Interface para propietario individual en ventas
interface SaleOwner {
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
  owner_nationality?: string;
  // Porcentaje de propiedad (opcional)
  ownership_percentage?: number;
  // Documentos específicos del propietario
  documents?: SaleOwnerDocument[];
}

export const SalePublicationForm: React.FC<SalePublicationFormProps> = ({
  initialData,
  isEditing = false,
  onSuccess,
  onCancel
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Estado para documentos de estudio de título
  const [saleDocuments, setSaleDocuments] = useState<SaleDocument[]>([]);

  // Estado para propietarios
  const [saleOwners, setSaleOwners] = useState<SaleOwner[]>([]);

  // Estado para fotos
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  // Estado para el tipo de propiedad seleccionado
  const [propertyType, setPropertyType] = useState(() => {
    return isEditing && initialData ? initialData.tipo_propiedad || 'Casa' : 'Casa';
  });

  // Constante para verificar si es estacionamiento
  const isParking = propertyType === 'Estacionamiento';

  // Inicializar documentos cuando el componente se monte
  useEffect(() => {
    setSaleDocuments(getRequiredSaleDocuments());
  }, []);

  // Inicializar propietarios cuando el componente se monte
  useEffect(() => {
    setSaleOwners(getInitialSaleOwners());
  }, []);

  // Cargar fotos existentes cuando se está editando
  useEffect(() => {
    if (isEditing && initialData?.property_images) {
      console.log('🖼️ SALE FORM: Loading existing photos:', initialData.property_images.length);
      setPhotoPreviews(initialData.property_images.map(img => img.image_url));
    }
  }, [isEditing, initialData]);

  // Load owners for editing
  useEffect(() => {
    const loadOwnersForEditing = async () => {
      if (!isEditing || !initialData?.id) return;

      console.log('🔄 Loading owners for editing sale property:', initialData.id);

      try {
        // Load owners with their relationships
        const { data: relationships, error: relError } = await supabase
          .from('property_sale_owners')
          .select(`
            ownership_percentage,
            is_primary_owner,
            sale_owner_id,
            sale_owners!inner(*)
          `)
          .eq('property_id', initialData.id);

        if (relError) {
          console.error('❌ Error loading owner relationships:', relError);
          return;
        }

        if (!relationships || relationships.length === 0) {
          console.log('⚠️ No owners found for property, using default owner');
          setSaleOwners(getInitialSaleOwners);
          return;
        }

        // Convert database records to SaleOwner interface
        const loadedOwners: SaleOwner[] = relationships
          .sort((a, b) => (b.is_primary_owner ? 1 : 0) - (a.is_primary_owner ? 1 : 0)) // Primary first
          .map((rel: any, index: number) => {
            const ownerData = rel.sale_owners;
            const owner: SaleOwner = {
              id: `loaded-owner-${index}`,
              owner_type: ownerData.owner_type || 'natural',
              // Address fields (common)
              owner_address_street: ownerData.address_street || '',
              owner_address_number: ownerData.address_number || '',
              owner_region: ownerData.address_region || '',
              owner_commune: ownerData.address_commune || '',
              owner_nationality: ownerData.nationality || '',
              owner_email: ownerData.email || '',
              owner_phone: ownerData.phone || '',
              // Natural person fields
              owner_first_name: ownerData.first_name || '',
              owner_paternal_last_name: ownerData.paternal_last_name || '',
              owner_maternal_last_name: ownerData.maternal_last_name || '',
              owner_rut: ownerData.rut || '',
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
              // Initialize documents based on owner type
              documents: getRequiredOwnerDocuments(ownerData.owner_type || 'natural')
            };
            return owner;
          });

        console.log('✅ Loaded owners for editing:', loadedOwners.length);
        setSaleOwners(loadedOwners);

      } catch (error) {
        console.error('❌ Error loading owners for editing:', error);
        // Fallback to default owner
        setSaleOwners(getInitialSaleOwners);
      }
    };

    loadOwnersForEditing();
  }, [isEditing, initialData?.id]);

  // Form data state
  const [formData, setFormData] = useState({
    // Información de la Propiedad
    tipoPropiedad: 'Casa', // Nuevo campo: tipo de propiedad
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

    // Campos específicos por tipo de propiedad
    numeroBodega: '', // Para tipo Bodega
    ubicacionEstacionamiento: '', // Para tipo Estacionamiento

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

  // Inicializar formulario con datos existentes cuando está en modo edición
  useEffect(() => {
    if (isEditing && initialData) {
      // Actualizar también el tipo de propiedad
      setPropertyType(initialData.tipo_propiedad || 'Casa');

      setFormData({
        // Información de la Propiedad
        tipoPropiedad: initialData.tipo_propiedad || 'Casa',
        address_street: initialData.address_street || '',
        address_number: initialData.address_number || '',
        address_department: initialData.address_department || '',
        region: initialData.address_region || '',
        commune: initialData.address_commune || '',
        price: initialData.price_clp?.toString() || '',
        common_expenses: initialData.common_expenses_clp?.toString() || '',
        bedrooms: initialData.bedrooms?.toString() || '1',
        bathrooms: initialData.bathrooms?.toString() || '1',
        area_sqm: initialData.metros_utiles?.toString() || '',
        description: initialData.description || '',

        // Campos específicos por tipo de propiedad
        numeroBodega: initialData.storage_number || '',
        ubicacionEstacionamiento: initialData.parking_location || '',

        // Datos del Propietario - cargar desde initialData
        owner_first_name: initialData.owner_first_name || '',
        owner_paternal_last_name: initialData.owner_paternal_last_name || '',
        owner_maternal_last_name: initialData.owner_maternal_last_name || '',
        owner_rut: initialData.owner_rut || '',
        owner_address_street: '',
        owner_address_number: '',
        owner_region: '',
        owner_commune: '',
        marital_status: '',
        property_regime: '',

        // Archivos - las fotos existentes se manejarán por separado
        photos_urls: [],
        documents: {
          ownership_certificate: null,
          tax_assessment: null,
          owner_id_copy: null,
          power_of_attorney: null,
          commercial_evaluation: null,
        }
      });
    }
  }, [isEditing, initialData]);

  // Obtener comunas disponibles según la región seleccionada
  const getAvailableCommunes = (regionKey: string) => {
    return CHILE_REGIONS_COMMUNES[regionKey as keyof typeof CHILE_REGIONS_COMMUNES]?.communes || [];
  };

  // Documentos requeridos para estudio de título según normativa chilena 2025
  const getRequiredSaleDocuments = (): SaleDocument[] => {
    return [
      {
        type: 'dominio_vigente',
        label: 'Certificado de dominio vigente',
        required: true
      },
      {
        type: 'hipotecas_gravamenes',
        label: 'Certificado de hipotecas, gravámenes y prohibiciones',
        required: true
      },
      {
        type: 'cadena_titulos',
        label: 'Cadena de títulos de dominio (últimos 10 años)',
        required: true
      },
      {
        type: 'avaluo_fiscal',
        label: 'Certificado de avalúo fiscal vigente',
        required: true
      },
      {
        type: 'deuda_contribuciones',
        label: 'Certificado de deuda de contribuciones al día',
        required: true
      },
      {
        type: 'no_expropiacion_municipal',
        label: 'Certificado de no expropiación municipal',
        required: true
      },
      {
        type: 'interdicciones_litigios',
        label: 'Certificado de interdicciones y litigios',
        required: true
      },
      {
        type: 'escritura_compraventa',
        label: 'Copia de escrituras públicas de compraventa (últimos 10 años)',
        required: true
      },
      {
        type: 'planos_propiedad',
        label: 'Planos de la propiedad y subdivisión/loteo si aplica',
        required: false
      },
      {
        type: 'reglamento_copropiedad',
        label: 'Reglamento de copropiedad (si es departamento o casa en condominio)',
        required: false
      },
      {
        type: 'gastos_comunes',
        label: 'Comprobante de pago de gastos comunes al día (si aplica)',
        required: false
      },
      {
        type: 'cert_numero_municipal',
        label: 'Certificado de número municipal (si corresponde)',
        required: false
      },
      {
        type: 'cert_estado_civil',
        label: 'Certificado de estado civil del vendedor',
        required: true
      },
      {
        type: 'cedula_identidad_vendedor',
        label: 'Cédula de identidad del vendedor y cónyuge (si corresponde)',
        required: true
      }
    ];
  };

  // Función para obtener documentos requeridos según tipo de propietario
  const getRequiredOwnerDocuments = (ownerType: 'natural' | 'juridica'): SaleOwnerDocument[] => {
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

  // Función para obtener propietarios iniciales
  const getInitialSaleOwners = (): SaleOwner[] => {
    return [{
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
      constitution_type: undefined,
      constitution_date: '',
      cve_code: '',
      notary_name: '',
      repertory_number: '',
      owner_address_street: '',
      owner_address_number: '',
      owner_region: '',
      owner_commune: '',
      owner_nationality: 'Chilena',
      ownership_percentage: undefined,
      documents: getRequiredOwnerDocuments('natural')
    }];
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

    // Validación específica para Bodega
    if (propertyType === 'Bodega') {
      if (!formData.numeroBodega || formData.numeroBodega.trim() === '') {
        newErrors.numeroBodega = 'El número de bodega es requerido';
      }
    }

    // Validación específica para Estacionamiento
    if (propertyType === 'Estacionamiento') {
      if (!formData.ubicacionEstacionamiento || formData.ubicacionEstacionamiento.trim() === '') {
        newErrors.ubicacionEstacionamiento = 'El número de estacionamiento es obligatorio para propiedades de tipo Estacionamiento';
      }
    }

    // Validar que haya al menos un propietario
    if (saleOwners.length === 0) {
      newErrors.owners = 'Debe agregar al menos un propietario';
    }

    // Validar cada propietario
    saleOwners.forEach((owner, index) => {
      const ownerPrefix = `Propietario ${index + 1}`;

      if (!owner.owner_type) {
        newErrors[`owner_${owner.id}_type`] = `${ownerPrefix}: Debe seleccionar el tipo de propietario`;
      }

      if (owner.owner_type === 'natural') {
        if (!owner.owner_first_name?.trim()) {
          newErrors[`owner_${owner.id}_first_name`] = `${ownerPrefix}: Los nombres son requeridos`;
        }
        if (!owner.owner_paternal_last_name?.trim()) {
          newErrors[`owner_${owner.id}_paternal_last_name`] = `${ownerPrefix}: El apellido paterno es requerido`;
        }
        if (!owner.owner_rut?.trim()) {
          newErrors[`owner_${owner.id}_rut`] = `${ownerPrefix}: El RUT es requerido`;
        }
        if (!owner.owner_nationality) {
          newErrors[`owner_${owner.id}_nationality`] = `${ownerPrefix}: La nacionalidad es requerida`;
        }
      } else if (owner.owner_type === 'juridica') {
        if (!owner.owner_company_name?.trim()) {
          newErrors[`owner_${owner.id}_company_name`] = `${ownerPrefix}: La razón social es requerida`;
        }
        if (!owner.owner_company_rut?.trim()) {
          newErrors[`owner_${owner.id}_company_rut`] = `${ownerPrefix}: El RUT de la empresa es requerido`;
        }
        if (!owner.owner_representative_first_name?.trim()) {
          newErrors[`owner_${owner.id}_representative_first_name`] = `${ownerPrefix}: Los nombres del representante son requeridos`;
        }
        if (!owner.owner_representative_paternal_last_name?.trim()) {
          newErrors[`owner_${owner.id}_representative_paternal_last_name`] = `${ownerPrefix}: El apellido paterno del representante es requerido`;
        }
        if (!owner.owner_representative_rut?.trim()) {
          newErrors[`owner_${owner.id}_representative_rut`] = `${ownerPrefix}: El RUT del representante es requerido`;
        }
      }

      // Validaciones comunes para ambos tipos
      if (!owner.owner_address_street?.trim()) {
        newErrors[`owner_${owner.id}_address_street`] = `${ownerPrefix}: La calle es requerida`;
      }
      if (!owner.owner_address_number?.trim()) {
        newErrors[`owner_${owner.id}_address_number`] = `${ownerPrefix}: El número es requerido`;
      }
      if (!owner.owner_region) {
        newErrors[`owner_${owner.id}_region`] = `${ownerPrefix}: La región es requerida`;
      }
      if (!owner.owner_commune) {
        newErrors[`owner_${owner.id}_commune`] = `${ownerPrefix}: La comuna es requerida`;
      }
    });

    // Validar documentos de propietarios
    saleOwners.forEach((owner, index) => {
      const ownerPrefix = `Propietario ${index + 1}`;

      if (owner.documents) {
        owner.documents.forEach(doc => {
          if (doc.required) {
            const isUploaded = doc.uploaded || (doc.file || doc.url);
            if (!isUploaded) {
              newErrors[`owner_${owner.id}_${doc.type}`] = `${ownerPrefix}: ${doc.label} es requerido`;
            }
          }
        });
      }
    });

    // Validar documentos requeridos para estudio de título (solo si ya están inicializados)
    if (saleDocuments.length > 0) {
      const requiredDocuments = getRequiredSaleDocuments().filter(doc => doc.required);
      const missingDocuments = requiredDocuments.filter(doc => {
        const uploadedDoc = saleDocuments.find(d => d.type === doc.type);
        return !uploadedDoc || (!uploadedDoc.file && !uploadedDoc.url && !uploadedDoc.uploaded);
      });

      if (missingDocuments.length > 0) {
        newErrors.documents = `Faltan los siguientes documentos requeridos: ${missingDocuments.map(doc => doc.label).join(', ')}`;
      }
    }

    // Validar que se haya subido al menos una foto (recomendado para mejor presentación)
    if (photoFiles.length === 0 && photoPreviews.length === 0) {
      newErrors.photos = 'Se recomienda subir al menos una foto de la propiedad para una mejor presentación';
    }

    setErrors(newErrors);

    // Check if there are blocking errors (exclude photos which is just a recommendation)
    const blockingErrors = Object.keys(newErrors).filter(key => key !== 'photos');
    return blockingErrors.length === 0;
  };

  // Funciones para manejar documentos de estudio de título
  const handleDocumentUpload = (documentType: string, file: File) => {
    setSaleDocuments(prev =>
      prev.map(doc =>
        doc.type === documentType
          ? { ...doc, file, uploaded: true }
          : doc
      )
    );
  };

  const handleDocumentRemove = (documentType: string) => {
    setSaleDocuments(prev =>
      prev.map(doc =>
        doc.type === documentType
          ? { ...doc, file: undefined, url: undefined, uploaded: false }
          : doc
      )
    );
  };

  // Funciones para manejar propietarios de venta
  const addSaleOwner = () => {
    if (saleOwners.length >= 10) return; // Máximo 10 propietarios

    const newOwner: SaleOwner = {
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
      constitution_type: undefined,
      constitution_date: '',
      cve_code: '',
      notary_name: '',
      repertory_number: '',
      owner_address_street: '',
      owner_address_number: '',
      owner_region: '',
      owner_commune: '',
      owner_nationality: 'Chilena',
      ownership_percentage: undefined,
      documents: getRequiredOwnerDocuments('natural')
    };

    setSaleOwners(prev => [...prev, newOwner]);
  };

  const removeSaleOwner = (ownerId: string) => {
    if (saleOwners.length <= 1) return; // Mínimo 1 propietario

    setSaleOwners(prev => prev.filter(owner => owner.id !== ownerId));
  };

  const updateSaleOwner = (ownerId: string, field: keyof SaleOwner, value: string | number | undefined) => {
    setSaleOwners(prev => prev.map(owner => {
      if (owner.id === ownerId) {
        const updatedOwner = { ...owner, [field]: value };

        // Si cambió el tipo de propietario, actualizar documentos
        if (field === 'owner_type' && value) {
          updatedOwner.documents = getRequiredOwnerDocuments(value as 'natural' | 'juridica');
        }

        return updatedOwner;
      }
      return owner;
    }));
  };

  // Funciones para manejar fotos
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

  const removePhoto = (index: number) => {
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Funciones para manejar documentos de propietarios
  const handleOwnerDocumentUpload = (ownerId: string, documentType: string, file: File) => {
    setSaleOwners(prev => prev.map(owner =>
      owner.id === ownerId
        ? {
            ...owner,
            documents: owner.documents?.map(doc =>
              doc.type === documentType ? { ...doc, file, uploaded: true } : doc
            )
          }
        : owner
    ));
  };

  const handleOwnerDocumentRemove = (ownerId: string, documentType: string) => {
    setSaleOwners(prev => prev.map(owner =>
      owner.id === ownerId
        ? {
            ...owner,
            documents: owner.documents?.map(doc =>
              doc.type === documentType ? { ...doc, file: undefined, url: undefined, uploaded: false } : doc
            )
          }
        : owner
    ));
  };

  // Función para subir fotos de la propiedad
  const uploadSalePhotos = async (propertyId: string) => {
    if (photoFiles.length === 0) return;

    console.log(`📸 Subiendo ${photoFiles.length} fotos para propiedad:`, propertyId);

    for (const file of photoFiles) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user?.id}/${Date.now()}-${Math.random()}.${fileExt}`;

        // Try property-images bucket first, then fallback to images
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
        } catch (bucketError) {
          console.warn('⚠️ Error con property-images, intentando con images:', bucketError);
          // Fallback to images bucket
          uploadResult = await supabase.storage
            .from('images')
            .upload(fileName, file);
          bucketUsed = 'images';
        }

        if (!uploadResult || uploadResult.error) {
          console.error('❌ Error subiendo foto:', uploadResult?.error);
          throw new Error(`Error subiendo foto: ${uploadResult?.error?.message || 'Error desconocido'}`);
        }

        console.log(`✅ Foto subida exitosamente al bucket: ${bucketUsed}`);

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
          console.error('❌ Error insertando registro de foto:', dbError);
          throw new Error(`Error guardando registro de foto: ${dbError.message}`);
        }

        console.log('✅ Registro de foto insertado correctamente');
      } catch (error) {
        console.error(`❌ Error procesando foto:`, error);
        throw error;
      }
    }
  };

  // Función para guardar propietarios de venta
  const saveSaleOwners = async (propertyId: string) => {
    console.log('👥 Guardando propietarios de venta para propiedad:', propertyId);

    for (const [index, owner] of saleOwners.entries()) {
      try {
        console.log(`👤 Creando propietario ${index + 1}:`, owner.owner_type);

        // Preparar datos del propietario para la tabla sale_owners
        const ownerData: any = {
          owner_type: owner.owner_type,
          address_street: owner.owner_address_street,
          address_number: owner.owner_address_number,
          address_region: owner.owner_region,
          address_commune: owner.owner_commune,
          nationality: owner.owner_nationality,
          email: owner.owner_email,
          phone: owner.owner_phone
        };

        // Campos específicos según el tipo de propietario
        if (owner.owner_type === 'natural') {
          ownerData.first_name = owner.owner_first_name;
          ownerData.paternal_last_name = owner.owner_paternal_last_name;
          ownerData.maternal_last_name = owner.owner_maternal_last_name;
          ownerData.rut = owner.owner_rut;
        } else if (owner.owner_type === 'juridica') {
          ownerData.company_name = owner.owner_company_name;
          ownerData.company_rut = owner.owner_company_rut;
          ownerData.company_business = owner.owner_company_business;
          ownerData.company_email = owner.owner_company_email;
          ownerData.company_phone = owner.owner_company_phone;
          ownerData.representative_first_name = owner.owner_representative_first_name;
          ownerData.representative_paternal_last_name = owner.owner_representative_paternal_last_name;
          ownerData.representative_maternal_last_name = owner.owner_representative_maternal_last_name;
          ownerData.representative_rut = owner.owner_representative_rut;
          ownerData.representative_email = owner.owner_representative_email;
          ownerData.representative_phone = owner.owner_representative_phone;
          ownerData.constitution_type = owner.constitution_type;
          ownerData.constitution_date = owner.constitution_date;
          ownerData.cve_code = owner.cve_code;
          ownerData.notary_name = owner.notary_name;
          ownerData.repertory_number = owner.repertory_number;
        }

        // Insertar en sale_owners
        const { data: saleOwnerResult, error: saleOwnerError } = await supabase
          .from('sale_owners')
          .insert(ownerData)
          .select()
          .single();

        if (saleOwnerError) {
          console.error('❌ Error creando propietario en sale_owners:', saleOwnerError);
          throw new Error(`Error creando propietario ${index + 1}`);
        }

        console.log('✅ Propietario creado en sale_owners con ID:', saleOwnerResult.id);

        // Crear relación en property_sale_owners
        const relationshipData = {
          property_id: propertyId,
          sale_owner_id: saleOwnerResult.id,
          ownership_percentage: owner.ownership_percentage,
          is_primary_owner: index === 0 // El primer propietario es el primario
        };

        const { data: relationshipResult, error: relationshipError } = await supabase
          .from('property_sale_owners')
          .insert(relationshipData)
          .select()
          .single();

        if (relationshipError) {
          console.error('❌ Error creando relación property_sale_owners:', relationshipError);
          throw new Error(`Error creando relación para propietario ${index + 1}`);
        }

        console.log('✅ Relación property_sale_owners creada con ID:', relationshipResult.id);

        // Subir documentos específicos del propietario
        if (owner.documents && owner.documents.length > 0) {
          await uploadOwnerDocuments(saleOwnerResult.id, owner.documents);
        }

      } catch (error) {
        console.error(`❌ Error procesando propietario ${index + 1}:`, error);
        throw error;
      }
    }
  };

  // Función para subir documentos de un propietario específico
  const uploadOwnerDocuments = async (saleOwnerId: string, documents: SaleOwnerDocument[]) => {
    const documentsToUpload = documents.filter(doc => doc.file && !doc.url);

    if (documentsToUpload.length === 0) return;

    console.log(`📄 Subiendo ${documentsToUpload.length} documentos para propietario:`, saleOwnerId);

    for (const doc of documentsToUpload) {
      if (!doc.file) continue;

      try {
        // Generar nombre único para el archivo
        const fileName = `${saleOwnerId}/${doc.type}/${Date.now()}_${doc.file.name}`;
        const filePath = `${user?.id}/sale-owner-documents/${fileName}`;

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

        // Guardar registro del documento en la tabla sale_owner_documents
        const { error: dbError } = await supabase
          .from('sale_owner_documents')
          .insert({
            sale_owner_id: saleOwnerId,
            doc_type: doc.type,
            file_name: doc.file.name,
            file_url: urlData.publicUrl,
            storage_path: filePath,
            file_size_bytes: doc.file.size,
            mime_type: doc.file.type,
            uploaded_by: user?.id,
            notes: `Documento del propietario subido durante la publicación de la propiedad`
          });

        if (dbError) {
          console.error(`Error saving owner document record ${doc.type}:`, dbError);
          throw new Error(`Error al guardar registro de ${doc.label}`);
        }

        console.log(`✅ Documento de propietario ${doc.label} subido exitosamente`);
      } catch (error) {
        console.error(`Error processing owner document ${doc.type}:`, error);
        throw error;
      }
    }
  };

  // Función para subir documentos de estudio de título
  const uploadSaleDocuments = async (propertyId: string) => {
    const documentsToUpload = saleDocuments.filter(doc => doc.file && !doc.url);

    if (documentsToUpload.length === 0) return;

    console.log(`📄 Subiendo ${documentsToUpload.length} documentos de estudio de título...`);

    for (const doc of documentsToUpload) {
      if (!doc.file) continue;

      try {
        // Generar nombre único para el archivo
        const fileName = `${propertyId}/${doc.type}/${Date.now()}_${doc.file.name}`;
        const filePath = `${user?.id}/sale-documents/${fileName}`;

        // Subir archivo a Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('user-documents')
          .upload(filePath, doc.file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error(`Error uploading document ${doc.type}:`, uploadError);
          throw new Error(`Error al subir ${doc.label}`);
        }

        // Obtener URL pública del archivo
        const { data: urlData } = supabase.storage
          .from('user-documents')
          .getPublicUrl(filePath);

        if (!urlData.publicUrl) {
          throw new Error(`Error al obtener URL pública para ${doc.label}`);
        }

        // Guardar registro del documento en la tabla property_sale_documents
        const { error: dbError } = await supabase
          .from('property_sale_documents')
          .insert({
            property_id: propertyId,
            doc_type: doc.type,
            file_name: doc.file.name,
            file_url: urlData.publicUrl,
            storage_path: filePath,
            file_size_bytes: doc.file.size,
            mime_type: doc.file.type,
            uploaded_by: user?.id,
            notes: `Documento subido durante la publicación de la propiedad`
          });

        if (dbError) {
          console.error(`Error saving document record ${doc.type}:`, dbError);
          throw new Error(`Error al guardar registro de ${doc.label}`);
        }

        console.log(`✅ Documento ${doc.label} subido exitosamente`);
      } catch (error) {
        console.error(`Error processing document ${doc.type}:`, error);
        throw error;
      }
    }
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
      // Note: Owner profile data is stored in sale_owners table, not in the user's profile
      // The property owner_id points to the advisor who created the property

      // Parse numeric values with validation
      const price = parseFloat(formData.price);
      const areaSqm = parseInt(formData.area_sqm);
      const commonExpenses = formData.common_expenses ? parseFloat(formData.common_expenses) : 0;

      // Bedrooms and bathrooms only required for habitable properties
      const bedrooms = !isParking && propertyType !== 'Bodega' && propertyType !== 'Parcela' ? parseInt(formData.bedrooms) : 0;
      const bathrooms = !isParking && propertyType !== 'Bodega' && propertyType !== 'Parcela' ? parseInt(formData.bathrooms) : 0;

      if (isNaN(price) || isNaN(areaSqm)) {
        throw new Error('Valores numéricos inválidos');
      }

      // Validate bedrooms/bathrooms only for habitable properties
      if (!isParking && propertyType !== 'Bodega' && propertyType !== 'Parcela') {
        if (isNaN(bedrooms) || isNaN(bathrooms)) {
          throw new Error('Valores de dormitorios/baños inválidos');
        }
      }

      // TODO: Implement proper owner assignment logic
      // Currently assigning to the advisor (user.id), but should assign to actual property owner
      // This requires either finding existing user by RUT or creating new user account for owner
      const propertyData = {
        owner_id: user.id, // FIXME: This should be the actual owner's user ID, not the advisor's
        listing_type: 'venta' as const,
        status: 'disponible' as const,
        tipo_propiedad: formData.tipoPropiedad,
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
        // Campos específicos por tipo
        ...(propertyType === 'Bodega' && { storage_number: formData.numeroBodega }),
        ...(propertyType === 'Estacionamiento' && { parking_location: formData.ubicacionEstacionamiento }),
        created_at: new Date().toISOString()
      };

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

      // Guardar propietarios de venta (only for new properties)
      if (propertyResult?.id && !isEditing) {
        try {
          await saveSaleOwners(propertyResult.id);
          console.log('✅ Propietarios de venta guardados exitosamente');
        } catch (ownerError) {
          console.error('⚠️ Error al guardar propietarios:', ownerError);
          // No fallar la publicación por error en propietarios, pero mostrar advertencia
          alert(`Propiedad creada exitosamente, pero hubo un error al guardar algunos propietarios: ${ownerError instanceof Error ? ownerError.message : 'Error desconocido'}`);
        }
      }

      // Subir documentos de estudio de título si la propiedad fue creada
      if (propertyResult?.id && !isEditing) {
        try {
          await uploadSaleDocuments(propertyResult.id);
          console.log('✅ Documentos de estudio de título subidos exitosamente');
        } catch (docError) {
          console.error('⚠️ Error al subir documentos:', docError);
          // No fallar la publicación por error en documentos, pero mostrar advertencia
          alert(`Propiedad creada exitosamente, pero hubo un error al subir algunos documentos: ${docError instanceof Error ? docError.message : 'Error desconocido'}`);
        }
      }

      // Guardar propietarios de venta si la propiedad fue creada
      if (propertyResult?.id && !isEditing) {
        try {
          await saveSaleOwners(propertyResult.id);
          console.log('✅ Propietarios de venta guardados exitosamente');
        } catch (ownerError) {
          console.error('⚠️ Error al guardar propietarios:', ownerError);
          // No fallar la publicación por error en propietarios, pero mostrar advertencia
          alert(`Propiedad creada exitosamente, pero hubo un error al guardar algunos propietarios: ${ownerError instanceof Error ? ownerError.message : 'Error desconocido'}`);
        }
      }

      // Subir fotos de la propiedad si la propiedad fue creada
      if (propertyResult?.id && !isEditing) {
        try {
          await uploadSalePhotos(propertyResult.id);
          console.log('✅ Fotos de propiedad subidas exitosamente');
        } catch (photoError) {
          console.error('⚠️ Error al subir fotos:', photoError);
          // No fallar la publicación por error en fotos, pero mostrar advertencia
          alert(`Propiedad creada exitosamente, pero hubo un error al subir algunas fotos: ${photoError instanceof Error ? photoError.message : 'Error desconocido'}`);
        }
      }

      // Mostrar mensaje de éxito
      const successMessage = isEditing ? 'Propiedad actualizada exitosamente!' : 'Propiedad publicada exitosamente!';
      alert(successMessage);

      if (onSuccess) {
        onSuccess();
      } else {
        // Redirigir a ver la propiedad recién creada
        if (!isEditing && propertyResult?.id) {
          navigate(`/property/${propertyResult.id}`);
        } else {
          navigate('/portfolio');
        }
      }
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
            {isEditing ? 'Modificar Propiedad en Venta' : 'Publicar Propiedad en Venta'}
          </h1>
          <p className="text-gray-600">
            {isEditing
              ? 'Actualiza la información de tu propiedad en venta'
              : 'Completa todos los campos para publicar tu propiedad en venta'
            }
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
              {/* Tipo de Propiedad */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tipo de Propiedad *
                </label>
                <select
                  required
                  value={propertyType}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setPropertyType(newType);
                    setFormData({ ...formData, tipoPropiedad: newType });
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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

              {/* Número de Estacionamiento - solo para tipo Estacionamiento */}
              {propertyType === 'Estacionamiento' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Número de Estacionamiento *
                  </label>
                  <input
                    type="text"
                    required={propertyType === 'Estacionamiento'}
                    value={formData.ubicacionEstacionamiento || ''}
                    onChange={(e) => setFormData({ ...formData, ubicacionEstacionamiento: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.ubicacionEstacionamiento ? 'border-red-500 bg-red-50' : 'border-gray-300'
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

              {/* Características y Superficie */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Dormitorios y Baños - Solo para propiedades habitables */}
                {!isParking && propertyType !== 'Bodega' && propertyType !== 'Parcela' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Dormitorios *
                      </label>
                      <select
                        required={!isParking && propertyType !== 'Bodega' && propertyType !== 'Parcela'}
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
                        required={!isParking && propertyType !== 'Bodega' && propertyType !== 'Parcela'}
                        value={formData.bathrooms}
                        onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        {[1, 2, 3, 4, 5].map(num => (
                          <option key={num} value={num}>{num}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {/* Superficie - Siempre visible, ajusta el span según si hay dormitorios/baños */}
                <div className={(!isParking && propertyType !== 'Bodega' && propertyType !== 'Parcela') ? '' : 'md:col-span-3'}>
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
            <div className="border-b pb-2 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <User className="h-6 w-6 mr-2 text-blue-600" />
                Datos del Propietario
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Propietarios: {saleOwners.length}/10</span>
                {saleOwners.length < 10 && (
                  <button
                    type="button"
                    onClick={addSaleOwner}
                    className="px-3 py-1 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600 transition-colors"
                  >
                    + Agregar Propietario
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  💡 <strong>Recuerda:</strong> Agregar todos los titulares actuales inscritos en el Conservador de Bienes Raíces
                </p>
              </div>

              {saleOwners.map((owner, index) => (
                <div key={owner.id} className="border border-gray-200 rounded-lg p-6 space-y-6">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Propietario {index + 1}
                    </h3>
                    {saleOwners.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSaleOwner(owner.id)}
                        className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    {/* Selector de Tipo de Propietario */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Tipo de Propietario *
                      </label>
                      <select
                        required
                        value={owner.owner_type}
                        onChange={(e) => updateSaleOwner(owner.id, 'owner_type', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="natural">Persona Natural</option>
                        <option value="juridica">Persona Jurídica</option>
                      </select>
                    </div>

                    {/* Nacionalidad - Solo para persona natural */}
                    {owner.owner_type === 'natural' && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Nacionalidad *
                        </label>
                        <select
                          required={owner.owner_type === 'natural'}
                          value={owner.owner_nationality || ''}
                          onChange={(e) => updateSaleOwner(owner.id, 'owner_nationality', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                          <option value="">Seleccionar nacionalidad</option>
                          {NATIONALITIES.map((nationality) => (
                            <option key={nationality} value={nationality}>{nationality}</option>
                          ))}
                        </select>
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
                            onChange={(e) => updateSaleOwner(owner.id, 'owner_first_name', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Ej: Juan Carlos"
                          />
                        </div>

                        {/* Apellidos */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Apellido Paterno *
                            </label>
                            <input
                              type="text"
                              required={owner.owner_type === 'natural'}
                              value={owner.owner_paternal_last_name || ''}
                              onChange={(e) => updateSaleOwner(owner.id, 'owner_paternal_last_name', e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              placeholder="Ej: Pérez"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Apellido Materno
                            </label>
                            <input
                              type="text"
                              value={owner.owner_maternal_last_name || ''}
                              onChange={(e) => updateSaleOwner(owner.id, 'owner_maternal_last_name', e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              placeholder="Ej: González"
                            />
                          </div>
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
                            onChange={(e) => updateSaleOwner(owner.id, 'owner_rut', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Ej: 12.345.678-9"
                          />
                        </div>
                      </>
                    )}

                    {/* Campos para Persona Jurídica */}
                    {owner.owner_type === 'juridica' && (
                      <>
                        {/* Razón Social */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Razón Social *
                          </label>
                          <input
                            type="text"
                            required={owner.owner_type === 'juridica'}
                            value={owner.owner_company_name || ''}
                            onChange={(e) => updateSaleOwner(owner.id, 'owner_company_name', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Ej: Empresa S.A."
                          />
                        </div>

                        {/* RUT Empresa */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            RUT Empresa *
                          </label>
                          <input
                            type="text"
                            required={owner.owner_type === 'juridica'}
                            value={owner.owner_company_rut || ''}
                            onChange={(e) => updateSaleOwner(owner.id, 'owner_company_rut', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Ej: 76.543.210-K"
                          />
                        </div>

                        {/* Representante Legal */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
                          <h4 className="text-sm font-semibold text-gray-800">Representante Legal</h4>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombres *
                              </label>
                              <input
                                type="text"
                                required={owner.owner_type === 'juridica'}
                                value={owner.owner_representative_first_name || ''}
                                onChange={(e) => updateSaleOwner(owner.id, 'owner_representative_first_name', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                                placeholder="Nombres"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Apellido Paterno *
                              </label>
                              <input
                                type="text"
                                required={owner.owner_type === 'juridica'}
                                value={owner.owner_representative_paternal_last_name || ''}
                                onChange={(e) => updateSaleOwner(owner.id, 'owner_representative_paternal_last_name', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                                placeholder="Apellido paterno"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Apellido Materno
                              </label>
                              <input
                                type="text"
                                value={owner.owner_representative_maternal_last_name || ''}
                                onChange={(e) => updateSaleOwner(owner.id, 'owner_representative_maternal_last_name', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                                placeholder="Apellido materno"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                RUT *
                              </label>
                              <input
                                type="text"
                                required={owner.owner_type === 'juridica'}
                                value={owner.owner_representative_rut || ''}
                                onChange={(e) => updateSaleOwner(owner.id, 'owner_representative_rut', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                                placeholder="12.345.678-9"
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Dirección - Común para ambos tipos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Calle *
                        </label>
                        <input
                          type="text"
                          required
                          value={owner.owner_address_street || ''}
                          onChange={(e) => updateSaleOwner(owner.id, 'owner_address_street', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Ej: Av. Principal"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Número *
                        </label>
                        <input
                          type="text"
                          required
                          value={owner.owner_address_number || ''}
                          onChange={(e) => updateSaleOwner(owner.id, 'owner_address_number', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Ej: 567"
                        />
                      </div>
                    </div>

                    {/* Región y Comuna */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Región *
                        </label>
                        <select
                          required
                          value={owner.owner_region || ''}
                          onChange={(e) => updateSaleOwner(owner.id, 'owner_region', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                          <option value="">Seleccionar región</option>
                          {Object.entries(CHILE_REGIONS_COMMUNES).map(([key, region]) => (
                            <option key={key} value={key}>{region.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Comuna *
                        </label>
                        <select
                          required
                          value={owner.owner_commune || ''}
                          onChange={(e) => updateSaleOwner(owner.id, 'owner_commune', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          disabled={!owner.owner_region}
                        >
                          <option value="">Seleccionar comuna</option>
                          {getAvailableCommunes(owner.owner_region || '').map((commune) => (
                            <option key={commune} value={commune}>{commune}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Contacto - Común para ambos tipos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={owner.owner_email || ''}
                          onChange={(e) => updateSaleOwner(owner.id, 'owner_email', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="email@ejemplo.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Teléfono
                        </label>
                        <input
                          type="tel"
                          value={owner.owner_phone || ''}
                          onChange={(e) => updateSaleOwner(owner.id, 'owner_phone', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="+56 9 1234 5678"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Documentos específicos del propietario */}
                  {owner.documents && owner.documents.length > 0 && (
                    <div className="border-t pt-6">
                      <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-blue-600" />
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
                                  <label className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors cursor-pointer">
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

                      {/* Mensaje informativo sobre documentos */}
                      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-xs text-blue-800">
                          <strong>Nota:</strong> Los documentos marcados con (*) son obligatorios según la normativa chilena.
                          El poder del representante es opcional y solo requerido en casos específicos.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Sección 3: Fotos de la Propiedad */}
          <div className="space-y-6">
            <div className="border-b pb-2">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Image className="h-6 w-6 mr-2 text-blue-600" />
                Fotos de la Propiedad (Opcional)
              </h2>
            </div>

            <div className="space-y-4">
              {/* Upload de fotos */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Subir Fotos
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
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
                    Fotos Seleccionadas ({photoPreviews.length})
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

          {/* Sección 4: Documentos para Estudio de Título */}
          {saleDocuments.length > 0 && (
            <DocumentSection
              title="Documentos para Estudio de Título"
              documents={saleDocuments}
              onUpload={handleDocumentUpload}
              onRemove={handleDocumentRemove}
              icon={<FileText className="h-6 w-6 mr-2 text-blue-600" />}
            />
          )}

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

          {/* Error de documentos */}
          {errors.documents && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">Documentos requeridos faltantes:</span>
              </div>
              <p className="text-sm text-red-700">{errors.documents}</p>
            </div>
          )}

          {/* Error de fotos */}
          {errors.photos && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">Recomendación de fotos:</span>
              </div>
              <p className="text-sm text-yellow-700">{errors.photos}</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
