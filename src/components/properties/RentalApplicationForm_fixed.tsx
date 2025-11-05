import React, { useState, useEffect } from 'react';
import { X, Send, User, AlertCircle, ExternalLink, Building, FileText, MessageSquarePlus, CheckCircle, Home, Plus, Minus, Building2, Users, UserCheck } from 'lucide-react';
import { supabase, Property, Profile, formatPriceCLP, CHILE_REGIONS, MARITAL_STATUS_OPTIONS, FILE_SIZE_LIMITS, getCurrentProfile, getPropertyTypeInfo } from '../../lib/supabase';
import { webhookClient } from '../../lib/webhook';

interface RentalApplicationFormProps {
  property: Property;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Tipos para entidades
type EntityType = 'natural' | 'juridica';
type ConstitutionType = 'empresa_un_dia' | 'tradicional';

// Interface para datos de postulante
interface ApplicantData {
  id?: string; // Para identificar slots únicos
  entityType: EntityType;

  // Campos comunes
  first_name: string;
  paternal_last_name?: string;
  maternal_last_name?: string;
  rut: string;
  profession?: string;
  monthly_income_clp: string;
  age?: string;
  nationality: string;
  marital_status?: 'soltero' | 'casado' | 'divorciado' | 'viudo';
  address_street: string;
  address_number: string;
  address_department?: string;
  address_commune: string;
  address_region: string;
  phone?: string;
  email?: string;

  // Campos específicos para personas jurídicas
  company_name?: string;
  company_rut?: string;
  legal_representative_name?: string;
  legal_representative_rut?: string;
  constitution_type?: ConstitutionType;
  constitution_date?: string;
  constitution_cve?: string;
  constitution_notary?: string;
  repertory_number?: string;
}

// Interface para datos de aval
interface GuarantorData {
  id?: string; // Para identificar slots únicos
  entityType: EntityType;

  // Campos comunes
  first_name?: string;
  paternal_last_name?: string;
  maternal_last_name?: string;
  rut: string;
  profession?: string;
  monthly_income_clp?: string;
  contact_email?: string;
  address_street?: string;
  address_number?: string;
  address_department?: string;
  address_commune?: string;
  address_region?: string;

  // Campos específicos para personas jurídicas
  company_name?: string;
  company_rut?: string;
  legal_representative_name?: string;
  legal_representative_rut?: string;
  constitution_type?: ConstitutionType;
  constitution_date?: string;
  constitution_cve?: string;
  constitution_notary?: string;
  repertory_number?: string;
}

const RentalApplicationForm: React.FC<RentalApplicationFormProps> = ({
  property,
  onSuccess,
  onCancel
}) => {
  // Estados básicos para evitar el error de compilación
  const [loading, setLoading] = useState(false);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20 rounded-2xl shadow-2xl border border-gray-200">
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Formulario en Mantenimiento
        </h1>
        <p className="text-gray-600 mb-6">
          El formulario completo está siendo actualizado. Por favor, inténtalo más tarde.
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onCancel}
            className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    </div>
  );
};

export default RentalApplicationForm;
