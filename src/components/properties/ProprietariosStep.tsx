import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, AlertTriangle, Upload, FileText, Trash2, User, Building2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { DocumentUploader } from '../common/forms/DocumentUploader';

// Tipos de domicilio disponibles
const DOMICILIO_TYPES = [
  { value: 'casa', label: 'Casa' },
  { value: 'departamento', label: 'Departamento' },
  { value: 'oficina', label: 'Oficina' },
  { value: 'otro', label: 'Otro' }
];

// Regiones de Chile
const CHILE_REGIONS = [
  { value: 'region-metropolitana', label: 'Región Metropolitana de Santiago' },
  { value: 'valparaiso', label: 'Región de Valparaíso' },
  { value: 'biobio', label: 'Región del Biobío' },
  // Agregar más regiones según necesites
];

// Interface para la dirección
interface AddressData {
  type: 'casa' | 'departamento' | 'oficina' | 'otro';
  street: string;
  number: string;
  unit: string | null;
  city: string;
  region: string;
  postal_code: string | null;
}

// Interface para persona natural
interface NaturalPersonData {
  name: string;
  rut: string;
  email: string;
  phone: string;
  ownership_percentage: number;
  documents: {
    cedula_identidad_url: string | null;
  };
}

// Interface para persona jurídica
interface JuridicalPersonData {
  company_name: string;
  company_rut: string;
  email: string;
  phone: string;
  legal_representative: {
    name: string;
    rut: string;
    email: string;
    phone: string;
  };
  documents: {
    statute_url: string | null;
    power_of_attorney_url: string | null;
    cedula_representante_url: string | null;
  };
  ownership_percentage: number;
}

// Interface para un propietario completo
interface OwnerData {
  id: string;
  type: 'natural' | 'juridica';
  address: AddressData;
  natural?: NaturalPersonData;
  juridica?: JuridicalPersonData;
}

// Props del componente
interface ProprietariosStepProps {
  owners: OwnerData[];
  onChange: (owners: OwnerData[]) => void;
  onValidationChange?: (isValid: boolean) => void;
}

