import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { 
  User, 
  FileText, 
  Users, 
  Save, 
  CheckCircle, 
  AlertCircle,
  Upload,
  X,
  Plus,
  Trash2,
  Building2,
  UserCircle,
  Home,
  ShoppingCart,
  Briefcase
} from 'lucide-react';

// Tipos
type ProfileType = 'corredor_independiente' | 'empresa_corretaje' | 'buscar_arriendo' | 'buscar_compra';
type EntityType = 'natural' | 'juridica';

interface UserDocument {
  id?: string;
  doc_type: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  uploaded_at?: string;
}

interface UserGuarantor {
  id?: string;
  entity_type: EntityType;
  employment_type?: 'dependiente' | 'independiente'; // Solo para entity_type = 'natural'
  first_name?: string;
  paternal_last_name?: string;
  maternal_last_name?: string;
  rut?: string;
  company_name?: string;
  company_rut?: string;
  legal_representative_name?: string;
  legal_representative_rut?: string;
  profession?: string;
  monthly_income?: number;
  contact_email?: string;
  contact_phone?: string;
  address_street?: string;
  address_number?: string;
  address_department?: string;
  address_commune?: string;
  address_region?: string;
  unit_type?: string;
  documents?: UserDocument[];
}

interface ProfileData {
  first_name: string;
  paternal_last_name: string;
  maternal_last_name: string;
  rut: string;
  entity_type: EntityType;
  employment_type?: 'dependiente' | 'independiente'; // Solo para persona natural
  user_profile_type: ProfileType[];
  professional_type: string;
  company_legal_name?: string;
  company_rut?: string;
  legal_representative_name?: string;
  legal_representative_rut?: string;
  address_street?: string;
  address_number?: string;
  address_commune?: string;
  address_region?: string;
  contact_email?: string;
  phone?: string;
}

const DOCUMENT_TYPES_NATURAL_DEPENDIENTE = [
  { value: 'dicom_personal', label: 'Informe DICOM Personal' },
  { value: 'carpeta_tributaria', label: 'Carpeta Tributaria' },
  { value: 'cedula_identidad', label: 'Cédula de Identidad' },
  { value: 'certificado_antiguedad_laboral', label: 'Certificado Antigüedad Laboral' },
  { value: 'liquidaciones_sueldo', label: 'Liquidaciones de Sueldo (últimos 3 meses)' },
  { value: 'contrato_trabajo', label: 'Contrato de Trabajo' },
];

const DOCUMENT_TYPES_NATURAL_INDEPENDIENTE = [
  { value: 'dicom_personal', label: 'Informe DICOM Personal' },
  { value: 'carpeta_tributaria', label: 'Carpeta Tributaria' },
  { value: 'cedula_identidad', label: 'Cédula de Identidad' },
  { value: 'declaracion_impuestos', label: 'Declaración de Impuestos (últimos 2 años)' },
  { value: 'boletas_honorarios', label: 'Boletas de Honorarios (últimos 6 meses)' },
  { value: 'certificado_cotizaciones', label: 'Certificado de Cotizaciones' },
  { value: 'inicio_actividades', label: 'Inicio de Actividades' },
];

const DOCUMENT_TYPES_JURIDICA = [
  { value: 'dicom_empresa', label: 'Informe DICOM Empresa' },
  { value: 'carpeta_tributaria_empresa', label: 'Carpeta Tributaria Empresa' },
  { value: 'rut_empresa', label: 'RUT Empresa' },
  { value: 'escritura_constitucion', label: 'Escritura de Constitución' },
  { value: 'poderes', label: 'Poderes' },
  { value: 'certificado_vigencia', label: 'Certificado de Vigencia' },
];

const PROFILE_TYPES = [
  { value: 'corredor_independiente', label: 'Corredor Independiente', icon: Briefcase },
  { value: 'empresa_corretaje', label: 'Empresa de Corretaje', icon: Building2 },
  { value: 'buscar_arriendo', label: 'Busco Arriendo', icon: Home },
  { value: 'buscar_compra', label: 'Busco Comprar', icon: ShoppingCart },
];

