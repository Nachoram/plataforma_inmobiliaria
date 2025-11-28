import React, { memo } from 'react';
import { User, Building2, X, AlertCircle } from 'lucide-react';
import { PropertyOwnersProps, Owner } from '../../types';

/**
 * Componente PropertyOwners - Gestión completa de propietarios múltiples
 *
 * Responsabilidades:
 * - Gestión de múltiples propietarios (máx 5)
 * - Tipos de propietario: Natural y Jurídica
 * - Campos condicionales según tipo y constitución
 * - Validación de datos
 * - Manejo de documentos por propietario
 */
export const PropertyOwners: React.FC<PropertyOwnersProps> = memo(({
  owners,
  onAddOwner,
  onRemoveOwner,
  onUpdateOwner,
  onDocumentUpload,
  onDocumentRemove,
  maxOwners = 5,
  errors
}) => {
  return (
    <div className="space-y-3">
      {/* Header con contador y botón agregar */}
      <div className="border-b pb-2 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Datos del Propietario</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Propietarios: {owners.length}/{maxOwners}</span>
          {owners.length < maxOwners && (
            <button
              type="button"
              onClick={onAddOwner}
              className="px-3 py-1 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600 transition-colors"
            >
              + Agregar Propietario
            </button>
          )}
        </div>
      </div>

      {/* Lista de propietarios */}
      {owners.map((owner, index) => (
        <OwnerCard
          key={owner.id}
          owner={owner}
          index={index}
          totalOwners={owners.length}
          onRemove={onRemoveOwner}
          onUpdate={onUpdateOwner}
          onDocumentUpload={onDocumentUpload}
          onDocumentRemove={onDocumentRemove}
          errors={errors}
          canRemove={owners.length > 1}
        />
      ))}

      {/* Mostrar errores generales si existen */}
      {errors && Object.keys(errors).some(key => key.startsWith('general_')) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-red-800 mb-2">Errores generales:</h4>
          <ul className="text-sm text-red-700 space-y-1">
            {Object.entries(errors)
              .filter(([key]) => key.startsWith('general_'))
              .map(([key, error]) => (
                <li key={key}>• {error}</li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
});

PropertyOwners.displayName = 'PropertyOwners';

/**
 * Componente OwnerCard - Formulario individual para cada propietario
 */
interface OwnerCardProps {
  owner: Owner;
  index: number;
  totalOwners: number;
  onRemove: (ownerId: string) => void;
  onUpdate: (ownerId: string, field: keyof Owner, value: any) => void;
  onDocumentUpload: (ownerId: string, documentType: string, file: File) => void;
  onDocumentRemove: (ownerId: string, documentType: string) => void;
  errors: Record<string, string>;
  canRemove: boolean;
}

const OwnerCard: React.FC<OwnerCardProps> = ({
  owner,
  index,
  onRemove,
  onUpdate,
  onDocumentUpload,
  onDocumentRemove,
  errors,
  canRemove
}) => {
  const ownerErrorPrefix = `owner_${owner.id}_`;

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
      {/* Header del propietario */}
      <div className="flex justify-between items-center border-b pb-2">
        <h3 className="text-lg font-semibold text-gray-800">
          Propietario {index + 1}
        </h3>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(owner.id)}
            className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Selector de Tipo de Propietario */}
        <OwnerTypeSelector
          owner={owner}
          onUpdate={onUpdate}
          errors={errors}
          errorPrefix={ownerErrorPrefix}
        />

        {/* Campos según tipo de propietario */}
        {owner.owner_type === 'natural' && (
          <NaturalPersonFields
            owner={owner}
            onUpdate={onUpdate}
            errors={errors}
            errorPrefix={ownerErrorPrefix}
          />
        )}

        {owner.owner_type === 'juridica' && (
          <LegalEntityFields
            owner={owner}
            onUpdate={onUpdate}
            errors={errors}
            errorPrefix={ownerErrorPrefix}
          />
        )}

        {/* Campos comunes de dirección */}
        <AddressFields
          owner={owner}
          onUpdate={onUpdate}
          errors={errors}
          errorPrefix={ownerErrorPrefix}
        />

        {/* Campos adicionales */}
        <AdditionalFields
          owner={owner}
          onUpdate={onUpdate}
          errors={errors}
          errorPrefix={ownerErrorPrefix}
        />

        {/* Sección de documentos */}
        <DocumentSection
          owner={owner}
          onDocumentUpload={onDocumentUpload}
          onDocumentRemove={onDocumentRemove}
          errors={errors}
          errorPrefix={ownerErrorPrefix}
        />
      </div>
    </div>
  );
};

/**
 * Selector de tipo de propietario
 */
interface OwnerTypeSelectorProps {
  owner: Owner;
  onUpdate: (ownerId: string, field: keyof Owner, value: any) => void;
  errors: Record<string, string>;
  errorPrefix: string;
}

const OwnerTypeSelector: React.FC<OwnerTypeSelectorProps> = ({
  owner,
  onUpdate,
  errors,
  errorPrefix
}) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-2">
      Tipo de Propietario *
    </label>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <label className="relative">
        <input
          type="radio"
          name={`owner_type_${owner.id}`}
          value="natural"
          checked={owner.owner_type === 'natural'}
          onChange={() => onUpdate(owner.id, 'owner_type', 'natural')}
          className="sr-only"
        />
        <div className={`p-3 border-2 rounded-xl cursor-pointer transition-all ${
          owner.owner_type === 'natural'
            ? 'border-emerald-500 bg-emerald-50'
            : 'border-gray-200 hover:border-emerald-300'
        }`}>
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-emerald-600" />
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
          checked={owner.owner_type === 'juridica'}
          onChange={() => onUpdate(owner.id, 'owner_type', 'juridica')}
          className="sr-only"
        />
        <div className={`p-3 border-2 rounded-xl cursor-pointer transition-all ${
          owner.owner_type === 'juridica'
            ? 'border-emerald-500 bg-emerald-50'
            : 'border-gray-200 hover:border-emerald-300'
        }`}>
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-emerald-600" />
            <div>
              <div className="font-medium text-gray-900">Persona Jurídica</div>
              <div className="text-sm text-gray-600">Empresa</div>
            </div>
          </div>
        </div>
      </label>
    </div>
  </div>
);

/**
 * Campos para persona natural
 */
interface NaturalPersonFieldsProps {
  owner: Owner;
  onUpdate: (ownerId: string, field: keyof Owner, value: any) => void;
  errors: Record<string, string>;
  errorPrefix: string;
}

const NaturalPersonFields: React.FC<NaturalPersonFieldsProps> = ({
  owner,
  onUpdate,
  errors,
  errorPrefix
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Nombres *
      </label>
      <input
        type="text"
        required
        value={owner.owner_first_name || ''}
        onChange={(e) => onUpdate(owner.id, 'owner_first_name', e.target.value)}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
          errors[`${errorPrefix}owner_first_name`] ? 'border-red-500 bg-red-50' : ''
        }`}
        placeholder="Ej: Juan Carlos"
      />
      {errors[`${errorPrefix}owner_first_name`] && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" />
          {errors[`${errorPrefix}owner_first_name`]}
        </p>
      )}
    </div>

    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Apellido Paterno *
      </label>
      <input
        type="text"
        required
        value={owner.owner_paternal_last_name || ''}
        onChange={(e) => onUpdate(owner.id, 'owner_paternal_last_name', e.target.value)}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
          errors[`${errorPrefix}owner_paternal_last_name`] ? 'border-red-500 bg-red-50' : ''
        }`}
        placeholder="Ej: González"
      />
      {errors[`${errorPrefix}owner_paternal_last_name`] && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" />
          {errors[`${errorPrefix}owner_paternal_last_name`]}
        </p>
      )}
    </div>

    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Apellido Materno
      </label>
      <input
        type="text"
        value={owner.owner_maternal_last_name || ''}
        onChange={(e) => onUpdate(owner.id, 'owner_maternal_last_name', e.target.value)}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
          errors[`${errorPrefix}owner_maternal_last_name`] ? 'border-red-500 bg-red-50' : ''
        }`}
        placeholder="Ej: Rodríguez"
      />
      {errors[`${errorPrefix}owner_maternal_last_name`] && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" />
          {errors[`${errorPrefix}owner_maternal_last_name`]}
        </p>
      )}
    </div>

    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        RUT *
      </label>
      <input
        type="text"
        required
        value={owner.owner_rut || ''}
        onChange={(e) => onUpdate(owner.id, 'owner_rut', e.target.value)}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
          errors[`${errorPrefix}owner_rut`] ? 'border-red-500 bg-red-50' : ''
        }`}
        placeholder="Ej: 12.345.678-9"
      />
      {errors[`${errorPrefix}owner_rut`] && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" />
          {errors[`${errorPrefix}owner_rut`]}
        </p>
      )}
    </div>

    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Email *
      </label>
      <input
        type="email"
        required
        value={owner.owner_email || ''}
        onChange={(e) => onUpdate(owner.id, 'owner_email', e.target.value)}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
          errors[`${errorPrefix}owner_email`] ? 'border-red-500 bg-red-50' : ''
        }`}
        placeholder="Ej: juan@email.com"
      />
      {errors[`${errorPrefix}owner_email`] && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" />
          {errors[`${errorPrefix}owner_email`]}
        </p>
      )}
    </div>

    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Teléfono *
      </label>
      <input
        type="tel"
        required
        value={owner.owner_phone || ''}
        onChange={(e) => onUpdate(owner.id, 'owner_phone', e.target.value)}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
          errors[`${errorPrefix}owner_phone`] ? 'border-red-500 bg-red-50' : ''
        }`}
        placeholder="Ej: +56912345678"
      />
      {errors[`${errorPrefix}owner_phone`] && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" />
          {errors[`${errorPrefix}owner_phone`]}
        </p>
      )}
    </div>
  </div>
);