const ProprietariosStep: React.FC<ProprietariosStepProps> = ({
  owners,
  onChange,
  onValidationChange
}) => {
  // Estado local para errores (vacío ya que la validación se maneja en el componente padre)
  const errors: Record<string, string> = {};

  // Calcular suma total de porcentajes
  const totalPercentage = owners.reduce((sum, owner) => {
    return sum + (owner.natural?.ownership_percentage || owner.juridica?.ownership_percentage || 0);
  }, 0);

  // Validar si la suma es exactamente 100%
  const isPercentageValid = totalPercentage === 100;
  const hasOwners = owners.length > 0;
  const isStepValid = isPercentageValid && hasOwners;

  // Ref para trackear el estado de validación anterior
  const prevValidationRef = useRef<boolean>();

  // Notificar cambios de validación solo cuando cambie
  useEffect(() => {
    if (onValidationChange && prevValidationRef.current !== isStepValid) {
      prevValidationRef.current = isStepValid;
      onValidationChange(isStepValid);
    }
  }, [isStepValid, onValidationChange]);

  // Agregar nuevo propietario
  const handleAddOwner = () => {
    if (owners.length >= 10) {
      toast.error('Máximo 10 propietarios permitidos');
      return;
    }

    const newOwner: OwnerData = {
      id: `owner_${Date.now()}`,
      type: 'natural',
      address: {
        type: 'casa',
        street: '',
        number: '',
        unit: null,
        city: '',
        region: '',
        postal_code: null
      },
      natural: {
        name: '',
        rut: '',
        email: '',
        phone: '',
        ownership_percentage: 0,
        documents: {
          cedula_identidad_url: null
        }
      }
    };

    onChange([...owners, newOwner]);
  };

  // Eliminar propietario
  const handleRemoveOwner = (ownerId: string) => {
    const updatedOwners = owners.filter(owner => owner.id !== ownerId);
    onChange(updatedOwners);
  };

  // Actualizar propietario
  const handleUpdateOwner = (ownerId: string, updates: Partial<OwnerData>) => {
    const updatedOwners = owners.map(owner =>
      owner.id === ownerId ? { ...owner, ...updates } : owner
    );
    onChange(updatedOwners);
  };

  // Cambiar tipo de propietario
  const handleTypeChange = (ownerId: string, newType: 'natural' | 'juridica') => {
    const owner = owners.find(o => o.id === ownerId);
    if (!owner) return;

    const updatedOwner: OwnerData = {
      ...owner,
      type: newType,
      // Limpiar datos del tipo anterior y crear datos del nuevo tipo
      natural: newType === 'natural' ? {
        name: '',
        rut: '',
        email: '',
        phone: '',
        ownership_percentage: owner.natural?.ownership_percentage || owner.juridica?.ownership_percentage || 0,
        documents: {
          cedula_identidad_url: null
        }
      } : undefined,
      juridica: newType === 'juridica' ? {
        company_name: '',
        company_rut: '',
        email: '',
        phone: '',
        legal_representative: {
          name: '',
          rut: '',
          email: '',
          phone: ''
        },
        documents: {
          statute_url: null,
          power_of_attorney_url: null,
          cedula_representante_url: null
        },
        ownership_percentage: owner.natural?.ownership_percentage || owner.juridica?.ownership_percentage || 0
      } : undefined
    };

    handleUpdateOwner(ownerId, updatedOwner);
  };

  // Manejar subida de documentos
  const handleDocumentUpload = async (ownerId: string, documentType: 'statute' | 'power_of_attorney' | 'cedula_identidad' | 'cedula_representante', file: File) => {
    // Aquí iría la lógica para subir a Supabase Storage
    // Por ahora solo simulamos la URL
    const mockUrl = `https://supabase-storage-url/${file.name}`;

    const owner = owners.find(o => o.id === ownerId);
    if (!owner) return;

    let updatedOwner = { ...owner };

    if (owner.type === 'juridica' && owner.juridica) {
      let documentField = '';
      let successMessage = '';

      switch (documentType) {
        case 'statute':
          documentField = 'statute_url';
          successMessage = 'Escritura de Constitución subida correctamente';
          break;
        case 'power_of_attorney':
          documentField = 'power_of_attorney_url';
          successMessage = 'Poder Notarial subido correctamente';
          break;
        case 'cedula_representante':
          documentField = 'cedula_representante_url';
          successMessage = 'Cédula del Representante subida correctamente';
          break;
        default:
          return;
      }

      updatedOwner = {
        ...owner,
        juridica: {
          ...owner.juridica,
          documents: {
            ...owner.juridica.documents,
            [documentField]: mockUrl
          }
        }
      };
      toast.success(successMessage);
    } else if (owner.type === 'natural' && owner.natural) {
      updatedOwner = {
        ...owner,
        natural: {
          ...owner.natural,
          documents: {
            ...owner.natural.documents,
            cedula_identidad_url: mockUrl
          }
        }
      };
      toast.success('Cédula de Identidad subida correctamente');
    }

    handleUpdateOwner(ownerId, updatedOwner);
  };

  // Manejar eliminación de documentos
  const handleDocumentRemove = (ownerId: string, documentType: 'statute' | 'power_of_attorney' | 'cedula_identidad' | 'cedula_representante') => {
    const owner = owners.find(o => o.id === ownerId);
    if (!owner) return;

    let updatedOwner = { ...owner };

    if (owner.type === 'juridica' && owner.juridica) {
      let documentField = '';
      let successMessage = '';

      switch (documentType) {
        case 'statute':
          documentField = 'statute_url';
          successMessage = 'Escritura de Constitución eliminada';
          break;
        case 'power_of_attorney':
          documentField = 'power_of_attorney_url';
          successMessage = 'Poder Notarial eliminado';
          break;
        case 'cedula_representante':
          documentField = 'cedula_representante_url';
          successMessage = 'Cédula del Representante eliminada';
          break;
        default:
          return;
      }

      updatedOwner = {
        ...owner,
        juridica: {
          ...owner.juridica,
          documents: {
            ...owner.juridica.documents,
            [documentField]: null
          }
        }
      };
      toast.success(successMessage);
    } else if (owner.type === 'natural' && owner.natural) {
      updatedOwner = {
        ...owner,
        natural: {
          ...owner.natural,
          documents: {
            ...owner.natural.documents,
            cedula_identidad_url: null
          }
        }
      };
      toast.success('Cédula de Identidad eliminada');
    }

    handleUpdateOwner(ownerId, updatedOwner);
  };

  return (
    <div className="space-y-6">
      {/* Header del paso */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Propietarios
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Información de los propietarios de la propiedad
          </p>
        </div>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Requerido
        </span>
      </div>

      {/* Contador y validación de porcentajes */}
      <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">
            📍 {owners.length} de 10 propietarios
          </span>
          <button
            type="button"
            onClick={handleAddOwner}
            disabled={owners.length >= 10}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4 mr-1" />
            Agregar Propietario
          </button>
        </div>
      </div>

      {/* Advertencia de suma de porcentajes */}
      <div className={`p-4 rounded-lg border ${isPercentageValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex items-center">
          <AlertTriangle className={`h-5 w-5 mr-2 ${isPercentageValid ? 'text-green-600' : 'text-red-600'}`} />
          <div>
            <p className={`text-sm font-medium ${isPercentageValid ? 'text-green-800' : 'text-red-800'}`}>
              Suma de porcentajes: {totalPercentage}%
            </p>
            {!isPercentageValid && (
              <p className="text-sm text-red-700 mt-1">
                La suma debe ser exactamente 100%
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Lista de propietarios */}
      <div className="space-y-6">
        {owners.map((owner, index) => (
          <OwnerCard
            key={owner.id}
            owner={owner}
            index={index}
            onUpdate={(updates) => handleUpdateOwner(owner.id, updates)}
            onTypeChange={(type) => handleTypeChange(owner.id, type)}
            onRemove={() => handleRemoveOwner(owner.id)}
            onDocumentUpload={(docType, file) => handleDocumentUpload(owner.id, docType, file)}
            onDocumentRemove={(docType) => handleDocumentRemove(owner.id, docType)}
            errors={errors}
          />
        ))}
      </div>

      {/* Mensaje si no hay propietarios */}
      {owners.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Plus className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay propietarios agregados
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Agrega al menos un propietario para continuar
          </p>
          <button
            type="button"
            onClick={handleAddOwner}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Primer Propietario
          </button>
        </div>
      )}
    </div>
  );
};

// Componente para cada tarjeta de propietario
interface OwnerCardProps {
  owner: OwnerData;
  index: number;
  onUpdate: (updates: Partial<OwnerData>) => void;
  onTypeChange: (type: 'natural' | 'juridica') => void;
  onRemove: () => void;
  onDocumentUpload: (documentType: 'statute' | 'power_of_attorney' | 'cedula_identidad' | 'cedula_representante', file: File) => void;
  onDocumentRemove: (documentType: 'statute' | 'power_of_attorney' | 'cedula_identidad' | 'cedula_representante') => void;
  errors: Record<string, string>;
}

const OwnerCard: React.FC<OwnerCardProps> = ({
  owner,
  index,
  onUpdate,
  onTypeChange,
  onRemove,
  onDocumentUpload,
  onDocumentRemove,
  errors
}) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const handleConfirmDelete = () => {
    onRemove();
    setShowConfirmDelete(false);
  };

  return (
    <div className="border border-gray-200 rounded-lg bg-white">
      {/* Header de la tarjeta */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h4 className="text-lg font-medium text-gray-900">
          Propietario {index + 1}
        </h4>
        <button
          type="button"
          onClick={() => setShowConfirmDelete(true)}
          className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md"
          title="Eliminar propietario"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Tipo de propietario */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Tipo de Propietario *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="relative">
              <input
                type="radio"
                name={`owner_type_${owner.id}`}
                value="natural"
                checked={owner.type === 'natural'}
                onChange={() => onTypeChange('natural')}
                className="sr-only"
              />
              <div className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                owner.type === 'natural'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300'
              }`}>
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-purple-600" />
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
                checked={owner.type === 'juridica'}
                onChange={() => onTypeChange('juridica')}
                className="sr-only"
              />
              <div className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                owner.type === 'juridica'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300'
              }`}>
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-purple-600" />
                  <div>
                    <div className="font-medium text-gray-900">Persona Jurídica</div>
                    <div className="text-sm text-gray-600">Empresa</div>
                  </div>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Formulario según tipo */}
        {owner.type === 'natural' && owner.natural && (
          <NaturalPersonForm
            data={owner.natural}
            onChange={(updates) => onUpdate({ natural: { ...owner.natural!, ...updates } })}
            onDocumentUpload={(docType, file) => onDocumentUpload(docType, file)}
            onDocumentRemove={(docType) => onDocumentRemove(docType)}
            errors={errors}
            prefix={`owner_${index}_natural`}
          />
        )}

        {owner.type === 'juridica' && owner.juridica && (
          <JuridicalPersonForm
            data={owner.juridica}
            onChange={(updates) => onUpdate({ juridica: { ...owner.juridica!, ...updates } })}
            onDocumentUpload={onDocumentUpload}
            onDocumentRemove={onDocumentRemove}
            errors={errors}
            prefix={`owner_${index}_juridica`}
          />
        )}

        {/* Domicilio (común para ambos tipos) */}
        <AddressForm
          data={owner.address}
          onChange={(updates) => onUpdate({ address: { ...owner.address, ...updates } })}
          errors={errors}
          prefix={`owner_${index}_address`}
        />
      </div>

      {/* Modal de confirmación para eliminar */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              ¿Eliminar propietario?
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Esta acción no se puede deshacer. Se recalculará la suma de porcentajes.
            </p>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Formulario para persona natural
interface NaturalPersonFormProps {
  data: NaturalPersonData;
  onChange: (updates: Partial<NaturalPersonData>) => void;
  onDocumentUpload: (documentType: 'cedula_identidad', file: File) => void;
  onDocumentRemove: (documentType: 'cedula_identidad') => void;
  errors: Record<string, string>;
  prefix: string;
}

const NaturalPersonForm: React.FC<NaturalPersonFormProps> = ({
  data,
  onChange,
  onDocumentUpload,
  onDocumentRemove,
  errors,
  prefix
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h5 className="text-md font-medium text-gray-900 mb-4">DATOS PERSONALES</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre Completo *
            </label>
            <input
              type="text"
              value={data.name}
              onChange={(e) => onChange({ name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Juan Pérez González"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              RUT *
            </label>
            <input
              type="text"
              value={data.rut}
              onChange={(e) => onChange({ rut: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="12.345.678-9"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={data.email}
              onChange={(e) => onChange({ email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="juan@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono *
            </label>
            <input
              type="tel"
              value={data.phone}
              onChange={(e) => onChange({ phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+56912345678"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              % de Propiedad *
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                value={data.ownership_percentage}
                onChange={(e) => onChange({ ownership_percentage: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="50"
              />
              <span className="absolute right-3 top-2 text-sm text-gray-500">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Documentos requeridos */}
      <div>
        <h5 className="text-md font-medium text-gray-900 mb-4">DOCUMENTOS (OPCIONAL)</h5>
        <div className="space-y-4">
          <DocumentUploader
            label="🆔 Cédula de Identidad del Propietario"
            name={`cedula_${data.name || 'propietario'}`}
            uploaded={!!data.documents.cedula_identidad_url}
            fileName={data.documents.cedula_identidad_url ? "Cédula de Identidad.pdf" : undefined}
            onUpload={(file) => onDocumentUpload('cedula_identidad', file)}
            onRemove={() => onDocumentRemove('cedula_identidad')}
          />
        </div>
      </div>
    </div>
  );
};

// Formulario para persona jurídica
interface JuridicalPersonFormProps {
  data: JuridicalPersonData;
  onChange: (updates: Partial<JuridicalPersonData>) => void;
  onDocumentUpload: (documentType: 'statute' | 'power_of_attorney' | 'cedula_representante', file: File) => void;
  onDocumentRemove: (documentType: 'statute' | 'power_of_attorney' | 'cedula_representante') => void;
  errors: Record<string, string>;
  prefix: string;
}

const JuridicalPersonForm: React.FC<JuridicalPersonFormProps> = ({
  data,
  onChange,
  onDocumentUpload,
  onDocumentRemove,
  errors,
  prefix
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h5 className="text-md font-medium text-gray-900 mb-4">DATOS DE LA EMPRESA</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de Empresa *
            </label>
            <input
              type="text"
              value={data.company_name}
              onChange={(e) => onChange({ company_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="ABC Inmobiliaria SpA"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              RUT Empresa *
            </label>
            <input
              type="text"
              value={data.company_rut}
              onChange={(e) => onChange({ company_rut: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="78.901.234-5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Empresa *
            </label>
            <input
              type="email"
              value={data.email}
              onChange={(e) => onChange({ email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="empresa@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono Empresa *
            </label>
            <input
              type="tel"
              value={data.phone}
              onChange={(e) => onChange({ phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+56912345678"
            />
          </div>
        </div>
      </div>

      <div>
        <h5 className="text-md font-medium text-gray-900 mb-4">REPRESENTANTE LEGAL</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              value={data.legal_representative.name}
              onChange={(e) => onChange({
                legal_representative: { ...data.legal_representative, name: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Carlos López Martínez"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              RUT *
            </label>
            <input
              type="text"
              value={data.legal_representative.rut}
              onChange={(e) => onChange({
                legal_representative: { ...data.legal_representative, rut: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="15.234.567-8"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={data.legal_representative.email}
              onChange={(e) => onChange({
                legal_representative: { ...data.legal_representative, email: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="carlos@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono *
            </label>
            <input
              type="tel"
              value={data.legal_representative.phone}
              onChange={(e) => onChange({
                legal_representative: { ...data.legal_representative, phone: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+56987654321"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              % de Propiedad *
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                value={data.ownership_percentage}
                onChange={(e) => onChange({ ownership_percentage: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="50"
              />
              <span className="absolute right-3 top-2 text-sm text-gray-500">%</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h5 className="text-md font-medium text-gray-900 mb-4">DOCUMENTOS REQUERIDOS</h5>
        <div className="space-y-4">
          <DocumentUploader
            label="📄 Escritura de Constitución de la Sociedad"
            name={`constitucion_${data.company_name || 'empresa'}`}
            uploaded={!!data.documents.statute_url}
            fileName={data.documents.statute_url ? "Escritura de Constitución.pdf" : undefined}
            onUpload={(file) => onDocumentUpload('statute', file)}
            onRemove={() => onDocumentRemove('statute')}
          />
          <DocumentUploader
            label="📄 Poder del Representante Legal"
            name={`poder_${data.company_name || 'empresa'}`}
            uploaded={!!data.documents.power_of_attorney_url}
            fileName={data.documents.power_of_attorney_url ? "Poder Notarial.pdf" : undefined}
            onUpload={(file) => onDocumentUpload('power_of_attorney', file)}
            onRemove={() => onDocumentRemove('power_of_attorney')}
          />
          <DocumentUploader
            label="🆔 Cédula de Identidad del Representante Legal"
            name={`cedula_representante_${data.company_name || 'empresa'}`}
            uploaded={!!data.documents.cedula_representante_url}
            fileName={data.documents.cedula_representante_url ? "Cédula Representante.pdf" : undefined}
            onUpload={(file) => onDocumentUpload('cedula_representante', file)}
            onRemove={() => onDocumentRemove('cedula_representante')}
          />
        </div>
      </div>
    </div>
  );
};

// Formulario de domicilio
interface AddressFormProps {
  data: AddressData;
  onChange: (updates: Partial<AddressData>) => void;
  errors: Record<string, string>;
  prefix: string;
}

const AddressForm: React.FC<AddressFormProps> = ({
  data,
  onChange,
  errors,
  prefix
}) => {
  const showUnitField = data.type === 'departamento' || data.type === 'oficina';

  return (
    <div>
      <h5 className="text-md font-medium text-gray-900 mb-4">DOMICILIO *</h5>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Domicilio *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {DOMICILIO_TYPES.map((type) => (
              <label key={type.value} className="flex items-center">
                <input
                  type="radio"
                  name={`${prefix}_type`}
                  value={type.value}
                  checked={data.type === type.value}
                  onChange={(e) => onChange({
                    type: e.target.value as AddressData['type'],
                    unit: e.target.value === 'casa' ? null : data.unit
                  })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">{type.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Calle *
            </label>
            <input
              type="text"
              value={data.street}
              onChange={(e) => onChange({ street: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Avenida Principal"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número *
            </label>
            <input
              type="text"
              value={data.number}
              onChange={(e) => onChange({ number: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="1234"
            />
          </div>

          {showUnitField && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Depto/Oficina {data.type === 'departamento' ? '*' : '(Opcional)'}
              </label>
              <input
                type="text"
                value={data.unit || ''}
                onChange={(e) => onChange({ unit: e.target.value || null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={`Ej: ${data.type === 'departamento' ? '501' : '200'}`}
                required={data.type === 'departamento'}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ciudad *
            </label>
            <input
              type="text"
              value={data.city}
              onChange={(e) => onChange({ city: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Santiago"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Región *
            </label>
            <select
              value={data.region}
              onChange={(e) => onChange({ region: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Seleccionar región</option>
              {CHILE_REGIONS.map((region) => (
                <option key={region.value} value={region.value}>
                  {region.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código Postal (Opcional)
            </label>
            <input
              type="text"
              value={data.postal_code || ''}
              onChange={(e) => onChange({ postal_code: e.target.value || null })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="8320000"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProprietariosStep;
export type { OwnerData, AddressData, NaturalPersonData, JuridicalPersonData };
