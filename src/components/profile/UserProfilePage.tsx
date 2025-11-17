import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import {
  User,
  Save,
  CheckCircle,
  AlertCircle,
  Building2,
  UserCircle,
  Home,
  ShoppingCart,
  Briefcase
} from 'lucide-react';

// Tipos
type ProfileType = 'corredor_independiente' | 'empresa_corretaje' | 'buscar_arriendo' | 'buscar_compra';
type EntityType = 'natural' | 'juridica';

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

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <ProfileSection
            profileData={profileData}
            setProfileData={setProfileData}
            toggleProfileType={toggleProfileType}
            handleSave={handleSaveProfile}
            saving={saving}
          />
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


export default UserProfilePage;

