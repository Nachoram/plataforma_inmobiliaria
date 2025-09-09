import React, { useState, useEffect } from 'react';
import { supabase, Property, formatPriceCLP, validateRUT, formatRUT } from '../../lib/supabase';
import CustomButton from '../CustomButton';

interface RentalApplicationFormProps {
  property: Property;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const RentalApplicationForm: React.FC<RentalApplicationFormProps> = ({
  property,
  onSuccess,
  onCancel
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGuarantor, setShowGuarantor] = useState(false);

  // Datos del postulante
  const [applicantData, setApplicantData] = useState({
    first_name: '',
    paternal_last_name: '',
    maternal_last_name: '',
    rut: '',
    profession: '',
    monthly_income_clp: '',
    age: '',
    nationality: 'Chilena',
    marital_status: 'soltero' as 'soltero' | 'casado' | 'divorciado' | 'viudo',
    address_street: '',
    address_number: '',
    address_department: '',
    address_commune: '',
    address_region: '',
    phone: '',
    email: '',
  });

  // Datos del aval (opcional)
  const [guarantorData, setGuarantorData] = useState({
    first_name: '',
    paternal_last_name: '',
    maternal_last_name: '',
    rut: '',
    profession: '',
    monthly_income_clp: '',
    address_street: '',
    address_number: '',
    address_department: '',
    address_commune: '',
    address_region: '',
  });

  const [message, setMessage] = useState('');
  const [applicantDocuments, setApplicantDocuments] = useState<File[]>([]);
  const [guarantorDocuments, setGuarantorDocuments] = useState<File[]>([]);

  // Regiones de Chile
  const regions = [
    'Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo',
    'Valparaíso', 'Metropolitana', 'O\'Higgins', 'Maule', 'Ñuble',
    'Biobío', 'La Araucanía', 'Los Ríos', 'Los Lagos', 'Aysén', 'Magallanes'
  ];

  // Precarga de datos del perfil del usuario
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (profile) {
            setApplicantData(prev => ({
              ...prev,
              first_name: profile.first_name || '',
              paternal_last_name: profile.paternal_last_name || '',
              maternal_last_name: profile.maternal_last_name || '',
              rut: profile.rut || '',
              profession: profile.profession || '',
              phone: profile.phone || '',
              email: profile.email || '',
              marital_status: profile.marital_status || 'soltero',
              address_street: profile.address_street || '',
              address_number: profile.address_number || '',
              address_department: profile.address_department || '',
              address_commune: profile.address_commune || '',
              address_region: profile.address_region || '',
            }));
          }
        }
      } catch (err) {
        console.error('Error loading user profile:', err);
      }
    };

    loadUserProfile();
  }, []);

  const handleApplicantChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setApplicantData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGuarantorChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setGuarantorData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRUTChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'applicant' | 'guarantor') => {
    const value = e.target.value;
    const formattedRUT = formatRUT(value);

    if (type === 'applicant') {
      setApplicantData(prev => ({ ...prev, rut: formattedRUT }));
    } else {
      setGuarantorData(prev => ({ ...prev, rut: formattedRUT }));
    }
  };

  const uploadDocuments = async (files: File[], entityId: string, entityType: 'application_applicant' | 'application_guarantor') => {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Usuario no autenticado');

    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.data.user.id}/${entityId}/${Date.now()}.${fileExt}`;

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
          uploader_id: user.data.user.id,
          related_entity_id: entityId,
          related_entity_type: entityType,
          document_type: file.name,
          storage_path: fileName,
          file_name: file.name
        });

      if (dbError) {
        throw new Error(`Error guardando documento: ${dbError.message}`);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        throw new Error('Usuario no autenticado');
      }

      // Validar RUT del postulante
      if (!validateRUT(applicantData.rut)) {
        throw new Error('RUT del postulante no es válido');
      }

      // Validar RUT del aval si existe
      if (showGuarantor && !validateRUT(guarantorData.rut)) {
        throw new Error('RUT del aval no es válido');
      }

      let guarantorId: string | null = null;

      // PRIMERO: Crear aval si existe
      if (showGuarantor) {
        const { data: guarantor, error: guarantorError } = await supabase
          .from('guarantors')
          .insert({
            first_name: guarantorData.first_name,
            paternal_last_name: guarantorData.paternal_last_name,
            maternal_last_name: guarantorData.maternal_last_name,
            rut: guarantorData.rut,
            profession: guarantorData.profession,
            monthly_income_clp: parseInt(guarantorData.monthly_income_clp),
            address_street: guarantorData.address_street,
            address_number: guarantorData.address_number,
            address_department: guarantorData.address_department || null,
            address_commune: guarantorData.address_commune,
            address_region: guarantorData.address_region,
          })
          .select()
          .single();

        if (guarantorError) throw guarantorError;
        guarantorId = guarantor.id;
      }

      // SEGUNDO: Obtener perfil completo del postulante para snapshot
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.data.user.id)
        .single();

      if (profileError) throw profileError;

      // TERCERO: Crear postulación con todos los datos del snapshot
      const { data: application, error: applicationError } = await supabase
        .from('applications')
        .insert({
          property_id: property.id,
          applicant_id: user.data.user.id,
          guarantor_id: guarantorId,
          message: message,
          snapshot_applicant_first_name: profile.first_name,
          snapshot_applicant_paternal_last_name: profile.paternal_last_name,
          snapshot_applicant_maternal_last_name: profile.maternal_last_name,
          snapshot_applicant_rut: profile.rut,
          snapshot_applicant_profession: profile.profession,
          snapshot_applicant_monthly_income_clp: profile.monthly_income_clp,
          snapshot_applicant_age: profile.age,
          snapshot_applicant_nationality: profile.nationality,
          snapshot_applicant_marital_status: profile.marital_status,
          snapshot_applicant_phone: profile.phone,
          snapshot_applicant_email: profile.email,
          snapshot_applicant_address_street: profile.address_street,
          snapshot_applicant_address_number: profile.address_number,
          snapshot_applicant_address_department: profile.address_department,
          snapshot_applicant_address_commune: profile.address_commune,
          snapshot_applicant_address_region: profile.address_region,
        })
        .select()
        .single();

      if (applicationError) throw applicationError;

      // Subir documentos del postulante
      if (applicantDocuments.length > 0) {
        await uploadDocuments(applicantDocuments, application.id, 'application_applicant');
      }

      // Subir documentos del aval
      if (showGuarantor && guarantorDocuments.length > 0) {
        await uploadDocuments(guarantorDocuments, application.id, 'application_guarantor');
      }

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header con información de la propiedad */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          📋 Postulación de Arriendo
        </h2>
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            {property.address_street} {property.address_number}
          </h3>
          <p className="text-blue-700 mb-2">
            {property.address_commune}, {property.address_region}
          </p>
          <div className="flex items-center space-x-4 text-blue-800">
            <span className="font-semibold">
              {formatPriceCLP(property.price_clp)} / mes
            </span>
            {property.common_expenses_clp && (
              <span className="text-sm">
                + {formatPriceCLP(property.common_expenses_clp)} gastos comunes
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          ⚠️ {error}
        </div>
      )}

      {/* SECCIÓN 1: Datos del Postulante */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 pb-3 border-b-2 border-blue-200">
          👤 Datos del Postulante
        </h3>

        {/* Información Personal */}
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-gray-800 mb-4">Información Personal</h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={applicantData.first_name}
                  onChange={handleApplicantChange}
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
                  value={applicantData.paternal_last_name}
                  onChange={handleApplicantChange}
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
                  value={applicantData.maternal_last_name}
                  onChange={handleApplicantChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  RUT *
                </label>
                <input
                  type="text"
                  value={applicantData.rut}
                  onChange={(e) => handleRUTChange(e, 'applicant')}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="12.345.678-9"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Edad *
                </label>
                <input
                  type="number"
                  name="age"
                  value={applicantData.age}
                  onChange={handleApplicantChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  min="18"
                  max="100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nacionalidad *
                </label>
                <input
                  type="text"
                  name="nationality"
                  value={applicantData.nationality}
                  onChange={handleApplicantChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado Civil *
                </label>
                <select
                  name="marital_status"
                  value={applicantData.marital_status}
                  onChange={handleApplicantChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="soltero">Soltero</option>
                  <option value="casado">Casado</option>
                  <option value="divorciado">Divorciado</option>
                  <option value="viudo">Viudo</option>
                </select>
              </div>
            </div>
          </div>

          {/* Información Laboral y Contacto */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-medium text-gray-800 mb-4">Información Laboral y Contacto</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profesión *
                </label>
                <input
                  type="text"
                  name="profession"
                  value={applicantData.profession}
                  onChange={handleApplicantChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ingreso Mensual (CLP) *
                </label>
                <input
                  type="number"
                  name="monthly_income_clp"
                  value={applicantData.monthly_income_clp}
                  onChange={handleApplicantChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  min="0"
                />
                {applicantData.monthly_income_clp && (
                  <p className="text-sm text-green-600 mt-1 font-medium">
                    💰 {formatPriceCLP(parseInt(applicantData.monthly_income_clp))}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={applicantData.phone}
                  onChange={handleApplicantChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={applicantData.email}
                  onChange={handleApplicantChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección Actual *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  name="address_street"
                  value={applicantData.address_street}
                  onChange={handleApplicantChange}
                  placeholder="Calle"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <input
                  type="text"
                  name="address_number"
                  value={applicantData.address_number}
                  onChange={handleApplicantChange}
                  placeholder="Número"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  name="address_department"
                  value={applicantData.address_department}
                  onChange={handleApplicantChange}
                  placeholder="Depto (opcional)"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  name="address_commune"
                  value={applicantData.address_commune}
                  onChange={handleApplicantChange}
                  placeholder="Comuna"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <select
                  name="address_region"
                  value={applicantData.address_region}
                  onChange={handleApplicantChange}
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
        </div>
      </div>

      {/* SECCIÓN 2: Aval o Garante (Opcional) */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 pb-3 border-b-2 border-green-200">
          🛡️ Aval o Garante (Opcional)
        </h3>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center space-x-3 mb-4">
            <input
              type="checkbox"
              id="showGuarantor"
              checked={showGuarantor}
              onChange={(e) => setShowGuarantor(e.target.checked)}
              className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="showGuarantor" className="text-sm font-medium text-gray-700">
              Deseo agregar un aval que respalde mi postulación
            </label>
          </div>

          {showGuarantor && (
            <div className="space-y-4 pt-4 border-t border-green-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={guarantorData.first_name}
                    onChange={handleGuarantorChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required={showGuarantor}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apellido Paterno *
                  </label>
                  <input
                    type="text"
                    name="paternal_last_name"
                    value={guarantorData.paternal_last_name}
                    onChange={handleGuarantorChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required={showGuarantor}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apellido Materno *
                  </label>
                  <input
                    type="text"
                    name="maternal_last_name"
                    value={guarantorData.maternal_last_name}
                    onChange={handleGuarantorChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required={showGuarantor}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    RUT *
                  </label>
                  <input
                    type="text"
                    value={guarantorData.rut}
                    onChange={(e) => handleRUTChange(e, 'guarantor')}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="12.345.678-9"
                    required={showGuarantor}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profesión *
                  </label>
                  <input
                    type="text"
                    name="profession"
                    value={guarantorData.profession}
                    onChange={handleGuarantorChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required={showGuarantor}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ingreso Mensual (CLP) *
                </label>
                <input
                  type="number"
                  name="monthly_income_clp"
                  value={guarantorData.monthly_income_clp}
                  onChange={handleGuarantorChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required={showGuarantor}
                  min="0"
                />
                {guarantorData.monthly_income_clp && (
                  <p className="text-sm text-green-600 mt-1 font-medium">
                    💰 {formatPriceCLP(parseInt(guarantorData.monthly_income_clp))}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección del Aval *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input
                    type="text"
                    name="address_street"
                    value={guarantorData.address_street}
                    onChange={handleGuarantorChange}
                    placeholder="Calle"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required={showGuarantor}
                  />
                  <input
                    type="text"
                    name="address_number"
                    value={guarantorData.address_number}
                    onChange={handleGuarantorChange}
                    placeholder="Número"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required={showGuarantor}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    name="address_department"
                    value={guarantorData.address_department}
                    onChange={handleGuarantorChange}
                    placeholder="Depto (opcional)"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    name="address_commune"
                    value={guarantorData.address_commune}
                    onChange={handleGuarantorChange}
                    placeholder="Comuna"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required={showGuarantor}
                  />
                  <select
                    name="address_region"
                    value={guarantorData.address_region}
                    onChange={handleGuarantorChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required={showGuarantor}
                  >
                    <option value="">Seleccionar región</option>
                    {regions.map(region => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECCIÓN 3: Mensaje al Propietario */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 pb-3 border-b-2 border-purple-200">
          💬 Mensaje al Propietario
        </h3>

        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mensaje Adicional (Opcional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Cuéntanos por qué eres un buen candidato para esta propiedad. Menciona tu situación laboral, estabilidad financiera, referencias, o cualquier otra información relevante que consideres importante..."
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📎 Documentos del Postulante
            </label>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => setApplicantDocuments(Array.from(e.target.files || []))}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-600 mt-1">
              📋 Cédula de identidad, certificado de ingresos, contrato de trabajo, referencias laborales, etc.
            </p>
          </div>

          {showGuarantor && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📎 Documentos del Aval
              </label>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => setGuarantorDocuments(Array.from(e.target.files || []))}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-600 mt-1">
                📋 Cédula de identidad del aval, certificado de ingresos, referencias, etc.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
        {onCancel && (
          <CustomButton
            type="button"
            variant="outline"
            onClick={onCancel}
            size="lg"
          >
            ❌ Cancelar
          </CustomButton>
        )}

        <CustomButton
          type="submit"
          variant="success"
          loading={loading}
          loadingText="🚀 Enviando postulación..."
          size="lg"
        >
          ✅ Enviar Postulación
        </CustomButton>
      </div>
    </form>
  );
};

export default RentalApplicationForm;