/**
 * Campos para persona jurídica
 */
interface LegalEntityFieldsProps {
  owner: Owner;
  onUpdate: (ownerId: string, field: keyof Owner, value: any) => void;
  errors: Record<string, string>;
  errorPrefix: string;
}

const LegalEntityFields: React.FC<LegalEntityFieldsProps> = ({
  owner,
  onUpdate,
  errors,
  errorPrefix
}) => (
  <>
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
      <h3 className="text-lg font-semibold text-blue-800 border-b border-blue-200 pb-2">
        Datos de Personería Jurídica
      </h3>

      {/* Tipo de Constitución */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          ¿La persona jurídica está constituida por Empresa en un Día / Tradicional? *
        </label>
        <select
          required={owner.owner_type === 'juridica'}
          value={owner.constitution_type || ''}
          onChange={(e) => onUpdate(owner.id, 'constitution_type', e.target.value)}
          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
            errors[`${errorPrefix}constitution_type`] ? 'border-red-500 bg-red-50' : ''
          }`}
        >
          <option value="">Seleccionar tipo de constitución</option>
          <option value="empresa_en_un_dia">Empresa en un Día</option>
          <option value="tradicional">Tradicional</option>
        </select>
        {errors[`${errorPrefix}constitution_type`] && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            {errors[`${errorPrefix}constitution_type`]}
          </p>
        )}
      </div>

      {/* Fecha de Constitución */}
      {owner.constitution_type && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Fecha de Constitución *
          </label>
          <input
            type="date"
            required={owner.owner_type === 'juridica'}
            value={owner.constitution_date || ''}
            onChange={(e) => onUpdate(owner.id, 'constitution_date', e.target.value)}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
              errors[`${errorPrefix}constitution_date`] ? 'border-red-500 bg-red-50' : ''
            }`}
          />
          {errors[`${errorPrefix}constitution_date`] && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors[`${errorPrefix}constitution_date`]}
            </p>
          )}
        </div>
      )}

      {/* CVE para Empresa en un Día */}
      {owner.constitution_type === 'empresa_en_un_dia' && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            CVE (Código de Verificación Empresa) *
          </label>
          <input
            type="text"
            required={owner.constitution_type === 'empresa_en_un_dia'}
            value={owner.cve_code || ''}
            onChange={(e) => onUpdate(owner.id, 'cve_code', e.target.value)}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
              errors[`${errorPrefix}cve_code`] ? 'border-red-500 bg-red-50' : ''
            }`}
            placeholder="Ej: CVE123456789"
          />
          {errors[`${errorPrefix}cve_code`] && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors[`${errorPrefix}cve_code`]}
            </p>
          )}
        </div>
      )}

      {/* Notaría y repertorio para Tradicional */}
      {owner.constitution_type === 'tradicional' && (
        <>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Notaría *
            </label>
            <input
              type="text"
              required={owner.constitution_type === 'tradicional'}
              value={owner.notary_name || ''}
              onChange={(e) => onUpdate(owner.id, 'notary_name', e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                errors[`${errorPrefix}notary_name`] ? 'border-red-500 bg-red-50' : ''
              }`}
              placeholder="Ej: Notaría Central de Santiago"
            />
            {errors[`${errorPrefix}notary_name`] && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors[`${errorPrefix}notary_name`]}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Número de Repertorio *
            </label>
            <input
              type="text"
              required={owner.constitution_type === 'tradicional'}
              value={owner.repertory_number || ''}
              onChange={(e) => onUpdate(owner.id, 'repertory_number', e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                errors[`${errorPrefix}repertory_number`] ? 'border-red-500 bg-red-50' : ''
              }`}
              placeholder="Ej: 12345"
            />
            {errors[`${errorPrefix}repertory_number`] && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors[`${errorPrefix}repertory_number`]}
              </p>
            )}
          </div>
        </>
      )}
    </div>

    {/* Datos de la Empresa */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Razón Social *
        </label>
        <input
          type="text"
          required={owner.owner_type === 'juridica'}
          value={owner.owner_company_name || ''}
          onChange={(e) => onUpdate(owner.id, 'owner_company_name', e.target.value)}
          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
            errors[`${errorPrefix}owner_company_name`] ? 'border-red-500 bg-red-50' : ''
          }`}
          placeholder="Ej: Empresa S.A."
        />
        {errors[`${errorPrefix}owner_company_name`] && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            {errors[`${errorPrefix}owner_company_name`]}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          RUT Empresa *
        </label>
        <input
          type="text"
          required={owner.owner_type === 'juridica'}
          value={owner.owner_company_rut || ''}
          onChange={(e) => onUpdate(owner.id, 'owner_company_rut', e.target.value)}
          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
            errors[`${errorPrefix}owner_company_rut`] ? 'border-red-500 bg-red-50' : ''
          }`}
          placeholder="Ej: 76.123.456-7"
        />
        {errors[`${errorPrefix}owner_company_rut`] && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            {errors[`${errorPrefix}owner_company_rut`]}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Giro *
        </label>
        <input
          type="text"
          required={owner.owner_type === 'juridica'}
          value={owner.owner_company_business || ''}
          onChange={(e) => onUpdate(owner.id, 'owner_company_business', e.target.value)}
          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
            errors[`${errorPrefix}owner_company_business`] ? 'border-red-500 bg-red-50' : ''
          }`}
          placeholder="Ej: Comercio al por menor"
        />
        {errors[`${errorPrefix}owner_company_business`] && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            {errors[`${errorPrefix}owner_company_business`]}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Email Empresa *
        </label>
        <input
          type="email"
          required={owner.owner_type === 'juridica'}
          value={owner.owner_company_email || ''}
          onChange={(e) => onUpdate(owner.id, 'owner_company_email', e.target.value)}
          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
            errors[`${errorPrefix}owner_company_email`] ? 'border-red-500 bg-red-50' : ''
          }`}
          placeholder="Ej: contacto@empresa.cl"
        />
        {errors[`${errorPrefix}owner_company_email`] && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            {errors[`${errorPrefix}owner_company_email`]}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Teléfono Empresa *
        </label>
        <input
          type="tel"
          required={owner.owner_type === 'juridica'}
          value={owner.owner_company_phone || ''}
          onChange={(e) => onUpdate(owner.id, 'owner_company_phone', e.target.value)}
          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
            errors[`${errorPrefix}owner_company_phone`] ? 'border-red-500 bg-red-50' : ''
          }`}
          placeholder="Ej: +56212345678"
        />
        {errors[`${errorPrefix}owner_company_phone`] && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            {errors[`${errorPrefix}owner_company_phone`]}
          </p>
        )}
      </div>
    </div>

    {/* Representante Legal */}
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
        Representante Legal
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Nombres Representante *
          </label>
          <input
            type="text"
            required={owner.owner_type === 'juridica'}
            value={owner.owner_representative_first_name || ''}
            onChange={(e) => onUpdate(owner.id, 'owner_representative_first_name', e.target.value)}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
              errors[`${errorPrefix}owner_representative_first_name`] ? 'border-red-500 bg-red-50' : ''
            }`}
            placeholder="Ej: María José"
          />
          {errors[`${errorPrefix}owner_representative_first_name`] && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors[`${errorPrefix}owner_representative_first_name`]}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Apellido Paterno Representante *
          </label>
          <input
            type="text"
            required={owner.owner_type === 'juridica'}
            value={owner.owner_representative_paternal_last_name || ''}
            onChange={(e) => onUpdate(owner.id, 'owner_representative_paternal_last_name', e.target.value)}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
              errors[`${errorPrefix}owner_representative_paternal_last_name`] ? 'border-red-500 bg-red-50' : ''
            }`}
            placeholder="Ej: González"
          />
          {errors[`${errorPrefix}owner_representative_paternal_last_name`] && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors[`${errorPrefix}owner_representative_paternal_last_name`]}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Apellido Materno Representante
          </label>
          <input
            type="text"
            value={owner.owner_representative_maternal_last_name || ''}
            onChange={(e) => onUpdate(owner.id, 'owner_representative_maternal_last_name', e.target.value)}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
              errors[`${errorPrefix}owner_representative_maternal_last_name`] ? 'border-red-500 bg-red-50' : ''
            }`}
            placeholder="Ej: Rodríguez"
          />
          {errors[`${errorPrefix}owner_representative_maternal_last_name`] && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors[`${errorPrefix}owner_representative_maternal_last_name`]}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            RUT Representante *
          </label>
          <input
            type="text"
            required={owner.owner_type === 'juridica'}
            value={owner.owner_representative_rut || ''}
            onChange={(e) => onUpdate(owner.id, 'owner_representative_rut', e.target.value)}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
              errors[`${errorPrefix}owner_representative_rut`] ? 'border-red-500 bg-red-50' : ''
            }`}
            placeholder="Ej: 15.678.901-2"
          />
          {errors[`${errorPrefix}owner_representative_rut`] && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors[`${errorPrefix}owner_representative_rut`]}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Email Representante *
          </label>
          <input
            type="email"
            required={owner.owner_type === 'juridica'}
            value={owner.owner_representative_email || ''}
            onChange={(e) => onUpdate(owner.id, 'owner_representative_email', e.target.value)}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
              errors[`${errorPrefix}owner_representative_email`] ? 'border-red-500 bg-red-50' : ''
            }`}
            placeholder="Ej: maria@empresa.cl"
          />
          {errors[`${errorPrefix}owner_representative_email`] && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors[`${errorPrefix}owner_representative_email`]}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Teléfono Representante *
          </label>
          <input
            type="tel"
            required={owner.owner_type === 'juridica'}
            value={owner.owner_representative_phone || ''}
            onChange={(e) => onUpdate(owner.id, 'owner_representative_phone', e.target.value)}
            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
              errors[`${errorPrefix}owner_representative_phone`] ? 'border-red-500 bg-red-50' : ''
            }`}
            placeholder="Ej: +56987654321"
          />
          {errors[`${errorPrefix}owner_representative_phone`] && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors[`${errorPrefix}owner_representative_phone`]}
            </p>
          )}
        </div>
      </div>
    </div>
  </>
);

