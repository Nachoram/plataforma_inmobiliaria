import React, { useState, useEffect } from 'react';
import { supabase, Profile, Document, validateRUT, formatRUT } from '../../lib/supabase';
import CustomButton from '../common/CustomButton';

interface UserProfileFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const UserProfileForm: React.FC<UserProfileFormProps> = ({
  onSuccess,
  onCancel
}) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [newDocuments, setNewDocuments] = useState<File[]>([]);

  const [formData, setFormData] = useState({
    first_name: '',
    paternal_last_name: '',
    maternal_last_name: '',
    rut: '',
    email: '',
    phone: '',
    profession: '',
    marital_status: 'soltero' as 'soltero' | 'casado' | 'divorciado' | 'viudo',
    property_regime: '' as 'sociedad conyugal' | 'separación de bienes' | 'participación en los gananciales' | '',
    address_street: '',
    address_number: '',
    address_department: '',
    address_commune: '',
    address_region: '',
    monthly_income_clp: '',
    nationality: '',
    date_of_birth: '',
    job_seniority: '',
  });

  // Regiones de Chile
  const regions = [
    'Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo',
    'Valparaíso', 'Metropolitana', 'O\'Higgins', 'Maule', 'Ñuble',
    'Biobío', 'La Araucanía', 'Los Ríos', 'Los Lagos', 'Aysén', 'Magallanes'
  ];

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        throw new Error('Error de autenticación: ' + userError.message);
      }
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Cargar perfil
      // Usamos .maybeSingle() porque puede haber casos en que el trigger de creación de perfil falle.
      // Si el perfil es null, el usuario será guiado a completarlo.
      // Ver DEBUG_REGISTRATION_README.md para más detalles sobre cómo depurar el trigger.
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      // Si no existe perfil, inicializar con valores por defecto
      if (!profileData) {
        console.warn('⚠️ Perfil no encontrado para usuario autenticado. Posible problema con trigger de creación de perfil.');
        setProfile(null);
        setFormData({
          first_name: '',
          paternal_last_name: '',
          maternal_last_name: '',
          rut: '',
          email: user.email || '',
          phone: '',
          profession: '',
          marital_status: 'soltero',
          property_regime: '',
          address_street: '',
          address_number: '',
          address_department: '',
          address_commune: '',
          address_region: '',
          monthly_income_clp: '',
          nationality: 'Chilena',
          date_of_birth: '',
          job_seniority: '',
        });
      } else {
        setProfile(profileData);
        setFormData({
          first_name: profileData.first_name || '',
          paternal_last_name: profileData.paternal_last_name || '',
          maternal_last_name: profileData.maternal_last_name || '',
          rut: profileData.rut || '',
          email: profileData.email || user.email || '',
          phone: profileData.phone || '',
          profession: profileData.profession || '',
          marital_status: profileData.marital_status || 'soltero',
          property_regime: profileData.property_regime || '',
          address_street: profileData.address_street || '',
          address_number: profileData.address_number || '',
          address_department: profileData.address_department || '',
          address_commune: profileData.address_commune || '',
          address_region: profileData.address_region || '',
          monthly_income_clp: String(profileData.monthly_income_clp ?? ''),
          nationality: profileData.nationality || 'Chilena',
          date_of_birth: profileData.date_of_birth || '',
          job_seniority: profileData.job_seniority || '',
        });
      }

      // Cargar documentos
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select('*')
        .eq('uploader_id', user.id)
        .order('created_at', { ascending: false });

      if (documentsError) {
        console.error('Error cargando documentos:', documentsError);
      } else {
        setDocuments(documentsData || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRUTChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formattedRUT = formatRUT(value);
    setFormData(prev => ({ ...prev, rut: formattedRUT }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const onlyDigits = value.replace(/[^0-9]/g, '');
    setFormData(prev => ({ ...prev, [name]: onlyDigits }));
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewDocuments(Array.from(e.target.files));
    }
  };

  const uploadDocuments = async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw new Error('Error de autenticación: ' + userError.message);
    if (!user) throw new Error('Usuario no autenticado');
    
    for (const file of newDocuments) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/profile/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('user-documents')
        .upload(fileName, file);
      
      if (error) {
        throw new Error(`Error subiendo documento: ${error.message}`);
      }
      
      // Guardar referencia en la base de datos
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          uploader_id: user.id,
          related_entity_id: user.id,
          related_entity_type: 'application_applicant', // Usamos este tipo para documentos de perfil
          document_type: file.name,
          storage_path: fileName,
          file_name: file.name
        });
      
      if (dbError) {
        throw new Error(`Error guardando documento: ${dbError.message}`);
      }
    }
  };

  const deleteDocument = async (documentId: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);
      
      if (error) throw error;
      
      // Recargar documentos
      await loadProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error eliminando documento');
    }
  };

  const downloadDocument = async (document: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from('user-documents')
        .download(document.storage_path);
      
      if (error) throw error;
      
      // Crear enlace de descarga
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = document.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error descargando documento');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        throw new Error('Error de autenticación: ' + userError.message);
      }
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Validar RUT
      if (formData.rut && !validateRUT(formData.rut)) {
        throw new Error('RUT no es válido');
      }

      const profileData = {
        first_name: formData.first_name,
        paternal_last_name: formData.paternal_last_name,
        maternal_last_name: formData.maternal_last_name,
        rut: formData.rut,
        email: formData.email,
        phone: formData.phone,
        profession: formData.profession,
        marital_status: formData.marital_status,
        property_regime: formData.property_regime || null,
        address_street: formData.address_street,
        address_number: formData.address_number,
        address_department: formData.address_department || null,
        address_commune: formData.address_commune,
        address_region: formData.address_region,
        monthly_income_clp: formData.monthly_income_clp ? parseInt(formData.monthly_income_clp) : 0,
        nationality: formData.nationality || 'Chilena',
        date_of_birth: formData.date_of_birth || null,
        job_seniority: formData.job_seniority || null,
      };

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...profileData
        });

      if (error) throw error;

      // Subir nuevos documentos si hay
      if (newDocuments.length > 0) {
        await uploadDocuments();
      }

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando perfil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando perfil...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Mi Perfil
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {!profile && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="font-semibold text-blue-800">Perfil Incompleto</h3>
              <p className="text-sm text-blue-700">
                Tu perfil no está completamente configurado. Completa la información a continuación para tener acceso completo a todas las funcionalidades.
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Personal */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Información Personal</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre *
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Apellido Paterno *
              </label>
              <input
                type="text"
                name="paternal_last_name"
                value={formData.paternal_last_name}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Apellido Materno *
              </label>
              <input
                type="text"
                name="maternal_last_name"
                value={formData.maternal_last_name}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                RUT *
              </label>
              <input
                type="text"
                value={formData.rut}
                onChange={handleRUTChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="12.345.678-9"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profesión *
              </label>
              <input
                type="text"
                name="profession"
                value={formData.profession}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ingreso Mensual (CLP)
              </label>
              <input
                type="number"
                name="monthly_income_clp"
                value={formData.monthly_income_clp}
                onChange={handleNumberChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                placeholder="Ej: 1200000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nacionalidad
              </label>
              <input
                type="text"
                name="nationality"
                value={formData.nationality}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Chilena"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Nacimiento
              </label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Antigüedad Laboral
              </label>
              <input
                type="text"
                name="job_seniority"
                value={formData.job_seniority}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: 2 años 3 meses"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado Civil *
              </label>
              <select
                name="marital_status"
                value={formData.marital_status}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="soltero">Soltero</option>
                <option value="casado">Casado</option>
                <option value="divorciado">Divorciado</option>
                <option value="viudo">Viudo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Régimen Patrimonial
              </label>
              <select
                name="property_regime"
                value={formData.property_regime}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">No aplica</option>
                <option value="sociedad conyugal">Sociedad Conyugal</option>
                <option value="separación de bienes">Separación de Bienes</option>
                <option value="participación en los gananciales">Participación en los Gananciales</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dirección */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Dirección</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Calle *
              </label>
              <input
                type="text"
                name="address_street"
                value={formData.address_street}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número *
              </label>
              <input
                type="text"
                name="address_number"
                value={formData.address_number}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Departamento
              </label>
              <input
                type="text"
                name="address_department"
                value={formData.address_department}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comuna *
              </label>
              <input
                type="text"
                name="address_commune"
                value={formData.address_commune}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Región *
              </label>
              <select
                name="address_region"
                value={formData.address_region}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Seleccionar región</option>
                {regions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Documentos */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Documentos</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subir Nuevos Documentos
            </label>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleDocumentChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-600 mt-1">
              Cédula de identidad, certificados, contratos, etc.
            </p>
          </div>

          {documents.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-3">Documentos Subidos</h4>
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-md">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{doc.file_name}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(doc.created_at).toLocaleDateString('es-CL')}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => downloadDocument(doc)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Descargar
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteDocument(doc.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="flex justify-end space-x-4">
          {onCancel && (
            <CustomButton
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Cancelar
            </CustomButton>
          )}
          <CustomButton
            type="submit"
            variant="primary"
            disabled={saving}
            loading={saving}
            loadingText="Guardando..."
          >
            Guardar Perfil
          </CustomButton>
        </div>
      </form>
    </div>
  );
};

export default UserProfileForm;