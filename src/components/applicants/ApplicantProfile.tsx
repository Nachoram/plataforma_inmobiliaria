import React, { useState, useEffect } from 'react';
import {
  User,
  Edit3,
  MapPin,
  Phone,
  Mail,
  Briefcase,
  DollarSign,
  Building,
  FileText,
  Settings,
  Camera,
  CheckCircle,
  AlertCircle,
  Globe,
  Calendar
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { CustomButton } from '../common';
import toast from 'react-hot-toast';
import { Applicant, ApplicantDocument } from './types';
import ApplicantForm from './ApplicantForm';
import DocumentUpload from './DocumentUpload';
import ApplicantSettings from './ApplicantSettings';

const ApplicantProfile: React.FC = () => {
  const { user } = useAuth();
  const [applicant, setApplicant] = useState<Applicant | null>(null);
  const [documents, setDocuments] = useState<ApplicantDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'documents' | 'settings'>('profile');

  useEffect(() => {
    if (user) {
      fetchApplicantProfile();
      fetchApplicantDocuments();
    }
  }, [user]);

  const fetchApplicantProfile = async () => {
    try {
      setLoading(true);

      // Primero obtener el perfil base
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        toast.error('Error al cargar el perfil');
        return;
      }

      // Intentar obtener datos adicionales de applicant (si existe la tabla)
      // Por ahora, usaremos valores por defecto para los campos de applicant
      const applicantData: Applicant = {
        ...profile,
        broker_type: 'independent', // valor por defecto
        intention: 'rent', // valor por defecto
        has_guarantor: false,
        notifications_enabled: true,
        search_preferences: {}
      };

      setApplicant(applicantData);
    } catch (error) {
      console.error('Error fetching applicant profile:', error);
      toast.error('Error al cargar el perfil del postulante');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicantDocuments = async () => {
    try {
      // Esta consulta fallará si no existe la tabla applicant_documents
      // Por ahora, devolveremos un array vacío
      const documents: ApplicantDocument[] = [];
      setDocuments(documents);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setDocuments([]);
    }
  };

  const handleProfileUpdate = async (updatedData: any) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updatedData)
        .eq('id', user!.id);

      if (error) {
        console.error('Error updating profile:', error);
        toast.error('Error al actualizar el perfil');
        return;
      }

      toast.success('Perfil actualizado exitosamente');
      setEditing(false);
      fetchApplicantProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error al actualizar el perfil');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!applicant) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-400 mr-2" />
            <p className="text-yellow-800">
              No se encontró información del perfil. Complete su perfil para continuar.
            </p>
          </div>
          <CustomButton
            onClick={() => setEditing(true)}
            className="mt-4"
          >
            Completar Perfil
          </CustomButton>
        </div>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <ApplicantForm
          initialData={applicant}
          onSubmit={handleProfileUpdate}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="h-10 w-10 text-gray-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {applicant.first_name} {applicant.paternal_last_name} {applicant.maternal_last_name}
              </h1>
              <p className="text-gray-600 flex items-center mt-1">
                <Briefcase className="h-4 w-4 mr-1" />
                {applicant.profession}
              </p>
              <div className="flex items-center mt-2 space-x-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  applicant.broker_type === 'independent'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  {applicant.broker_type === 'independent' ? 'Broker Independiente' : 'Broker Empresa'}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  applicant.intention === 'rent'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-orange-100 text-orange-800'
                }`}>
                  Busca {applicant.intention === 'rent' ? 'Arriendo' : 'Compra'}
                </span>
              </div>
            </div>
          </div>
          <CustomButton
            onClick={() => setEditing(true)}
            variant="outline"
            size="sm"
            className="flex items-center"
          >
            <Edit3 className="h-4 w-4 mr-2" />
            Editar Perfil
          </CustomButton>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'profile', label: 'Perfil', icon: User },
              { id: 'documents', label: 'Documentos', icon: FileText },
              { id: 'settings', label: 'Configuración', icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información Personal */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Información Personal</h3>
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <User className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-gray-600">RUT:</span>
                    <span className="ml-2 font-medium">{applicant.rut}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Mail className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-gray-600">Email:</span>
                    <span className="ml-2 font-medium">{applicant.email}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Phone className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-gray-600">Teléfono:</span>
                    <span className="ml-2 font-medium">{applicant.phone}</span>
                  </div>
                  {applicant.date_of_birth && (
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 text-gray-400 mr-3" />
                      <span className="text-gray-600">Fecha nacimiento:</span>
                      <span className="ml-2 font-medium">
                        {new Date(applicant.date_of_birth).toLocaleDateString('es-CL')}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center text-sm">
                    <Globe className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-gray-600">Nacionalidad:</span>
                    <span className="ml-2 font-medium">{applicant.nationality || 'No especificada'}</span>
                  </div>
                </div>
              </div>

              {/* Dirección y Trabajo */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Dirección y Trabajo</h3>
                <div className="space-y-3">
                  <div className="flex items-start text-sm">
                    <MapPin className="h-4 w-4 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <span className="text-gray-600">Dirección:</span>
                      <p className="font-medium">
                        {applicant.address_street} {applicant.address_number}
                        {applicant.address_department && `, Depto ${applicant.address_department}`}
                        <br />
                        {applicant.address_commune}, {applicant.address_region}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center text-sm">
                    <Briefcase className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-gray-600">Profesión:</span>
                    <span className="ml-2 font-medium">{applicant.profession}</span>
                  </div>
                  {applicant.monthly_income_clp && (
                    <div className="flex items-center text-sm">
                      <DollarSign className="h-4 w-4 text-gray-400 mr-3" />
                      <span className="text-gray-600">Ingreso mensual:</span>
                      <span className="ml-2 font-medium">
                        ${applicant.monthly_income_clp.toLocaleString('es-CL')} CLP
                      </span>
                    </div>
                  )}
                  {applicant.broker_type === 'firm' && applicant.firm_name && (
                    <div className="flex items-center text-sm">
                      <Building className="h-4 w-4 text-gray-400 mr-3" />
                      <span className="text-gray-600">Empresa:</span>
                      <span className="ml-2 font-medium">{applicant.firm_name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <DocumentUpload
              applicantId={applicant.id}
              documents={documents}
              onDocumentsChange={setDocuments}
            />
          )}

          {activeTab === 'settings' && (
            <ApplicantSettings
              applicant={applicant}
              onUpdate={setApplicant}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicantProfile;