export const UserProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'documents' | 'guarantors'>('profile');
  
  // Estados del perfil
  const [profileData, setProfileData] = useState<ProfileData>({
    first_name: '',
    paternal_last_name: '',
    maternal_last_name: '',
    rut: '',
    entity_type: 'natural',
    employment_type: 'dependiente',
    user_profile_type: [],
    professional_type: '',
    contact_email: '',
    phone: '',
  });

  // Estados de documentos
  const [userDocuments, setUserDocuments] = useState<UserDocument[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  // Estados de avales
  const [guarantors, setGuarantors] = useState<UserGuarantor[]>([]);
  const [selectedGuarantor, setSelectedGuarantor] = useState<string | null>(null);

  // Estados UI
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Cargar datos del usuario
  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Cargar perfil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profileError && profile) {
        setProfileData({
          first_name: profile.first_name || '',
          paternal_last_name: profile.paternal_last_name || '',
          maternal_last_name: profile.maternal_last_name || '',
          rut: profile.rut || '',
          entity_type: profile.entity_type || 'natural',
          employment_type: profile.employment_type || 'dependiente',
          user_profile_type: profile.user_profile_type || [],
          professional_type: profile.professional_type || '',
          company_legal_name: profile.company_legal_name || '',
          company_rut: profile.company_rut || '',
          legal_representative_name: profile.legal_representative_name || '',
          legal_representative_rut: profile.legal_representative_rut || '',
          address_street: profile.address_street || '',
          address_number: profile.address_number || '',
          address_commune: profile.address_commune || '',
          address_region: profile.address_region || '',
          contact_email: profile.contact_email || user.email || '',
          phone: profile.phone || '',
        });
      }

      // Cargar documentos
      const { data: docs, error: docsError } = await supabase
        .from('user_documents')
        .select('*')
        .eq('user_id', user.id);

      if (!docsError && docs) {
        setUserDocuments(docs);
      }

      // Cargar avales con sus documentos
      const { data: guarantorsData, error: guarantorsError } = await supabase
        .from('user_guarantors')
        .select(`
          *,
          documents:user_guarantor_documents(*)
        `)
        .eq('user_id', user.id);

      if (!guarantorsError && guarantorsData) {
        setGuarantors(guarantorsData);
      }

    } catch (error) {
      console.error('Error loading profile:', error);
      showMessage('error', 'Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // Guardar perfil
  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profileData.first_name,
          paternal_last_name: profileData.paternal_last_name,
          maternal_last_name: profileData.maternal_last_name,
          rut: profileData.rut,
          entity_type: profileData.entity_type,
          employment_type: profileData.employment_type,
          user_profile_type: profileData.user_profile_type,
          professional_type: profileData.professional_type,
          company_legal_name: profileData.company_legal_name,
          company_rut: profileData.company_rut,
          legal_representative_name: profileData.legal_representative_name,
          legal_representative_rut: profileData.legal_representative_rut,
          address_street: profileData.address_street,
          address_number: profileData.address_number,
          address_commune: profileData.address_commune,
          address_region: profileData.address_region,
          contact_email: profileData.contact_email,
          phone: profileData.phone,
          profile_completed: true,
          profile_completed_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      showMessage('success', 'Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error saving profile:', error);
      showMessage('error', 'Error al guardar el perfil');
    } finally {
      setSaving(false);
    }
  };

  // Toggle tipo de perfil
  const toggleProfileType = (type: ProfileType) => {
    setProfileData(prev => {
      const types = prev.user_profile_type.includes(type)
        ? prev.user_profile_type.filter(t => t !== type)
        : [...prev.user_profile_type, type];
      
      return {
        ...prev,
        user_profile_type: types,
        professional_type: types.length > 0 ? types[0] : '',
      };
    });
  };

  // Subir documento personal
  const handleUploadDocument = async (docType: string, file: File) => {
    if (!user) return;

    try {
      setUploadingDoc(docType);

      // Subir archivo a Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${docType}_${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('user-documents')
        .getPublicUrl(fileName);

      // Guardar en base de datos
      const { data, error } = await supabase
        .from('user_documents')
        .upsert({
          user_id: user.id,
          doc_type: docType,
          file_name: file.name,
          file_url: publicUrl,
          file_size: file.size,
          mime_type: file.type,
        }, {
          onConflict: 'user_id,doc_type'
        })
        .select()
        .single();

      if (error) throw error;

      // Actualizar estado
      setUserDocuments(prev => {
        const filtered = prev.filter(d => d.doc_type !== docType);
        return [...filtered, data];
      });

      showMessage('success', 'Documento subido correctamente');
    } catch (error) {
      console.error('Error uploading document:', error);
      showMessage('error', 'Error al subir el documento');
    } finally {
      setUploadingDoc(null);
    }
  };

  // Eliminar documento personal
  const handleDeleteDocument = async (docId: string, fileUrl: string) => {
    if (!user) return;

    try {
      // Extraer path del archivo desde la URL
      const urlParts = fileUrl.split('/');
      const filePath = urlParts.slice(urlParts.indexOf('user-documents') + 1).join('/');

      // Eliminar de storage
      await supabase.storage
        .from('user-documents')
        .remove([filePath]);

      // Eliminar de base de datos
      const { error } = await supabase
        .from('user_documents')
        .delete()
        .eq('id', docId);

      if (error) throw error;

      setUserDocuments(prev => prev.filter(d => d.id !== docId));
      showMessage('success', 'Documento eliminado');
    } catch (error) {
      console.error('Error deleting document:', error);
      showMessage('error', 'Error al eliminar el documento');
    }
  };

  // Agregar aval
  const handleAddGuarantor = async () => {
    if (!user) return;

    const newGuarantor: UserGuarantor = {
      entity_type: 'natural',
      first_name: '',
      paternal_last_name: '',
      maternal_last_name: '',
      rut: '',
      documents: [],
    };

    try {
      const { data, error } = await supabase
        .from('user_guarantors')
        .insert({
          user_id: user.id,
          ...newGuarantor,
        })
        .select()
        .single();

      if (error) throw error;

      setGuarantors(prev => [...prev, { ...data, documents: [] }]);
      setSelectedGuarantor(data.id);
      showMessage('success', 'Aval agregado');
    } catch (error) {
      console.error('Error adding guarantor:', error);
      showMessage('error', 'Error al agregar aval');
    }
  };

  // Actualizar aval
  const handleUpdateGuarantor = async (guarantorId: string, updates: Partial<UserGuarantor>) => {
    try {
      const { error } = await supabase
        .from('user_guarantors')
        .update(updates)
        .eq('id', guarantorId);

      if (error) throw error;

      setGuarantors(prev =>
        prev.map(g => g.id === guarantorId ? { ...g, ...updates } : g)
      );

      showMessage('success', 'Aval actualizado');
    } catch (error) {
      console.error('Error updating guarantor:', error);
      showMessage('error', 'Error al actualizar aval');
    }
  };

  // Eliminar aval
  const handleDeleteGuarantor = async (guarantorId: string) => {
    try {
      const { error } = await supabase
        .from('user_guarantors')
        .delete()
        .eq('id', guarantorId);

      if (error) throw error;

      setGuarantors(prev => prev.filter(g => g.id !== guarantorId));
      if (selectedGuarantor === guarantorId) {
        setSelectedGuarantor(null);
      }
      showMessage('success', 'Aval eliminado');
    } catch (error) {
      console.error('Error deleting guarantor:', error);
      showMessage('error', 'Error al eliminar aval');
    }
  };

  // Subir documento de aval
  const handleUploadGuarantorDocument = async (guarantorId: string, docType: string, file: File) => {
    if (!user) return;

    try {
      // Subir archivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/guarantors/${guarantorId}/${docType}_${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('user-documents')
        .getPublicUrl(fileName);

      // Guardar en base de datos
      const { data, error } = await supabase
        .from('user_guarantor_documents')
        .upsert({
          user_guarantor_id: guarantorId,
          doc_type: docType,
          file_name: file.name,
          file_url: publicUrl,
          file_size: file.size,
          mime_type: file.type,
        }, {
          onConflict: 'user_guarantor_id,doc_type'
        })
        .select()
        .single();

      if (error) throw error;

      // Actualizar estado
      setGuarantors(prev =>
        prev.map(g => {
          if (g.id === guarantorId) {
            const docs = g.documents || [];
            const filtered = docs.filter(d => d.doc_type !== docType);
            return { ...g, documents: [...filtered, data] };
          }
          return g;
        })
      );

      showMessage('success', 'Documento del aval subido');
    } catch (error) {
      console.error('Error uploading guarantor document:', error);
      showMessage('error', 'Error al subir documento del aval');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-orange-50/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-50 via-white to-orange-50 rounded-2xl shadow-lg border border-blue-100/50 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <UserCircle className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
              <p className="text-gray-600">Gestiona tu información, documentos y avales frecuentes</p>
            </div>
          </div>
        </div>

        {/* Message Banner */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'profile'
                  ? 'text-blue-700 border-b-2 border-blue-700 bg-blue-50/50'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              <User className="h-4 w-4" />
              Perfil e Información
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'documents'
                  ? 'text-blue-700 border-b-2 border-blue-700 bg-blue-50/50'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              <FileText className="h-4 w-4" />
              Mis Documentos
              {userDocuments.length > 0 && (
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                  {userDocuments.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('guarantors')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'guarantors'
                  ? 'text-blue-700 border-b-2 border-blue-700 bg-blue-50/50'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              <Users className="h-4 w-4" />
              Mis Avales
              {guarantors.length > 0 && (
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                  {guarantors.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {activeTab === 'profile' && (
            <ProfileSection
              profileData={profileData}
              setProfileData={setProfileData}
              toggleProfileType={toggleProfileType}
              handleSave={handleSaveProfile}
              saving={saving}
            />
          )}

          {activeTab === 'documents' && (
            <DocumentsSection
              documents={userDocuments}
              entityType={profileData.entity_type}
              employmentType={profileData.employment_type}
              onUpload={handleUploadDocument}
              onDelete={handleDeleteDocument}
              uploadingDoc={uploadingDoc}
            />
          )}

          {activeTab === 'guarantors' && (
            <GuarantorsSection
              guarantors={guarantors}
              selectedGuarantor={selectedGuarantor}
              setSelectedGuarantor={setSelectedGuarantor}
              onAdd={handleAddGuarantor}
              onUpdate={handleUpdateGuarantor}
              onDelete={handleDeleteGuarantor}
              onUploadDocument={handleUploadGuarantorDocument}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// SUB-COMPONENTES
// ============================================

interface ProfileSectionProps {
  profileData: ProfileData;
  setProfileData: React.Dispatch<React.SetStateAction<ProfileData>>;
  toggleProfileType: (type: ProfileType) => void;
  handleSave: () => void;
  saving: boolean;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({
  profileData,
  setProfileData,
  toggleProfileType,
  handleSave,
  saving,
}) => {
  return (
    <div className="space-y-8">
      {/* Declaración de Perfil */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-blue-600" />
          Declaración de Perfil
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Selecciona uno o más perfiles que te describan (puedes elegir múltiples)
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PROFILE_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = profileData.user_profile_type.includes(type.value as ProfileType);
            
            return (
              <button
                key={type.value}
                onClick={() => toggleProfileType(type.value as ProfileType)}
                className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold">{type.label}</div>
                </div>
                {isSelected && (
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tipo de Entidad */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Tipo de Registro</h3>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setProfileData(prev => ({ ...prev, entity_type: 'natural' }))}
            className={`p-4 rounded-lg border-2 transition-all ${
              profileData.entity_type === 'natural'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <User className="h-6 w-6 mx-auto mb-2" />
            <div className="font-semibold">Persona Natural</div>
          </button>
          <button
            onClick={() => setProfileData(prev => ({ ...prev, entity_type: 'juridica' }))}
            className={`p-4 rounded-lg border-2 transition-all ${
              profileData.entity_type === 'juridica'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <Building2 className="h-6 w-6 mx-auto mb-2" />
            <div className="font-semibold">Persona Jurídica</div>
          </button>
        </div>
      </div>

      {/* Información Personal/Empresa */}
      {profileData.entity_type === 'natural' ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Información Personal</h3>
          
          {/* Tipo de Empleo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Empleo
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setProfileData(prev => ({ ...prev, employment_type: 'dependiente' }))}
                className={`p-4 rounded-lg border-2 transition-all ${
                  profileData.employment_type === 'dependiente'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <Briefcase className="h-6 w-6 mx-auto mb-2" />
                <div className="font-semibold">Trabajador Dependiente</div>
                <div className="text-xs text-gray-500 mt-1">Contrato de trabajo, liquidaciones</div>
              </button>
              <button
                onClick={() => setProfileData(prev => ({ ...prev, employment_type: 'independiente' }))}
                className={`p-4 rounded-lg border-2 transition-all ${
                  profileData.employment_type === 'independiente'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <UserCircle className="h-6 w-6 mx-auto mb-2" />
                <div className="font-semibold">Trabajador Independiente</div>
                <div className="text-xs text-gray-500 mt-1">Boletas de honorarios, F22</div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <input
                type="text"
                value={profileData.first_name}
                onChange={(e) => setProfileData(prev => ({ ...prev, first_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Apellido Paterno
              </label>
              <input
                type="text"
                value={profileData.paternal_last_name}
                onChange={(e) => setProfileData(prev => ({ ...prev, paternal_last_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Apellido Materno
              </label>
              <input
                type="text"
                value={profileData.maternal_last_name}
                onChange={(e) => setProfileData(prev => ({ ...prev, maternal_last_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                RUT
              </label>
              <input
                type="text"
                value={profileData.rut}
                onChange={(e) => setProfileData(prev => ({ ...prev, rut: e.target.value }))}
                placeholder="12.345.678-9"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+56 9 1234 5678"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Información de la Empresa</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Razón Social
              </label>
              <input
                type="text"
                value={profileData.company_legal_name}
                onChange={(e) => setProfileData(prev => ({ ...prev, company_legal_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                RUT Empresa
              </label>
              <input
                type="text"
                value={profileData.company_rut}
                onChange={(e) => setProfileData(prev => ({ ...prev, company_rut: e.target.value }))}
                placeholder="12.345.678-9"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre Representante Legal
              </label>
              <input
                type="text"
                value={profileData.legal_representative_name}
                onChange={(e) => setProfileData(prev => ({ ...prev, legal_representative_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                RUT Representante Legal
              </label>
              <input
                type="text"
                value={profileData.legal_representative_rut}
                onChange={(e) => setProfileData(prev => ({ ...prev, legal_representative_rut: e.target.value }))}
                placeholder="12.345.678-9"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}

      {/* Dirección */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Dirección</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Calle
            </label>
            <input
              type="text"
              value={profileData.address_street}
              onChange={(e) => setProfileData(prev => ({ ...prev, address_street: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número
            </label>
            <input
              type="text"
              value={profileData.address_number}
              onChange={(e) => setProfileData(prev => ({ ...prev, address_number: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comuna
            </label>
            <input
              type="text"
              value={profileData.address_commune}
              onChange={(e) => setProfileData(prev => ({ ...prev, address_commune: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Región
            </label>
            <input
              type="text"
              value={profileData.address_region}
              onChange={(e) => setProfileData(prev => ({ ...prev, address_region: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Contacto */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Contacto</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={profileData.contact_email}
              onChange={(e) => setProfileData(prev => ({ ...prev, contact_email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Botón Guardar */}
      <div className="flex justify-end pt-6 border-t border-gray-200">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Guardar Cambios
            </>
          )}
        </button>
      </div>
    </div>
  );
};

interface DocumentsSectionProps {
  documents: UserDocument[];
  entityType: EntityType;
  employmentType?: 'dependiente' | 'independiente';
  onUpload: (docType: string, file: File) => void;
  onDelete: (docId: string, fileUrl: string) => void;
  uploadingDoc: string | null;
}

const DocumentsSection: React.FC<DocumentsSectionProps> = ({
  documents,
  entityType,
  employmentType,
  onUpload,
  onDelete,
  uploadingDoc,
}) => {
  // Determinar qué tipos de documentos mostrar
  let docTypes;
  if (entityType === 'natural') {
    docTypes = employmentType === 'independiente' 
      ? DOCUMENT_TYPES_NATURAL_INDEPENDIENTE 
      : DOCUMENT_TYPES_NATURAL_DEPENDIENTE;
  } else {
    docTypes = DOCUMENT_TYPES_JURIDICA;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Mis Documentos</h2>
        <p className="text-sm text-gray-600">
          Sube y gestiona tus documentos personales. Estos documentos podrán ser reutilizados en futuras postulaciones.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {docTypes.map((docType) => {
          const existingDoc = documents.find(d => d.doc_type === docType.value);
          const isUploading = uploadingDoc === docType.value;

          return (
            <div
              key={docType.value}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{docType.label}</div>
                    {existingDoc && (
                      <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        {existingDoc.file_name}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {existingDoc ? (
                    <>
                      <a
                        href={existingDoc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        Ver
                      </a>
                      <button
                        onClick={() => onDelete(existingDoc.id!, existingDoc.file_url)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  ) : null}

                  <label className={`px-3 py-1.5 text-sm rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
                    isUploading
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}>
                    {isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <Upload className="h-3 w-3" />
                        {existingDoc ? 'Reemplazar' : 'Subir'}
                      </>
                    )}
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      disabled={isUploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          onUpload(docType.value, file);
                          e.target.value = '';
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface GuarantorsSectionProps {
  guarantors: UserGuarantor[];
  selectedGuarantor: string | null;
  setSelectedGuarantor: (id: string | null) => void;
  onAdd: () => void;
  onUpdate: (id: string, updates: Partial<UserGuarantor>) => void;
  onDelete: (id: string) => void;
  onUploadDocument: (guarantorId: string, docType: string, file: File) => void;
}

const GuarantorsSection: React.FC<GuarantorsSectionProps> = ({
  guarantors,
  selectedGuarantor,
  setSelectedGuarantor,
  onAdd,
  onUpdate,
  onDelete,
  onUploadDocument,
}) => {
  const selectedG = guarantors.find(g => g.id === selectedGuarantor);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Mis Avales Frecuentes</h2>
          <p className="text-sm text-gray-600">
            Agrega y gestiona avales que uses frecuentemente en tus postulaciones
          </p>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Agregar Aval
        </button>
      </div>

      {guarantors.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">No tienes avales registrados</p>
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Agregar Primer Aval
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de avales */}
          <div className="lg:col-span-1 space-y-2">
            {guarantors.map((guarantor) => {
              const name = guarantor.entity_type === 'natural'
                ? `${guarantor.first_name} ${guarantor.paternal_last_name}`
                : guarantor.company_name;

              return (
                <button
                  key={guarantor.id}
                  onClick={() => setSelectedGuarantor(guarantor.id!)}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    selectedGuarantor === guarantor.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      guarantor.entity_type === 'natural' ? 'bg-blue-100' : 'bg-purple-100'
                    }`}>
                      {guarantor.entity_type === 'natural' ? (
                        <User className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Building2 className="h-5 w-5 text-purple-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 truncate">
                        {name || 'Sin nombre'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {guarantor.entity_type === 'natural' ? 'Persona Natural' : 'Empresa'}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detalles del aval seleccionado */}
          {selectedG && (
            <div className="lg:col-span-2 border border-gray-200 rounded-lg p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Detalles del Aval</h3>
                <button
                  onClick={() => {
                    if (confirm('¿Estás seguro de eliminar este aval?')) {
                      onDelete(selectedG.id!);
                    }
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Tipo de entidad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Entidad
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => onUpdate(selectedG.id!, { entity_type: 'natural' })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedG.entity_type === 'natural'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <User className="h-4 w-4 mx-auto mb-1" />
                    <div className="text-sm font-semibold">Persona Natural</div>
                  </button>
                  <button
                    onClick={() => onUpdate(selectedG.id!, { entity_type: 'juridica' })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedG.entity_type === 'juridica'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <Building2 className="h-4 w-4 mx-auto mb-1" />
                    <div className="text-sm font-semibold">Empresa</div>
                  </button>
                </div>
              </div>

              {/* Campos según tipo */}
              {selectedG.entity_type === 'natural' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre
                      </label>
                      <input
                        type="text"
                        value={selectedG.first_name || ''}
                        onChange={(e) => onUpdate(selectedG.id!, { first_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Apellido Paterno
                      </label>
                      <input
                        type="text"
                        value={selectedG.paternal_last_name || ''}
                        onChange={(e) => onUpdate(selectedG.id!, { paternal_last_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        RUT
                      </label>
                      <input
                        type="text"
                        value={selectedG.rut || ''}
                        onChange={(e) => onUpdate(selectedG.id!, { rut: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={selectedG.contact_email || ''}
                        onChange={(e) => onUpdate(selectedG.id!, { contact_email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Razón Social
                      </label>
                      <input
                        type="text"
                        value={selectedG.company_name || ''}
                        onChange={(e) => onUpdate(selectedG.id!, { company_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        RUT Empresa
                      </label>
                      <input
                        type="text"
                        value={selectedG.company_rut || ''}
                        onChange={(e) => onUpdate(selectedG.id!, { company_rut: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tipo de empleo para persona natural */}
              {selectedG.entity_type === 'natural' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Empleo
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => onUpdate(selectedG.id!, { employment_type: 'dependiente' })}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        (!selectedG.employment_type || selectedG.employment_type === 'dependiente')
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="text-sm font-semibold">Dependiente</div>
                    </button>
                    <button
                      onClick={() => onUpdate(selectedG.id!, { employment_type: 'independiente' })}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedG.employment_type === 'independiente'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="text-sm font-semibold">Independiente</div>
                    </button>
                  </div>
                </div>
              )}

              {/* Documentos del aval */}
              <div className="pt-6 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-4">Documentos del Aval</h4>
                <div className="space-y-3">
                  {(() => {
                    let avalDocTypes;
                    if (selectedG.entity_type === 'natural') {
                      avalDocTypes = (!selectedG.employment_type || selectedG.employment_type === 'dependiente')
                        ? DOCUMENT_TYPES_NATURAL_DEPENDIENTE
                        : DOCUMENT_TYPES_NATURAL_INDEPENDIENTE;
                    } else {
                      avalDocTypes = DOCUMENT_TYPES_JURIDICA;
                    }
                    return avalDocTypes.map((docType) => {
                    const existingDoc = selectedG.documents?.find(d => d.doc_type === docType.value);

                    return (
                      <div
                        key={docType.value}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <div className="flex-1">
                            <div className="text-sm font-medium">{docType.label}</div>
                            {existingDoc && (
                              <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                {existingDoc.file_name}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {existingDoc && (
                            <a
                              href={existingDoc.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            >
                              Ver
                            </a>
                          )}
                          <label className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors cursor-pointer">
                            {existingDoc ? 'Cambiar' : 'Subir'}
                            <input
                              type="file"
                              className="hidden"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  onUploadDocument(selectedG.id!, docType.value, file);
                                  e.target.value = '';
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    );
                    });
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserProfilePage;

