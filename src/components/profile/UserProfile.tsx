import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Upload, X, FileText, Check, AlertCircle, Loader2, MapPin, Building, Phone, Mail, Briefcase, DollarSign, Calendar, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
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

interface UserProfileData {
  // Personal Data
  full_name: string;
  rut: string;
  profession: string;
  company: string;
  monthly_income: string;
  work_seniority: string;
  contact_email: string;
  contact_phone: string;
  
  // Address
  address: string;
  apartment_number: string;
  region: string;
  commune: string;
  
  // Documents
  id_document_url: string;
  commercial_report_url: string;
  
  // Guarantor Data
  guarantor_full_name: string;
  guarantor_rut: string;
  guarantor_profession: string;
  guarantor_company: string;
  guarantor_monthly_income: string;
  guarantor_work_seniority: string;
  guarantor_contact_email: string;
  guarantor_contact_phone: string;
  
  // Guarantor Address
  guarantor_address: string;
  guarantor_apartment_number: string;
  guarantor_region: string;
  guarantor_commune: string;
  
  // Guarantor Documents
  guarantor_id_document_url: string;
  guarantor_commercial_report_url: string;
}

export const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  
  // Form data state
  const [formData, setFormData] = useState<UserProfileData>({
    // Personal Data
    full_name: '',
    rut: '',
    profession: '',
    company: '',
    monthly_income: '',
    work_seniority: '',
    contact_email: user?.email || '',
    contact_phone: '',
    
    // Address
    address: '',
    apartment_number: '',
    region: '',
    commune: '',
    
    // Documents
    id_document_url: '',
    commercial_report_url: '',
    
    // Guarantor Data
    guarantor_full_name: '',
    guarantor_rut: '',
    guarantor_profession: '',
    guarantor_company: '',
    guarantor_monthly_income: '',
    guarantor_work_seniority: '',
    guarantor_contact_email: '',
    guarantor_contact_phone: '',
    
    // Guarantor Address
    guarantor_address: '',
    guarantor_apartment_number: '',
    guarantor_region: '',
    guarantor_commune: '',
    
    // Guarantor Documents
    guarantor_id_document_url: '',
    guarantor_commercial_report_url: '',
  });

  // Document files state
  const [documentFiles, setDocumentFiles] = useState<{
    id_document: File | null;
    commercial_report: File | null;
    guarantor_id_document: File | null;
    guarantor_commercial_report: File | null;
  }>({
    id_document: null,
    commercial_report: null,
    guarantor_id_document: null,
    guarantor_commercial_report: null,
  });

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      checkStorageAvailability();
    }
  }, [user]);

  // Check if storage bucket is available
  const checkStorageAvailability = async () => {
    try {
      const { data, error } = await supabase.storage.getBucket('user-documents');
      if (error) {
        setStorageAvailable(false);
      }
    } catch (error) {
      setStorageAvailable(false);
    }
  };

  // Fetch existing user profile
  const fetchUserProfile = async () => {
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
        setFormData({
          full_name: data.full_name || '',
          rut: data.rut || '',
          profession: data.profession || '',
          company: data.company || '',
          monthly_income: data.monthly_income?.toString() || '',
          work_seniority: data.work_seniority || '',
          contact_email: data.contact_email || user?.email || '',
          contact_phone: data.contact_phone || '',
          address: data.address || '',
          apartment_number: data.apartment_number || '',
          region: data.region || '',
          commune: data.commune || '',
          id_document_url: data.id_document_url || '',
          commercial_report_url: data.commercial_report_url || '',
          guarantor_full_name: data.guarantor_full_name || '',
          guarantor_rut: data.guarantor_rut || '',
          guarantor_profession: data.guarantor_profession || '',
          guarantor_company: data.guarantor_company || '',
          guarantor_monthly_income: data.guarantor_monthly_income?.toString() || '',
          guarantor_work_seniority: data.guarantor_work_seniority || '',
          guarantor_contact_email: data.guarantor_contact_email || '',
          guarantor_contact_phone: data.guarantor_contact_phone || '',
          guarantor_address: data.guarantor_address || '',
          guarantor_apartment_number: data.guarantor_apartment_number || '',
          guarantor_region: data.guarantor_region || '',
          guarantor_commune: data.guarantor_commune || '',
          guarantor_id_document_url: data.guarantor_id_document_url || '',
          guarantor_commercial_report_url: data.guarantor_commercial_report_url || '',
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  // Obtener comunas disponibles según la región seleccionada
  const getAvailableCommunes = (regionKey: string) => {
    return CHILE_REGIONS_COMMUNES[regionKey as keyof typeof CHILE_REGIONS_COMMUNES]?.communes || [];
  };

  // Manejar cambio de región (resetear comuna)
  const handleRegionChange = (regionKey: string, isGuarantor: boolean = false) => {
    if (isGuarantor) {
      setFormData(prev => ({
        ...prev,
        guarantor_region: regionKey,
        guarantor_commune: '' // Resetear comuna cuando cambia la región
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        region: regionKey,
        commune: '' // Resetear comuna cuando cambia la región
      }));
    }
  };

  // Handle document upload
  const handleDocumentUpload = async (documentType: keyof typeof documentFiles, file: File) => {
    if (!storageAvailable) {
      setErrors(prev => ({
        ...prev,
        [documentType]: 'El almacenamiento de documentos no está disponible. Contacta al administrador.'
      }));
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${documentType}-${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('user-documents')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('user-documents')
        .getPublicUrl(data.path);

      // Update form data with the new URL
      const urlField = `${documentType}_url` as keyof UserProfileData;
      setFormData(prev => ({
        ...prev,
        [urlField]: publicUrl
      }));

      // Update file state
      setDocumentFiles(prev => ({
        ...prev,
        [documentType]: file
      }));

    } catch (error) {
      console.error('Error uploading document:', error);
      setErrors(prev => ({
        ...prev,
        [documentType]: 'Error al subir el archivo. Asegúrate de que el bucket de almacenamiento esté configurado correctamente.'
      }));
    } finally {
      setUploading(false);
    }
  };

  // Remove document
  const removeDocument = (documentType: keyof typeof documentFiles) => {
    const urlField = `${documentType}_url` as keyof UserProfileData;
    setFormData(prev => ({
      ...prev,
      [urlField]: ''
    }));
    setDocumentFiles(prev => ({
      ...prev,
      [documentType]: null
    }));
  };

  // Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Basic validation for required fields
    if (!formData.full_name.trim()) newErrors.full_name = 'El nombre completo es requerido';
    if (!formData.rut.trim()) newErrors.rut = 'El RUT es requerido';
    if (!formData.contact_email.trim()) newErrors.contact_email = 'El email es requerido';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const profileData = {
        user_id: user?.id,
        full_name: formData.full_name,
        rut: formData.rut,
        profession: formData.profession,
        company: formData.company,
        monthly_income: formData.monthly_income ? parseFloat(formData.monthly_income) : 0,
        work_seniority: formData.work_seniority,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
        address: formData.address,
        apartment_number: formData.apartment_number,
        region: formData.region,
        commune: formData.commune,
        id_document_url: formData.id_document_url,
        commercial_report_url: formData.commercial_report_url,
        guarantor_full_name: formData.guarantor_full_name,
        guarantor_rut: formData.guarantor_rut,
        guarantor_profession: formData.guarantor_profession,
        guarantor_company: formData.guarantor_company,
        guarantor_monthly_income: formData.guarantor_monthly_income ? parseFloat(formData.guarantor_monthly_income) : 0,
        guarantor_work_seniority: formData.guarantor_work_seniority,
        guarantor_contact_email: formData.guarantor_contact_email,
        guarantor_contact_phone: formData.guarantor_contact_phone,
        guarantor_address: formData.guarantor_address,
        guarantor_apartment_number: formData.guarantor_apartment_number,
        guarantor_region: formData.guarantor_region,
        guarantor_commune: formData.guarantor_commune,
        guarantor_id_document_url: formData.guarantor_id_document_url,
        guarantor_commercial_report_url: formData.guarantor_commercial_report_url,
      };

      const { error } = await supabase
        .from('user_profiles')
        .upsert(profileData, {
          onConflict: 'user_id'
        });
      
      if (error) throw error;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving user profile:', error);
      setErrors({ submit: 'Error al guardar el perfil. Intente nuevamente.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
          <User className="h-8 w-8 mr-3 text-blue-600" />
          Mi Perfil
        </h1>
        <p className="text-gray-600">
          Guarda tu información personal para autocompletar formularios de postulación
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sección 1: Mis Datos Personales */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="border-b pb-4 mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <User className="h-6 w-6 mr-2 text-blue-600" />
              Mis Datos Personales
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nombre Completo */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre Completo *
              </label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  errors.full_name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Juan Carlos Pérez González"
              />
              {errors.full_name && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.full_name}
                </p>
              )}
            </div>

            {/* RUT */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                RUT o Identificación Nacional *
              </label>
              <input
                type="text"
                required
                value={formData.rut}
                onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  errors.rut ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="12.345.678-9"
              />
              {errors.rut && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.rut}
                </p>
              )}
            </div>

            {/* Profesión */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Profesión u Oficio
              </label>
              <input
                type="text"
                value={formData.profession}
                onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Ingeniero, Contador, Técnico, etc."
              />
            </div>

            {/* Empresa */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Empresa donde trabaja
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Nombre de la empresa"
              />
            </div>

            {/* Renta Líquida */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Renta Líquida Mensual (CLP)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  min="0"
                  value={formData.monthly_income}
                  onChange={(e) => setFormData({ ...formData, monthly_income: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="1500000"
                />
              </div>
            </div>

            {/* Antigüedad Laboral */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Antigüedad Laboral
              </label>
              <select
                value={formData.work_seniority}
                onChange={(e) => setFormData({ ...formData, work_seniority: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">Seleccionar antigüedad</option>
                <option value="menos_6_meses">Menos de 6 meses</option>
                <option value="6_meses_1_ano">6 meses a 1 año</option>
                <option value="1_2_anos">1 a 2 años</option>
                <option value="2_5_anos">2 a 5 años</option>
                <option value="mas_5_anos">Más de 5 años</option>
              </select>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email de Contacto *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.contact_email ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="correo@ejemplo.com"
                />
              </div>
              {errors.contact_email && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.contact_email}
                </p>
              )}
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Teléfono de Contacto
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="+56 9 1234 5678"
                />
              </div>
            </div>
          </div>

          {/* Domicilio */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-blue-600" />
              Domicilio
            </h3>
            
            <div className="grid grid-cols-1 gap-6">
              {/* Dirección */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Dirección
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Av. Libertador 1234"
                />
              </div>

              {/* Departamento/Oficina/Casa N° */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Departamento / Oficina / Casa N° (Opcional)
                </label>
                <input
                  type="text"
                  value={formData.apartment_number}
                  onChange={(e) => setFormData({ ...formData, apartment_number: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Depto 501, Casa 15, Oficina 302"
                />
              </div>

              {/* Región y Comuna */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Región
                  </label>
                  <select
                    value={formData.region}
                    onChange={(e) => handleRegionChange(e.target.value)}
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
                    Comuna
                  </label>
                  <select
                    value={formData.commune}
                    onChange={(e) => setFormData({ ...formData, commune: e.target.value })}
                    disabled={!formData.region}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      !formData.region ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                  >
                    <option value="">
                      {formData.region ? 'Seleccionar comuna' : 'Primero selecciona una región'}
                    </option>
                    {formData.region && getAvailableCommunes(formData.region).map((commune) => (
                      <option key={commune} value={commune}>{commune}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sección 2: Mis Documentos */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="border-b pb-4 mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <FileText className="h-6 w-6 mr-2 text-blue-600" />
              Mis Documentos
            </h2>
          </div>

          <div className="space-y-4">
            {/* Cédula de Identidad */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
              <div className="flex-1">
                <p className="font-medium text-gray-900">Cédula de Identidad (ambos lados)</p>
                {formData.id_document_url && (
                  <p className="text-sm text-green-600 mt-1 flex items-center">
                    <Check className="h-4 w-4 mr-1" />
                    Documento subido
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {formData.id_document_url ? (
                  <button
                    type="button"
                    onClick={() => removeDocument('id_document')}
                    className="px-3 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Eliminar
                  </button>
                ) : (
                  <label className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                    {uploading ? 'Subiendo...' : 'Subir Archivo'}
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleDocumentUpload('id_document', file);
                        }
                      }}
                      className="hidden"
                      disabled={uploading || !storageAvailable}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Informe Comercial */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
              <div className="flex-1">
                <p className="font-medium text-gray-900">Informe Comercial (ej: Equifax Platinum 360)</p>
                {formData.commercial_report_url && (
                  <p className="text-sm text-green-600 mt-1 flex items-center">
                    <Check className="h-4 w-4 mr-1" />
                    Documento subido
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {formData.commercial_report_url ? (
                  <button
                    type="button"
                    onClick={() => removeDocument('commercial_report')}
                    className="px-3 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Eliminar
                  </button>
                ) : (
                  <label className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                    {uploading ? 'Subiendo...' : 'Subir Archivo'}
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleDocumentUpload('commercial_report', file);
                        }
                      }}
                      className="hidden"
                      disabled={uploading || !storageAvailable}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sección 3: Datos de mi Aval o Codeudor */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="border-b pb-4 mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Users className="h-6 w-6 mr-2 text-blue-600" />
              Datos de mi Aval o Codeudor (Opcional)
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              Guarda la información de tu aval para futuras postulaciones
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nombre Completo del Aval */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre Completo del Aval
              </label>
              <input
                type="text"
                value={formData.guarantor_full_name}
                onChange={(e) => setFormData({ ...formData, guarantor_full_name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="María Elena González Pérez"
              />
            </div>

            {/* RUT del Aval */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                RUT del Aval
              </label>
              <input
                type="text"
                value={formData.guarantor_rut}
                onChange={(e) => setFormData({ ...formData, guarantor_rut: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="98.765.432-1"
              />
            </div>

            {/* Profesión del Aval */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Profesión u Oficio del Aval
              </label>
              <input
                type="text"
                value={formData.guarantor_profession}
                onChange={(e) => setFormData({ ...formData, guarantor_profession: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Doctora, Abogado, Empresario, etc."
              />
            </div>

            {/* Empresa del Aval */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Empresa donde trabaja el Aval
              </label>
              <input
                type="text"
                value={formData.guarantor_company}
                onChange={(e) => setFormData({ ...formData, guarantor_company: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Nombre de la empresa"
              />
            </div>

            {/* Renta del Aval */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Renta Líquida Mensual del Aval (CLP)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  min="0"
                  value={formData.guarantor_monthly_income}
                  onChange={(e) => setFormData({ ...formData, guarantor_monthly_income: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="2000000"
                />
              </div>
            </div>

            {/* Antigüedad Laboral del Aval */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Antigüedad Laboral del Aval
              </label>
              <select
                value={formData.guarantor_work_seniority}
                onChange={(e) => setFormData({ ...formData, guarantor_work_seniority: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">Seleccionar antigüedad</option>
                <option value="menos_6_meses">Menos de 6 meses</option>
                <option value="6_meses_1_ano">6 meses a 1 año</option>
                <option value="1_2_anos">1 a 2 años</option>
                <option value="2_5_anos">2 a 5 años</option>
                <option value="mas_5_anos">Más de 5 años</option>
              </select>
            </div>

            {/* Email del Aval */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email de Contacto del Aval
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.guarantor_contact_email}
                  onChange={(e) => setFormData({ ...formData, guarantor_contact_email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="aval@ejemplo.com"
                />
              </div>
            </div>

            {/* Teléfono del Aval */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Teléfono de Contacto del Aval
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  value={formData.guarantor_contact_phone}
                  onChange={(e) => setFormData({ ...formData, guarantor_contact_phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="+56 9 8765 4321"
                />
              </div>
            </div>
          </div>

          {/* Domicilio del Aval */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-blue-600" />
              Domicilio del Aval
            </h3>
            
            <div className="grid grid-cols-1 gap-6">
              {/* Dirección del Aval */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Dirección del Aval
                </label>
                <input
                  type="text"
                  value={formData.guarantor_address}
                  onChange={(e) => setFormData({ ...formData, guarantor_address: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Av. Providencia 2500"
                />
              </div>

              {/* Departamento del Aval */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Departamento / Oficina / Casa N° del Aval (Opcional)
                </label>
                <input
                  type="text"
                  value={formData.guarantor_apartment_number}
                  onChange={(e) => setFormData({ ...formData, guarantor_apartment_number: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Depto 1205, Casa 8, Oficina 45"
                />
              </div>

              {/* Región y Comuna del Aval */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Región del Aval
                  </label>
                  <select
                    value={formData.guarantor_region}
                    onChange={(e) => handleRegionChange(e.target.value, true)}
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
                    Comuna del Aval
                  </label>
                  <select
                    value={formData.guarantor_commune}
                    onChange={(e) => setFormData({ ...formData, guarantor_commune: e.target.value })}
                    disabled={!formData.guarantor_region}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      !formData.guarantor_region ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                  >
                    <option value="">
                      {formData.guarantor_region ? 'Seleccionar comuna' : 'Primero selecciona una región'}
                    </option>
                    {formData.guarantor_region && getAvailableCommunes(formData.guarantor_region).map((commune) => (
                      <option key={commune} value={commune}>{commune}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Documentos del Aval */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-600" />
              Documentos del Aval
            </h3>

            <div className="space-y-4">
            {!storageAvailable && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-4">
                <p className="text-sm">
                  <strong>Nota:</strong> La funcionalidad de carga de documentos no está disponible actualmente. 
                  El bucket de almacenamiento 'user-documents' debe ser creado en Supabase Storage.
                </p>
              </div>
            )}

              {/* Cédula del Aval */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Cédula de Identidad del Aval (ambos lados)</p>
                  {formData.guarantor_id_document_url && (
                    <p className="text-sm text-green-600 mt-1 flex items-center">
                      <Check className="h-4 w-4 mr-1" />
                      Documento subido
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {formData.guarantor_id_document_url ? (
                    <button
                      type="button"
                      onClick={() => removeDocument('guarantor_id_document')}
                      className="px-3 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Eliminar
                    </button>
                  ) : (
                    <label className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                      {uploading ? 'Subiendo...' : 'Subir Archivo'}
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleDocumentUpload('guarantor_id_document', file);
                          }
                        }}
                        className="hidden"
                        disabled={uploading || !storageAvailable}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Informe Comercial del Aval */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Informe Comercial del Aval</p>
                  {formData.guarantor_commercial_report_url && (
                    <p className="text-sm text-green-600 mt-1 flex items-center">
                      <Check className="h-4 w-4 mr-1" />
                      Documento subido
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {formData.guarantor_commercial_report_url ? (
                    <button
                      type="button"
                      onClick={() => removeDocument('guarantor_commercial_report')}
                      className="px-3 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Eliminar
                    </button>
                  ) : (
                    <label className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                      {uploading ? 'Subiendo...' : 'Subir Archivo'}
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleDocumentUpload('guarantor_commercial_report', file);
                          }
                        }}
                        className="hidden"
                        disabled={uploading || !storageAvailable}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Estado de carga */}
        {uploading && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-6 py-4 rounded-lg flex items-center">
            <Loader2 className="h-5 w-5 mr-3 animate-spin" />
            Subiendo archivo...
          </div>
        )}

        {/* Mensaje de éxito */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-lg flex items-center">
            <Check className="h-5 w-5 mr-3" />
            ¡Perfil guardado exitosamente!
          </div>
        )}

        {/* Error de envío */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 mr-3" />
            {errors.submit}
          </div>
        )}

        {/* Botón de acción */}
        <div className="flex justify-end pt-6">
          <button
            type="submit"
            disabled={loading || uploading}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <span>Guardar mi Información</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};