import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Edit3,
  Download,
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  User,
  Building,
  DollarSign,
  Shield,
  AlertCircle,
  Save,
  X,
  Archive,
  Eye,
  FileSignature
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { CustomButton } from '../common';
import toast from 'react-hot-toast';
import EditorButton from './EditorButton';

interface ContractDetail {
  id: string;
  status: 'borrador' | 'en_revision' | 'aprobado' | 'firmado' | 'activo' | 'completado' | 'cancelado';
  created_at: string;
  updated_at: string;
  approved_at?: string;
  signed_at?: string;
  start_date?: string;
  end_date?: string;
  monthly_rent_clp?: number;
  deposit_amount_clp?: number;
  contract_terms?: string;
  special_conditions?: string;
  applications: {
    id: string;
    property_id: string;
    snapshot_applicant_first_name: string;
    snapshot_applicant_paternal_last_name: string;
    snapshot_applicant_email: string;
    snapshot_applicant_phone?: string;
    properties: {
      id: string;
      address_street: string;
      address_number: string;
      address_commune: string;
      address_region: string;
      owner_id: string;
      profiles: {
        first_name: string;
        paternal_last_name: string;
        email: string;
        phone?: string;
      };
    };
  };
}

interface ContractHistory {
  id: string;
  contract_id: string;
  action: string;
  old_status?: string;
  new_status?: string;
  changes?: Record<string, any>;
  created_by: string;
  created_at: string;
  profiles?: {
    first_name: string;
    paternal_last_name: string;
  };
}

const AdminContractDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [contract, setContract] = useState<ContractDetail | null>(null);
  const [history, setHistory] = useState<ContractHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editedData, setEditedData] = useState<Partial<ContractDetail>>({});

  useEffect(() => {
    checkAdminAccess();
  }, [user]);

  useEffect(() => {
    if (isAdmin && id) {
      loadContract();
      loadHistory();
    }
  }, [isAdmin, id]);

  const checkAdminAccess = async () => {
    if (!user) {
      setIsAdmin(false);
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error checking admin access:', error);
        setIsAdmin(false);
        return;
      }

      setIsAdmin(profile?.role === 'admin' || profile?.role === 'owner');
    } catch (error) {
      console.error('Error checking admin access:', error);
      setIsAdmin(false);
    }
  };

  const loadContract = async () => {
    if (!id) return;

    try {
      setLoading(true);

      const { data: contractData, error } = await supabase
        .from('rental_contracts')
        .select(`
          *,
          applications (
            id,
            property_id,
            snapshot_applicant_first_name,
            snapshot_applicant_paternal_last_name,
            snapshot_applicant_email,
            snapshot_applicant_phone,
            properties (
              id,
              address_street,
              address_number,
              address_commune,
              address_region,
              owner_id,
              profiles!properties_owner_id_fkey (
                first_name,
                paternal_last_name,
                email,
                phone
              )
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error loading contract:', error);
        toast.error('Error al cargar el contrato');
        return;
      }

      setContract(contractData);
      setEditedData(contractData);
    } catch (error) {
      console.error('Error loading contract:', error);
      toast.error('Error al cargar el contrato');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    if (!id) return;

    try {
      const { data: historyData, error } = await supabase
        .from('contract_history')
        .select(`
          *,
          profiles (
            first_name,
            paternal_last_name
          )
        `)
        .eq('contract_id', id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading history:', error);
        // History table might not exist, that's ok
        setHistory([]);
        return;
      }

      setHistory(historyData || []);
    } catch (error) {
      console.error('Error loading history:', error);
      setHistory([]);
    }
  };

  const handleSaveChanges = async () => {
    if (!contract) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('rental_contracts')
        .update({
          ...editedData,
          updated_at: new Date().toISOString()
        })
        .eq('id', contract.id);

      if (error) {
        console.error('Error updating contract:', error);
        toast.error('Error al guardar cambios');
        return;
      }

      // Log the change in history
      await logHistoryAction('updated', 'Contrato actualizado por administrador', editedData);

      toast.success('Contrato actualizado exitosamente');
      setEditing(false);
      loadContract();
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error('Error al guardar cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: ContractDetail['status']) => {
    if (!contract) return;

    try {
      const oldStatus = contract.status;
      const { error } = await supabase
        .from('rental_contracts')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
          ...(newStatus === 'aprobado' && { approved_at: new Date().toISOString() }),
          ...(newStatus === 'firmado' && { signed_at: new Date().toISOString() })
        })
        .eq('id', contract.id);

      if (error) {
        console.error('Error updating status:', error);
        toast.error('Error al cambiar estado');
        return;
      }

      await logHistoryAction('status_changed', `Estado cambiado de ${oldStatus} a ${newStatus}`, {}, oldStatus, newStatus);
      toast.success(`Contrato ${newStatus === 'cancelado' ? 'cancelado' : newStatus === 'completado' ? 'completado' : 'actualizado'}`);
      loadContract();
    } catch (error) {
      console.error('Error changing status:', error);
      toast.error('Error al cambiar estado');
    }
  };

  const logHistoryAction = async (
    action: string,
    description: string,
    changes?: Record<string, any>,
    oldStatus?: string,
    newStatus?: string
  ) => {
    if (!user || !contract) return;

    try {
      await supabase
        .from('contract_history')
        .insert({
          contract_id: contract.id,
          action,
          description,
          old_status: oldStatus,
          new_status: newStatus,
          changes,
          created_by: user.id
        });
    } catch (error) {
      // History logging is not critical, don't show error to user
      console.error('Error logging history:', error);
    }
  };

  const handleGeneratePDF = () => {
    // This would integrate with PDF generation service
    toast.success('Generando PDF... (funcionalidad en desarrollo)');
  };

  const handleSignContract = () => {
    // This would integrate with digital signature service
    toast.success('Iniciando proceso de firma digital... (funcionalidad en desarrollo)');
  };

  const getStatusColor = (status: ContractDetail['status']) => {
    switch (status) {
      case 'borrador': return 'bg-gray-100 text-gray-800';
      case 'en_revision': return 'bg-yellow-100 text-yellow-800';
      case 'aprobado': return 'bg-blue-100 text-blue-800';
      case 'firmado': return 'bg-purple-100 text-purple-800';
      case 'activo': return 'bg-green-100 text-green-800';
      case 'completado': return 'bg-emerald-100 text-emerald-800';
      case 'cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: ContractDetail['status']) => {
    switch (status) {
      case 'borrador': return 'Borrador';
      case 'en_revision': return 'En Revisión';
      case 'aprobado': return 'Aprobado';
      case 'firmado': return 'Firmado';
      case 'activo': return 'Activo';
      case 'completado': return 'Completado';
      case 'cancelado': return 'Cancelado';
      default: return status;
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            Acceso Denegado
          </h2>
          <p className="text-red-600">
            No tienes permisos para acceder a los detalles del contrato.
            Esta sección es exclusiva para administradores.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">
            Contrato no encontrado
          </h2>
          <p className="text-yellow-600 mb-4">
            El contrato solicitado no existe o ha sido eliminado.
          </p>
          <CustomButton onClick={() => navigate('/dashboard/admin/contracts')}>
            Volver a contratos
          </CustomButton>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard/admin/contracts')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Volver a contratos
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <FileText className="h-6 w-6 mr-2 text-blue-600" />
                Contrato #{contract.id.slice(-8)}
              </h1>
              <p className="text-gray-600">
                Creado el {new Date(contract.created_at).toLocaleDateString('es-CL')}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(contract.status)}`}>
              {getStatusLabel(contract.status)}
            </span>

            {!editing && (
              <div className="flex items-center space-x-2">
                <EditorButton
                  contractId={contract.id}
                  applicationId={contract.applications.id}
                />
                <CustomButton
                  onClick={() => setEditing(true)}
                  variant="outline"
                  size="sm"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Editar
                </CustomButton>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contract Details */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Detalles del Contrato</h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Inicio
                  </label>
                  {editing ? (
                    <input
                      type="date"
                      value={editedData.start_date || ''}
                      onChange={(e) => setEditedData(prev => ({ ...prev, start_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {contract.start_date ? new Date(contract.start_date).toLocaleDateString('es-CL') : 'No definida'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Término
                  </label>
                  {editing ? (
                    <input
                      type="date"
                      value={editedData.end_date || ''}
                      onChange={(e) => setEditedData(prev => ({ ...prev, end_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {contract.end_date ? new Date(contract.end_date).toLocaleDateString('es-CL') : 'No definida'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Renta Mensual (CLP)
                  </label>
                  {editing ? (
                    <input
                      type="number"
                      value={editedData.monthly_rent_clp || ''}
                      onChange={(e) => setEditedData(prev => ({ ...prev, monthly_rent_clp: parseInt(e.target.value) || undefined }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {contract.monthly_rent_clp ? `$${contract.monthly_rent_clp.toLocaleString('es-CL')}` : 'No definido'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto Garantía (CLP)
                  </label>
                  {editing ? (
                    <input
                      type="number"
                      value={editedData.deposit_amount_clp || ''}
                      onChange={(e) => setEditedData(prev => ({ ...prev, deposit_amount_clp: parseInt(e.target.value) || undefined }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {contract.deposit_amount_clp ? `$${contract.deposit_amount_clp.toLocaleString('es-CL')}` : 'No definido'}
                    </p>
                  )}
                </div>
              </div>

              {/* Contract Terms */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Términos del Contrato
                </label>
                {editing ? (
                  <textarea
                    value={editedData.contract_terms || ''}
                    onChange={(e) => setEditedData(prev => ({ ...prev, contract_terms: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Términos y condiciones del contrato..."
                  />
                ) : (
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {contract.contract_terms || 'No definidos'}
                  </p>
                )}
              </div>

              {/* Special Conditions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condiciones Especiales
                </label>
                {editing ? (
                  <textarea
                    value={editedData.special_conditions || ''}
                    onChange={(e) => setEditedData(prev => ({ ...prev, special_conditions: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Condiciones especiales del contrato..."
                  />
                ) : (
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {contract.special_conditions || 'Ninguna'}
                  </p>
                )}
              </div>

              {/* Edit Actions */}
              {editing && (
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <CustomButton
                    onClick={() => {
                      setEditing(false);
                      setEditedData(contract);
                    }}
                    variant="outline"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </CustomButton>
                  <CustomButton
                    onClick={handleSaveChanges}
                    loading={saving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Cambios
                  </CustomButton>
                </div>
              )}
            </div>
          </div>

          {/* Contract Actions */}
          {!editing && (
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Acciones del Contrato</h2>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <CustomButton
                    onClick={handleGeneratePDF}
                    className="flex items-center justify-center"
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Generar PDF
                  </CustomButton>

                  {contract.status === 'aprobado' && (
                    <CustomButton
                      onClick={handleSignContract}
                      className="flex items-center justify-center"
                    >
                      <FileSignature className="h-4 w-4 mr-2" />
                      Firmar Digitalmente
                    </CustomButton>
                  )}

                  {contract.status === 'activo' && (
                    <CustomButton
                      onClick={() => handleStatusChange('completado')}
                      className="flex items-center justify-center"
                      variant="outline"
                    >
                      <Archive className="h-4 w-4 mr-2" />
                      Archivar Contrato
                    </CustomButton>
                  )}

                  {contract.status !== 'cancelado' && contract.status !== 'completado' && (
                    <CustomButton
                      onClick={() => handleStatusChange('cancelado')}
                      className="flex items-center justify-center"
                      variant="outline"
                      style={{ backgroundColor: '#fee2e2', borderColor: '#fca5a5', color: '#dc2626' }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar Contrato
                    </CustomButton>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Parties Involved */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Partes Involucradas</h3>
            </div>

            <div className="p-6 space-y-4">
              {/* Tenant */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  Arrendatario
                </h4>
                <div className="bg-gray-50 rounded p-3">
                  <p className="font-medium text-gray-900">
                    {contract.applications.snapshot_applicant_first_name} {contract.applications.snapshot_applicant_paternal_last_name}
                  </p>
                  <p className="text-sm text-gray-600">{contract.applications.snapshot_applicant_email}</p>
                  {contract.applications.snapshot_applicant_phone && (
                    <p className="text-sm text-gray-600">{contract.applications.snapshot_applicant_phone}</p>
                  )}
                </div>
              </div>

              {/* Property Owner */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Building className="h-4 w-4 mr-1" />
                  Propietario
                </h4>
                <div className="bg-gray-50 rounded p-3">
                  <p className="font-medium text-gray-900">
                    {contract.applications.properties.profiles.first_name} {contract.applications.properties.profiles.paternal_last_name}
                  </p>
                  <p className="text-sm text-gray-600">{contract.applications.properties.profiles.email}</p>
                  {contract.applications.properties.profiles.phone && (
                    <p className="text-sm text-gray-600">{contract.applications.properties.profiles.phone}</p>
                  )}
                </div>
              </div>

              {/* Property */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Building className="h-4 w-4 mr-1" />
                  Propiedad
                </h4>
                <div className="bg-gray-50 rounded p-3">
                  <p className="font-medium text-gray-900">
                    {contract.applications.properties.address_street} {contract.applications.properties.address_number}
                  </p>
                  <p className="text-sm text-gray-600">
                    {contract.applications.properties.address_commune}, {contract.applications.properties.address_region}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contract History */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Historial del Contrato</h3>
            </div>

            <div className="p-6">
              {history.length === 0 ? (
                <p className="text-gray-500 text-sm">No hay historial disponible</p>
              ) : (
                <div className="space-y-3">
                  {history.slice(0, 5).map((entry) => (
                    <div key={entry.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{entry.action}</p>
                        <p className="text-xs text-gray-500">
                          {entry.profiles ? `${entry.profiles.first_name} ${entry.profiles.paternal_last_name}` : 'Sistema'} •
                          {new Date(entry.created_at).toLocaleDateString('es-CL')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminContractDetail;