/**
 * Campos de dirección (comunes para ambos tipos)
 */
interface AddressFieldsProps {
  owner: Owner;
  onUpdate: (ownerId: string, field: keyof Owner, value: any) => void;
  errors: Record<string, string>;
  errorPrefix: string;
}

const AddressFields: React.FC<AddressFieldsProps> = ({
  owner,
  onUpdate,
  errors,
  errorPrefix
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Calle *
      </label>
      <input
        type="text"
        required
        value={owner.owner_address_street || ''}
        onChange={(e) => onUpdate(owner.id, 'owner_address_street', e.target.value)}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
          errors[`${errorPrefix}owner_address_street`] ? 'border-red-500 bg-red-50' : ''
        }`}
        placeholder="Ej: Av. Providencia"
      />
      {errors[`${errorPrefix}owner_address_street`] && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" />
          {errors[`${errorPrefix}owner_address_street`]}
        </p>
      )}
    </div>

    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Número *
      </label>
      <input
        type="text"
        required
        value={owner.owner_address_number || ''}
        onChange={(e) => onUpdate(owner.id, 'owner_address_number', e.target.value)}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
          errors[`${errorPrefix}owner_address_number`] ? 'border-red-500 bg-red-50' : ''
        }`}
        placeholder="Ej: 1234"
      />
      {errors[`${errorPrefix}owner_address_number`] && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" />
          {errors[`${errorPrefix}owner_address_number`]}
        </p>
      )}
    </div>

    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Región *
      </label>
      <select
        required
        value={owner.owner_region || ''}
        onChange={(e) => onUpdate(owner.id, 'owner_region', e.target.value)}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
          errors[`${errorPrefix}owner_region`] ? 'border-red-500 bg-red-50' : ''
        }`}
      >
        <option value="">Seleccionar región</option>
        {/* Aquí irían las opciones de región */}
      </select>
      {errors[`${errorPrefix}owner_region`] && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" />
          {errors[`${errorPrefix}owner_region`]}
        </p>
      )}
    </div>

    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Comuna *
      </label>
      <select
        required
        value={owner.owner_commune || ''}
        onChange={(e) => onUpdate(owner.id, 'owner_commune', e.target.value)}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
          errors[`${errorPrefix}owner_commune`] ? 'border-red-500 bg-red-50' : ''
        }`}
      >
        <option value="">Seleccionar comuna</option>
        {/* Aquí irían las opciones de comuna */}
      </select>
      {errors[`${errorPrefix}owner_commune`] && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" />
          {errors[`${errorPrefix}owner_commune`]}
        </p>
      )}
    </div>
  </div>
);

