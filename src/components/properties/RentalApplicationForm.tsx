import React, { useState } from 'react';
import { X, Upload, Check, FileText, User, Building, Shield, AlertCircle, Download, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface RentalApplicationFormProps {
  propertyId: string;
  propertyAddress: string;
  onClose: () => void;
}

// Check if storage bucket exists
const checkStorageAvailability = async () => {
  try {
    const { data, error } = await supabase.storage
      .from('rental-documents')
      .list('', { limit: 1 });
    
    return !error;
  } catch (error) {
    console.log('Storage bucket not available:', error);
    return false;
  }
};

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

interface ApplicationData {
  // Datos del Postulante
  applicant: {
    fullName: string;
    rut: string;
    profession: string;
    company: string;
    monthlyIncome: string;
    workExperience: string;
    email: string;
    phone: string;
    address: string;
    apartmentNumber: string;
    region: string;
    commune: string;
  };
  
  // Documentos del Postulante (simplificados)
  applicantDocuments: {
    nationalId: File | null;
    creditReport: File | null;
  };
  
  // Datos del Aval
  hasGuarantor: boolean;
  guarantor: {
    fullName: string;
    rut: string;
    monthlyIncome: string;
    email: string;
    phone: string;
    address: string;
    apartmentNumber: string;
    region: string;
    commune: string;
  };
  
  // Documentos del Aval (simplificados)
  guarantorDocuments: {
    nationalId: File | null;
    creditReport: File | null;
  };
  
  // Opción de mismo domicilio
  sameAddressAsApplicant: boolean;
  
  // Confirmación
  declarationAccepted: boolean;
}

export const RentalApplicationForm: React.FC<RentalApplicationFormProps> = ({
  propertyId,
  propertyAddress,
  onClose
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(false);

  // Estado del formulario
  const [applicationData, setApplicationData] = useState<ApplicationData>({
    applicant: {
      fullName: '',
      rut: '',
      profession: '',
      company: '',
      monthlyIncome: '',
      workExperience: '',
      email: user?.email || '',
      phone: '',
      address: '',
      apartmentNumber: '',
      region: '',
      commune: '',
    },
    applicantDocuments: {
      nationalId: null,
      creditReport: null,
    },
    hasGuarantor: false,
    guarantor: {
      fullName: '',
      rut: '',
      monthlyIncome: '',
      email: '',
      phone: '',
      address: '',
      apartmentNumber: '',
      region: '',
      commune: '',
    },
    guarantorDocuments: {
      nationalId: null,
      creditReport: null,
    },
    sameAddressAsApplicant: false,
    declarationAccepted: false,
  });

  // Check storage availability on component mount
  React.useEffect(() => {
    const checkStorage = async () => {
      const available = await checkStorageAvailability();
      setStorageAvailable(available);
    };
    checkStorage();
  }, []);

  // Obtener comunas disponibles según la región seleccionada
  const getAvailableCommunes = (regionKey: string) => {
    return CHILE_REGIONS_COMMUNES[regionKey as keyof typeof CHILE_REGIONS_COMMUNES]?.communes || [];
  };

  // Manejar cambio de región (resetear comuna)
  const handleRegionChange = (regionKey: string, isGuarantor: boolean = false) => {
    if (isGuarantor) {
      setApplicationData(prev => ({
        ...prev,
        guarantor: {
          ...prev.guarantor,
          region: regionKey,
          commune: '' // Resetear comuna cuando cambia la región
        }
      }));
    } else {
      setApplicationData(prev => ({
        ...prev,
        applicant: {
          ...prev.applicant,
          region: regionKey,
          commune: '' // Resetear comuna cuando cambia la región
        }
      }));
    }
  };

  // Manejar checkbox "Mismo domicilio"
  const handleSameAddressChange = (checked: boolean) => {
    setApplicationData(prev => ({
      ...prev,
      sameAddressAsApplicant: checked,
      guarantor: {
        ...prev.guarantor,
        address: checked ? prev.applicant.address : '',
        apartmentNumber: checked ? prev.applicant.apartmentNumber : '',
        region: checked ? prev.applicant.region : '',
        commune: checked ? prev.applicant.commune : '',
      }
    }));
  };

  // Auto-fill functions
  const autoFillApplicantData = async () => {
    setLoadingProfile(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        setApplicationData(prev => ({
          ...prev,
          applicant: {
            fullName: data.full_name || '',
            rut: data.rut || '',
            profession: data.profession || '',
            company: data.company || '',
            monthlyIncome: data.monthly_income?.toString() || '',
            workExperience: data.work_seniority || '',
            email: data.contact_email || '',
            phone: data.contact_phone || '',
            address: data.address || '',
            apartmentNumber: data.apartment_number || '',
            region: data.region || '',
            commune: data.commune || '',
          }
        }));
      } else {
        setErrors(prev => ({ ...prev, profile: 'No se encontró información guardada en tu perfil. Ve a "Mi Perfil" para guardar tus datos.' }));
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setErrors(prev => ({ ...prev, profile: 'Error al cargar los datos del perfil.' }));
    } finally {
      setLoadingProfile(false);
    }
  };

  const autoFillGuarantorData = async () => {
    setLoadingProfile(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data && data.guarantor_full_name) {
        setApplicationData(prev => ({
          ...prev,
          guarantor: {
            fullName: data.guarantor_full_name || '',
            rut: data.guarantor_rut || '',
            monthlyIncome: data.guarantor_monthly_income?.toString() || '',
            email: data.guarantor_contact_email || '',
            phone: data.guarantor_contact_phone || '',
            address: data.guarantor_address || '',
            apartmentNumber: data.guarantor_apartment_number || '',
            region: data.guarantor_region || '',
            commune: data.guarantor_commune || '',
          }
        }));
      } else {
        setErrors(prev => ({ ...prev, profile: 'No se encontró información del aval en tu perfil. Ve a "Mi Perfil" para guardar los datos de tu aval.' }));
      }
    } catch (error) {
      console.error('Error fetching guarantor profile:', error);
      setErrors(prev => ({ ...prev, profile: 'Error al cargar los datos del aval.' }));
    } finally {
      setLoadingProfile(false);
    }
  };

  // Configuración de documentos requeridos (simplificados)
  const requiredApplicantDocuments = [
    { key: 'nationalId', label: 'Cédula de Identidad (ambos lados)', icon: <User className="h-5 w-5" /> },
    { key: 'creditReport', label: 'Informe Comercial (ej: Equifax Platinum 360)', icon: <FileText className="h-5 w-5" /> },
  ];

  const requiredGuarantorDocuments = [
    { key: 'nationalId', label: 'Cédula de Identidad del Aval (ambos lados)', icon: <User className="h-5 w-5" /> },
    { key: 'creditReport', label: 'Informe Comercial del Aval', icon: <FileText className="h-5 w-5" /> },
  ];

  // Manejo de archivos
  const handleFileUpload = (
    section: 'applicantDocuments' | 'guarantorDocuments',
    documentKey: string,
    file: File
  ) => {
    setApplicationData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [documentKey]: file
      }
    }));
  };

  // Remover archivo
  const removeFile = (
    section: 'applicantDocuments' | 'guarantorDocuments',
    documentKey: string
  ) => {
    setApplicationData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [documentKey]: null
      }
    }));
  };

  // Validación del formulario
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validar datos del postulante
    if (!applicationData.applicant.fullName.trim()) {
      newErrors.applicantFullName = 'El nombre completo es requerido';
    }
    if (!applicationData.applicant.rut.trim()) {
      newErrors.applicantRut = 'El RUT es requerido';
    }
    if (!applicationData.applicant.profession.trim()) {
      newErrors.applicantProfession = 'La profesión u oficio es requerida';
    }
    if (!applicationData.applicant.company.trim()) {
      newErrors.applicantCompany = 'La empresa es requerida';
    }
    if (!applicationData.applicant.monthlyIncome.trim()) {
      newErrors.applicantIncome = 'La renta mensual es requerida';
    }
    if (!applicationData.applicant.workExperience.trim()) {
      newErrors.applicantExperience = 'La antigüedad laboral es requerida';
    }
    if (!applicationData.applicant.email.trim()) {
      newErrors.applicantEmail = 'El email es requerido';
    }
    if (!applicationData.applicant.phone.trim()) {
      newErrors.applicantPhone = 'El teléfono es requerido';
    }
    if (!applicationData.applicant.address.trim()) {
      newErrors.applicantAddress = 'La dirección es requerida';
    }
    if (!applicationData.applicant.region) {
      newErrors.applicantRegion = 'La región es requerida';
    }
    if (!applicationData.applicant.commune) {
      newErrors.applicantCommune = 'La comuna es requerida';
    }

    // Validar documentos del postulante (simplificados)
    requiredApplicantDocuments.forEach(doc => {
      if (!applicationData.applicantDocuments[doc.key as keyof typeof applicationData.applicantDocuments]) {
        newErrors[`applicantDoc_${doc.key}`] = 'Documento requerido';
      }
    });

    // Validar datos del aval si se presenta
    if (applicationData.hasGuarantor) {
      if (!applicationData.guarantor.fullName.trim()) {
        newErrors.guarantorFullName = 'El nombre del aval es requerido';
      }
      if (!applicationData.guarantor.rut.trim()) {
        newErrors.guarantorRut = 'El RUT del aval es requerido';
      }
      if (!applicationData.guarantor.monthlyIncome.trim()) {
        newErrors.guarantorIncome = 'La renta del aval es requerida';
      }
      if (!applicationData.guarantor.email.trim()) {
        newErrors.guarantorEmail = 'El email del aval es requerido';
      }
      if (!applicationData.guarantor.phone.trim()) {
        newErrors.guarantorPhone = 'El teléfono del aval es requerido';
      }
      if (!applicationData.guarantor.address.trim()) {
        newErrors.guarantorAddress = 'La dirección del aval es requerida';
      }
      if (!applicationData.guarantor.region) {
        newErrors.guarantorRegion = 'La región del aval es requerida';
      }
      if (!applicationData.guarantor.commune) {
        newErrors.guarantorCommune = 'La comuna del aval es requerida';
      }

      // Validar documentos del aval (simplificados)
      requiredGuarantorDocuments.forEach(doc => {
        if (!applicationData.guarantorDocuments[doc.key as keyof typeof applicationData.guarantorDocuments]) {
          newErrors[`guarantorDoc_${doc.key}`] = 'Documento requerido';
        }
      });
    }

    // Validar declaración
    if (!applicationData.declarationAccepted) {
      newErrors.declaration = 'Debe aceptar la declaración';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Subir archivos a Supabase Storage
  const uploadFiles = async () => {
    // Check if storage bucket exists before attempting upload
    try {
      const { data, error } = await supabase.storage
        .from('rental-documents')
        .list('', { limit: 1 });
      
      if (error) {
        console.log('Storage bucket not available, skipping file uploads');
        return { uploadedUrls: [] };
      }
    } catch (error) {
      console.log('Storage bucket not available, skipping file uploads');
      return { uploadedUrls: [] };
    }

    // If storage is not available, return empty arrays
    if (!storageAvailable) {
      console.warn('Storage not available, skipping file uploads');
      return [];
    }

    const uploadedUrls: string[] = [];

    // Subir documentos del postulante
    for (const [key, file] of Object.entries(applicationData.applicantDocuments)) {
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user?.id}/applicant_${key}_${Date.now()}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('rental-documents')
          .upload(fileName, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('rental-documents')
          .getPublicUrl(data.path);

        uploadedUrls.push(publicUrl);
      }
    }

    // Subir documentos del aval si existe
    if (applicationData.hasGuarantor) {
      for (const [key, file] of Object.entries(applicationData.guarantorDocuments)) {
        if (file) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${user?.id}/guarantor_${key}_${Date.now()}.${fileExt}`;

          const { data, error } = await supabase.storage
            .from('rental-documents')
            .upload(fileName, file);

          if (error) throw error;

          const { data: { publicUrl } } = supabase.storage
            .from('rental-documents')
            .getPublicUrl(data.path);

          uploadedUrls.push(publicUrl);
        }
      }
    }

    return uploadedUrls;
  };

  // Envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Subir archivos
      const documentUrls = await uploadFiles();

      // If storage is not available, show warning but continue with submission
      if (!storageAvailable && (Object.values(applicationData.applicantDocuments).some(doc => doc) || Object.values(applicationData.guarantorDocuments).some(doc => doc))) {
        console.warn('Files could not be uploaded due to missing storage bucket');
        setErrors({ submit: 'Advertencia: Los archivos no pudieron ser subidos. La postulación se enviará sin archivos adjuntos.' });
        // Continue with submission but without files
      }

      // Preparar datos para la base de datos
      const applicationPayload = {
        property_id: propertyId,
        applicant_id: user?.id,
        message: `Postulación completa de ${applicationData.applicant.fullName}`,
        applicant_data: {
          personal: applicationData.applicant,
          hasGuarantor: applicationData.hasGuarantor,
          guarantor: applicationData.hasGuarantor ? applicationData.guarantor : null,
        },
        documents_urls: documentUrls,
      };

      const { error } = await supabase
        .from('applications')
        .insert(applicationPayload);

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (error) {
      console.error('Error submitting application:', error);
      setErrors({ submit: 'Error al enviar la postulación. Intente nuevamente.' });
    } finally {
      setLoading(false);
    }
  };

  // Componente para carga de archivos
  const FileUploadRow = ({ 
    document, 
    file, 
    onUpload, 
    onRemove, 
    error 
  }: {
    document: { key: string; label: string; icon: React.ReactNode };
    file: File | null;
    onUpload: (file: File) => void;
    onRemove: () => void;
    error?: string;
  }) => (
    <div className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
      error ? 'border-red-300 bg-red-50' : file ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-gray-300'
    }`}>
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${
          error ? 'bg-red-100 text-red-600' : file ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
        }`}>
          {document.icon}
        </div>
        <div>
          <p className="font-medium text-gray-900">{document.label}</p>
          {file && (
            <p className="text-sm text-green-600 flex items-center">
              <Check className="h-4 w-4 mr-1" />
              {file.name}
            </p>
          )}
          {error && (
            <p className="text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {error}
            </p>
          )}
          {!storageAvailable && (
            <p className="text-sm text-yellow-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              Carga de archivos no disponible
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {file ? (
          <button
            type="button"
            onClick={onRemove}
            className="px-3 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
          >
            Eliminar
          </button>
        ) : (
          <label className={`px-4 py-2 text-sm rounded-lg transition-colors ${
            storageAvailable 
              ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer' 
              : 'bg-gray-400 text-white cursor-not-allowed'
          }`}>
            {storageAvailable ? 'Subir Archivo' : 'No Disponible'}
            <input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              disabled={!storageAvailable}
              onChange={(e) => {
                if (!storageAvailable) {
                  e.target.value = '';
                  return;
                }
                const selectedFile = e.target.files?.[0];
                if (selectedFile) {
                  onUpload(selectedFile);
                }
              }}
              className="hidden"
            />
          </label>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {success ? (
          // Pantalla de éxito
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">¡Postulación Enviada Exitosamente!</h3>
            <p className="text-gray-600 mb-4">
              Tu postulación completa ha sido enviada al propietario. Te contactarán pronto para continuar con el proceso.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-emerald-50 to-green-50">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Postulación de Arriendo</h2>
                <p className="text-gray-600 mt-1">{propertyAddress}</p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Storage availability warning */}
            {!storageAvailable && (
              <div className="p-4 bg-yellow-50 border-b border-yellow-200">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                  <p className="text-sm text-yellow-800">
                    La funcionalidad de carga de documentos no está disponible actualmente. 
                    Podrás enviar tu postulación sin archivos adjuntos.
                  </p>
                </div>
              </div>
            )}

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="p-6 space-y-8">
              {/* Sección 1: Datos del Postulante */}
              <div className="space-y-6">
                <div className="border-b pb-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center">
                      <User className="h-6 w-6 mr-2 text-emerald-600" />
                      Datos del Postulante
                    </h3>
                    <button
                      type="button"
                      onClick={autoFillApplicantData}
                      disabled={loadingProfile}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 transition-colors text-sm font-medium"
                    >
                      {loadingProfile ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      <span>Rellenar con mis datos guardados</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={applicationData.applicant.fullName}
                      onChange={(e) => setApplicationData(prev => ({
                        ...prev,
                        applicant: { ...prev.applicant, fullName: e.target.value }
                      }))}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                        errors.applicantFullName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Juan Carlos Pérez González"
                    />
                    {errors.applicantFullName && (
                      <p className="mt-1 text-sm text-red-600">{errors.applicantFullName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      RUT o Identificación Nacional *
                    </label>
                    <input
                      type="text"
                      required
                      value={applicationData.applicant.rut}
                      onChange={(e) => setApplicationData(prev => ({
                        ...prev,
                        applicant: { ...prev.applicant, rut: e.target.value }
                      }))}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                        errors.applicantRut ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="12.345.678-9"
                    />
                    {errors.applicantRut && (
                      <p className="mt-1 text-sm text-red-600">{errors.applicantRut}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Profesión u Oficio *
                    </label>
                    <input
                      type="text"
                      required
                      value={applicationData.applicant.profession}
                      onChange={(e) => setApplicationData(prev => ({
                        ...prev,
                        applicant: { ...prev.applicant, profession: e.target.value }
                      }))}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                        errors.applicantProfession ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Ingeniero Civil"
                    />
                    {errors.applicantProfession && (
                      <p className="mt-1 text-sm text-red-600">{errors.applicantProfession}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Empresa donde trabaja *
                    </label>
                    <input
                      type="text"
                      required
                      value={applicationData.applicant.company}
                      onChange={(e) => setApplicationData(prev => ({
                        ...prev,
                        applicant: { ...prev.applicant, company: e.target.value }
                      }))}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                        errors.applicantCompany ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Empresa ABC S.A."
                    />
                    {errors.applicantCompany && (
                      <p className="mt-1 text-sm text-red-600">{errors.applicantCompany}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Renta Líquida Mensual (CLP) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={applicationData.applicant.monthlyIncome}
                      onChange={(e) => setApplicationData(prev => ({
                        ...prev,
                        applicant: { ...prev.applicant, monthlyIncome: e.target.value }
                      }))}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                        errors.applicantIncome ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="1500000"
                    />
                    {errors.applicantIncome && (
                      <p className="mt-1 text-sm text-red-600">{errors.applicantIncome}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Antigüedad Laboral *
                    </label>
                    <input
                      type="text"
                      required
                      value={applicationData.applicant.workExperience}
                      onChange={(e) => setApplicationData(prev => ({
                        ...prev,
                        applicant: { ...prev.applicant, workExperience: e.target.value }
                      }))}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                        errors.applicantExperience ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="2 años y 6 meses"
                    />
                    {errors.applicantExperience && (
                      <p className="mt-1 text-sm text-red-600">{errors.applicantExperience}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email de Contacto *
                    </label>
                    <input
                      type="email"
                      required
                      value={applicationData.applicant.email}
                      onChange={(e) => setApplicationData(prev => ({
                        ...prev,
                        applicant: { ...prev.applicant, email: e.target.value }
                      }))}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                        errors.applicantEmail ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="juan@email.com"
                    />
                    {errors.applicantEmail && (
                      <p className="mt-1 text-sm text-red-600">{errors.applicantEmail}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Teléfono de Contacto *
                    </label>
                    <input
                      type="tel"
                      required
                      value={applicationData.applicant.phone}
                      onChange={(e) => setApplicationData(prev => ({
                        ...prev,
                        applicant: { ...prev.applicant, phone: e.target.value }
                      }))}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                        errors.applicantPhone ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="+56 9 1234 5678"
                    />
                    {errors.applicantPhone && (
                      <p className="mt-1 text-sm text-red-600">{errors.applicantPhone}</p>
                    )}
                  </div>
                </div>

                {/* Domicilio del Postulante */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-800">Domicilio del Postulante</h4>
                  
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Dirección *
                      </label>
                      <input
                        type="text"
                        required
                        value={applicationData.applicant.address}
                        onChange={(e) => setApplicationData(prev => ({
                          ...prev,
                          applicant: { ...prev.applicant, address: e.target.value }
                        }))}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                          errors.applicantAddress ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="Ej: Av. Libertador 1234"
                      />
                      {errors.applicantAddress && (
                        <p className="mt-1 text-sm text-red-600">{errors.applicantAddress}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Departamento / Oficina / Casa N° (Opcional)
                      </label>
                      <input
                        type="text"
                        value={applicationData.applicant.apartmentNumber}
                        onChange={(e) => setApplicationData(prev => ({
                          ...prev,
                          applicant: { ...prev.applicant, apartmentNumber: e.target.value }
                        }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                        placeholder="Ej: Depto 501, Casa 15"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Región *
                        </label>
                        <select
                          required
                          value={applicationData.applicant.region}
                          onChange={(e) => handleRegionChange(e.target.value)}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                            errors.applicantRegion ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Seleccionar región</option>
                          {Object.entries(CHILE_REGIONS_COMMUNES).map(([key, region]) => (
                            <option key={key} value={key}>{region.name}</option>
                          ))}
                        </select>
                        {errors.applicantRegion && (
                          <p className="mt-1 text-sm text-red-600">{errors.applicantRegion}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Comuna *
                        </label>
                        <select
                          required
                          value={applicationData.applicant.commune}
                          onChange={(e) => setApplicationData(prev => ({
                            ...prev,
                            applicant: { ...prev.applicant, commune: e.target.value }
                          }))}
                          disabled={!applicationData.applicant.region}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                            errors.applicantCommune ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          } ${!applicationData.applicant.region ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        >
                          <option value="">
                            {applicationData.applicant.region ? 'Seleccionar comuna' : 'Primero selecciona una región'}
                          </option>
                          {applicationData.applicant.region && getAvailableCommunes(applicationData.applicant.region).map((commune) => (
                            <option key={commune} value={commune}>{commune}</option>
                          ))}
                        </select>
                        {errors.applicantCommune && (
                          <p className="mt-1 text-sm text-red-600">{errors.applicantCommune}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección 2: Documentación del Postulante (Simplificada) */}
              <div className="space-y-6">
                <div className="border-b pb-2">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center">
                    <FileText className="h-6 w-6 mr-2 text-emerald-600" />
                    Documentación del Postulante
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Documentos requeridos para procesar tu postulación
                  </p>
                </div>

                <div className="space-y-4">
                  {requiredApplicantDocuments.map((document) => (
                    <FileUploadRow
                      key={document.key}
                      document={document}
                      file={applicationData.applicantDocuments[document.key as keyof typeof applicationData.applicantDocuments]}
                      onUpload={(file) => handleFileUpload('applicantDocuments', document.key, file)}
                      onRemove={() => removeFile('applicantDocuments', document.key)}
                      error={errors[`applicantDoc_${document.key}`]}
                    />
                  ))}
                </div>
              </div>

              {/* Sección 3: Datos del Aval o Codeudor */}
              <div className="space-y-6">
                <div className="border-b pb-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center">
                      <Shield className="h-6 w-6 mr-2 text-emerald-600" />
                      Aval o Codeudor
                    </h3>
                    <button
                      type="button"
                      onClick={autoFillGuarantorData}
                      disabled={loadingProfile}
                      className="flex items-center space-x-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 disabled:opacity-50 transition-colors text-sm font-medium"
                    >
                      {loadingProfile ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      <span>Rellenar con datos de mi aval guardado</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="hasGuarantor"
                    checked={applicationData.hasGuarantor}
                    onChange={(e) => setApplicationData(prev => ({
                      ...prev,
                      hasGuarantor: e.target.checked,
                      guarantor: e.target.checked ? prev.guarantor : {
                        fullName: '',
                        rut: '',
                        monthlyIncome: '',
                        email: '',
                        phone: '',
                        address: '',
                        apartmentNumber: '',
                        region: '',
                        commune: '',
                      },
                      sameAddressAsApplicant: false
                    }))}
                    className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <label htmlFor="hasGuarantor" className="text-sm font-medium text-gray-700">
                    Presentaré un Aval o Codeudor
                  </label>
                </div>

                {/* Formulario condicional del aval */}
                {applicationData.hasGuarantor && (
                  <div className="space-y-6 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Nombre Completo del Aval *
                        </label>
                        <input
                          type="text"
                          required={applicationData.hasGuarantor}
                          value={applicationData.guarantor.fullName}
                          onChange={(e) => setApplicationData(prev => ({
                            ...prev,
                            guarantor: { ...prev.guarantor, fullName: e.target.value }
                          }))}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                            errors.guarantorFullName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                          placeholder="María Elena González"
                        />
                        {errors.guarantorFullName && (
                          <p className="mt-1 text-sm text-red-600">{errors.guarantorFullName}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          RUT o Identificación Nacional del Aval *
                        </label>
                        <input
                          type="text"
                          required={applicationData.hasGuarantor}
                          value={applicationData.guarantor.rut}
                          onChange={(e) => setApplicationData(prev => ({
                            ...prev,
                            guarantor: { ...prev.guarantor, rut: e.target.value }
                          }))}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                            errors.guarantorRut ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                          placeholder="98.765.432-1"
                        />
                        {errors.guarantorRut && (
                          <p className="mt-1 text-sm text-red-600">{errors.guarantorRut}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Renta Líquida Mensual del Aval (CLP) *
                        </label>
                        <input
                          type="number"
                          required={applicationData.hasGuarantor}
                          min="0"
                          value={applicationData.guarantor.monthlyIncome}
                          onChange={(e) => setApplicationData(prev => ({
                            ...prev,
                            guarantor: { ...prev.guarantor, monthlyIncome: e.target.value }
                          }))}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                            errors.guarantorIncome ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                          placeholder="2000000"
                        />
                        {errors.guarantorIncome && (
                          <p className="mt-1 text-sm text-red-600">{errors.guarantorIncome}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Email de Contacto del Aval *
                        </label>
                        <input
                          type="email"
                          required={applicationData.hasGuarantor}
                          value={applicationData.guarantor.email}
                          onChange={(e) => setApplicationData(prev => ({
                            ...prev,
                            guarantor: { ...prev.guarantor, email: e.target.value }
                          }))}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                            errors.guarantorEmail ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                          placeholder="maria@email.com"
                        />
                        {errors.guarantorEmail && (
                          <p className="mt-1 text-sm text-red-600">{errors.guarantorEmail}</p>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Teléfono de Contacto del Aval *
                        </label>
                        <input
                          type="tel"
                          required={applicationData.hasGuarantor}
                          value={applicationData.guarantor.phone}
                          onChange={(e) => setApplicationData(prev => ({
                            ...prev,
                            guarantor: { ...prev.guarantor, phone: e.target.value }
                          }))}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                            errors.guarantorPhone ? 'border-red-500 bg-red-50' : 'border-gray-300'
                          }`}
                          placeholder="+56 9 8765 4321"
                        />
                        {errors.guarantorPhone && (
                          <p className="mt-1 text-sm text-red-600">{errors.guarantorPhone}</p>
                        )}
                      </div>
                    </div>

                    {/* Domicilio del Aval */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-800">Domicilio del Aval</h4>
                      
                      {/* Checkbox "Mismo domicilio" */}
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="sameAddress"
                          checked={applicationData.sameAddressAsApplicant}
                          onChange={(e) => handleSameAddressChange(e.target.checked)}
                          className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                        />
                        <label htmlFor="sameAddress" className="text-sm font-medium text-gray-700">
                          El aval tiene el mismo domicilio que el postulante
                        </label>
                      </div>

                      <div className="grid grid-cols-1 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Dirección del Aval *
                          </label>
                          <input
                            type="text"
                            required={applicationData.hasGuarantor}
                            value={applicationData.guarantor.address}
                            onChange={(e) => setApplicationData(prev => ({
                              ...prev,
                              guarantor: { ...prev.guarantor, address: e.target.value }
                            }))}
                            disabled={applicationData.sameAddressAsApplicant}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                              errors.guarantorAddress ? 'border-red-500 bg-red-50' : 'border-gray-300'
                            } ${applicationData.sameAddressAsApplicant ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            placeholder="Ej: Av. Providencia 2500"
                          />
                          {errors.guarantorAddress && (
                            <p className="mt-1 text-sm text-red-600">{errors.guarantorAddress}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Departamento / Oficina / Casa N° (Opcional)
                          </label>
                          <input
                            type="text"
                            value={applicationData.guarantor.apartmentNumber}
                            onChange={(e) => setApplicationData(prev => ({
                              ...prev,
                              guarantor: { ...prev.guarantor, apartmentNumber: e.target.value }
                            }))}
                            disabled={applicationData.sameAddressAsApplicant}
                            className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                              applicationData.sameAddressAsApplicant ? 'bg-gray-100 cursor-not-allowed' : ''
                            }`}
                            placeholder="Ej: Depto 1205, Casa 8"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Región del Aval *
                            </label>
                            <select
                              required={applicationData.hasGuarantor}
                              value={applicationData.guarantor.region}
                              onChange={(e) => handleRegionChange(e.target.value, true)}
                              disabled={applicationData.sameAddressAsApplicant}
                              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                                errors.guarantorRegion ? 'border-red-500 bg-red-50' : 'border-gray-300'
                              } ${applicationData.sameAddressAsApplicant ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            >
                              <option value="">Seleccionar región</option>
                              {Object.entries(CHILE_REGIONS_COMMUNES).map(([key, region]) => (
                                <option key={key} value={key}>{region.name}</option>
                              ))}
                            </select>
                            {errors.guarantorRegion && (
                              <p className="mt-1 text-sm text-red-600">{errors.guarantorRegion}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Comuna del Aval *
                            </label>
                            <select
                              required={applicationData.hasGuarantor}
                              value={applicationData.guarantor.commune}
                              onChange={(e) => setApplicationData(prev => ({
                                ...prev,
                                guarantor: { ...prev.guarantor, commune: e.target.value }
                              }))}
                              disabled={applicationData.sameAddressAsApplicant || !applicationData.guarantor.region}
                              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                                errors.guarantorCommune ? 'border-red-500 bg-red-50' : 'border-gray-300'
                              } ${applicationData.sameAddressAsApplicant || !applicationData.guarantor.region ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            >
                              <option value="">
                                {applicationData.guarantor.region ? 'Seleccionar comuna' : 'Primero selecciona una región'}
                              </option>
                              {applicationData.guarantor.region && getAvailableCommunes(applicationData.guarantor.region).map((commune) => (
                                <option key={commune} value={commune}>{commune}</option>
                              ))}
                            </select>
                            {errors.guarantorCommune && (
                              <p className="mt-1 text-sm text-red-600">{errors.guarantorCommune}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sección 4: Documentación del Aval (Simplificada) */}
              {applicationData.hasGuarantor && (
                <div className="space-y-6">
                  <div className="border-b pb-2">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center">
                      <FileText className="h-6 w-6 mr-2 text-emerald-600" />
                      Documentación del Aval
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Documentos requeridos del aval o codeudor
                    </p>
                  </div>

                  <div className="space-y-4">
                    {requiredGuarantorDocuments.map((document) => (
                      <FileUploadRow
                        key={document.key}
                        document={document}
                        file={applicationData.guarantorDocuments[document.key as keyof typeof applicationData.guarantorDocuments]}
                        onUpload={(file) => handleFileUpload('guarantorDocuments', document.key, file)}
                        onRemove={() => removeFile('guarantorDocuments', document.key)}
                        error={errors[`guarantorDoc_${document.key}`]}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Loading state for profile data */}
              {loadingProfile && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg flex items-center">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cargando datos del perfil...
                </div>
              )}

              {/* Sección 5: Confirmación */}
              <div className="space-y-6">
                <div className="border-b pb-2">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center">
                    <Check className="h-6 w-6 mr-2 text-emerald-600" />
                    Confirmación
                  </h3>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="declaration"
                      checked={applicationData.declarationAccepted}
                      onChange={(e) => setApplicationData(prev => ({
                        ...prev,
                        declarationAccepted: e.target.checked
                      }))}
                      className={`w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 mt-0.5 ${
                        errors.declaration ? 'border-red-500' : ''
                      }`}
                    />
                    <div>
                      <label htmlFor="declaration" className="text-sm font-medium text-blue-900">
                        Declaro que toda la información y los documentos presentados son verídicos *
                      </label>
                      <p className="text-xs text-blue-700 mt-1">
                        Al marcar esta casilla, confirmo que he proporcionado información veraz y completa, 
                        y entiendo que cualquier falsedad puede resultar en el rechazo de mi postulación.
                      </p>
                      {errors.declaration && (
                        <p className="mt-1 text-sm text-red-600">{errors.declaration}</p>
                      )}
                    </div>
                  </div>
                </div>

                {errors.submit && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                    <p className="text-sm text-red-600">{errors.submit}</p>
                  </div>
                )}

                {errors.profile && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    {errors.profile}
                  </div>
                )}
              </div>

              {/* Botones de acción */}
              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-8 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Enviando Postulación...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-5 w-5" />
                      <span>Enviar Postulación</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};