/**
 * Campos adicionales (nacionalidad, unidad, porcentaje)
 */
interface AdditionalFieldsProps {
  owner: Owner;
  onUpdate: (ownerId: string, field: keyof Owner, value: any) => void;
  errors: Record<string, string>;
  errorPrefix: string;
}

const AdditionalFields: React.FC<AdditionalFieldsProps> = ({
  owner,
  onUpdate,
  errors,
  errorPrefix
}) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Nacionalidad
      </label>
      <select
        value={owner.owner_nationality || ''}
        onChange={(e) => onUpdate(owner.id, 'owner_nationality', e.target.value)}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
          errors[`${errorPrefix}owner_nationality`] ? 'border-red-500 bg-red-50' : ''
        }`}
      >
        <option value="">Seleccionar nacionalidad</option>
        <option value="chile">Chilena</option>
        <option value="extranjera">Extranjera</option>
      </select>
      {errors[`${errorPrefix}owner_nationality`] && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" />
          {errors[`${errorPrefix}owner_nationality`]}
        </p>
      )}
    </div>

    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Tipo de Unidad
      </label>
      <select
        value={owner.owner_unit_type || ''}
        onChange={(e) => onUpdate(owner.id, 'owner_unit_type', e.target.value)}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
          errors[`${errorPrefix}owner_unit_type`] ? 'border-red-500 bg-red-50' : ''
        }`}
      >
        <option value="Casa">Casa</option>
        <option value="Departamento">Departamento</option>
        <option value="Oficina">Oficina</option>
      </select>
      {errors[`${errorPrefix}owner_unit_type`] && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" />
          {errors[`${errorPrefix}owner_unit_type`]}
        </p>
      )}
    </div>

    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Número Unidad
      </label>
      <input
        type="text"
        value={owner.owner_apartment_number || ''}
        onChange={(e) => onUpdate(owner.id, 'owner_apartment_number', e.target.value)}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
          errors[`${errorPrefix}owner_apartment_number`] ? 'border-red-500 bg-red-50' : ''
        }`}
        placeholder="Ej: 45A"
      />
      {errors[`${errorPrefix}owner_apartment_number`] && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" />
          {errors[`${errorPrefix}owner_apartment_number`]}
        </p>
      )}
    </div>

    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        % Propiedad
      </label>
      <input
        type="number"
        min="0"
        max="100"
        value={owner.ownership_percentage || ''}
        onChange={(e) => onUpdate(owner.id, 'ownership_percentage', e.target.value ? parseFloat(e.target.value) : undefined)}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
          errors[`${errorPrefix}ownership_percentage`] ? 'border-red-500 bg-red-50' : ''
        }`}
        placeholder="Ej: 100"
      />
      {errors[`${errorPrefix}ownership_percentage`] && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" />
          {errors[`${errorPrefix}ownership_percentage`]}
        </p>
      )}
    </div>

    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Régimen Propiedad
      </label>
      <select
        value={owner.property_regime || ''}
        onChange={(e) => onUpdate(owner.id, 'property_regime', e.target.value)}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
          errors[`${errorPrefix}property_regime`] ? 'border-red-500 bg-red-50' : ''
        }`}
      >
        <option value="">Seleccionar régimen</option>
        <option value="participacion">Participación</option>
        <option value="condominio">Condominio</option>
        <option value="individual">Individual</option>
      </select>
      {errors[`${errorPrefix}property_regime`] && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" />
          {errors[`${errorPrefix}property_regime`]}
        </p>
      )}
    </div>
  </div>
);

/**
 * Sección de documentos del propietario
 */
interface DocumentSectionProps {
  owner: Owner;
  onDocumentUpload: (ownerId: string, documentType: string, file: File) => void;
  onDocumentRemove: (ownerId: string, documentType: string) => void;
  errors: Record<string, string>;
  errorPrefix: string;
}

const DocumentSection: React.FC<DocumentSectionProps> = ({
  owner,
  onDocumentUpload,
  onDocumentRemove,
  errors,
  errorPrefix
}) => (
  <div className="border-t pt-4">
    <h4 className="text-md font-semibold text-gray-800 mb-3">Documentos del Propietario</h4>
    {/* Aquí iría la lógica de documentos - por simplicidad inicial, omito */}
    <p className="text-sm text-gray-600">Documentos requeridos según tipo de propietario</p>
  </div>
);
