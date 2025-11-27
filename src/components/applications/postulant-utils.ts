/**
 * postulant-utils.ts - Utilidades para componentes de postulantes
 *
 * Funciones helper y utilidades reutilizables para los componentes
 * relacionados con postulaciones.
 */

// ========================================================================
// FORMATTING UTILITIES
// ========================================================================

/**
 * Formatea un precio en pesos chilenos
 */
export const formatPriceCLP = (price: number): string => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(price);
};

/**
 * Formatea un precio en UF
 */
export const formatPriceUF = (price: number): string => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(price) + ' UF';
};

// ========================================================================
// STATUS UTILITIES
// ========================================================================

/**
 * Colores para diferentes estados de postulación
 */
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'aprobada': return 'bg-green-100 text-green-800 border-green-200';
    case 'rechazada': return 'bg-red-100 text-red-800 border-red-200';
    case 'pendiente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'en_revision': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'finalizada': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'modificada': return 'bg-amber-100 text-amber-800 border-amber-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

/**
 * Etiquetas legibles para estados de postulación
 */
export const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'aprobada': return 'Aprobada';
    case 'rechazada': return 'Rechazada';
    case 'pendiente': return 'Pendiente';
    case 'en_revision': return 'En Revisión';
    case 'finalizada': return 'Finalizada';
    case 'modificada': return 'Modificada';
    case 'con_contrato_firmado': return 'Contrato Firmado';
    case 'anulada': return 'Anulada';
    default: return status;
  }
};

/**
 * Colores para el score de postulación
 */
export const getScoreColor = (score: number): string => {
  if (score >= 750) return 'text-green-600 bg-green-50 border-green-200';
  if (score >= 650) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  return 'text-red-600 bg-red-50 border-red-200';
};

// ========================================================================
// VALIDATION UTILITIES
// ========================================================================

/**
 * Valida si un usuario puede editar una postulación
 */
export const canEditApplication = (application: any): boolean => {
  return application?.status === 'pendiente' || application?.status === 'en_revision';
};

/**
 * Valida si un usuario puede ver el contrato
 */
export const canViewContract = (application: any): boolean => {
  return application?.status === 'aprobada' ||
         application?.status === 'finalizada' ||
         application?.status === 'modificada';
};

/**
 * Valida si un usuario puede descargar documentos
 */
export const canDownloadDocuments = (application: any): boolean => {
  return application?.status !== 'rechazada' && application?.status !== 'anulada';
};

// ========================================================================
// DATA PROCESSING UTILITIES
// ========================================================================

/**
 * Procesa los datos de postulantes para incluir nombres completos
 */
export const processApplicantsData = (applicants: any[]): any[] => {
  if (!applicants) return [];

  return applicants.map((applicant: any) => {
    const display_name = [
      applicant.first_name,
      applicant.paternal_last_name,
      applicant.maternal_last_name
    ].filter(Boolean).join(' ');

    const display_income = 'No especificado'; // monthly_income column doesn't exist

    return {
      ...applicant,
      display_name,
      display_income,
      full_name: display_name || 'Datos no disponibles'
    };
  });
};

/**
 * Procesa los datos de garantes para incluir nombres completos
 */
export const processGuarantorsData = (guarantors: any[]): any[] => {
  if (!guarantors) return [];

  return guarantors.map((guarantor: any) => {
    const display_name = [
      guarantor.first_name,
      guarantor.paternal_last_name,
      guarantor.maternal_last_name
    ].filter(Boolean).join(' ');

    const display_income = 'No especificado'; // monthly_income column doesn't exist

    return {
      ...guarantor,
      display_name,
      display_income,
      email: guarantor.contact_email || 'contacto@no.disponible',
      full_name: display_name || 'Datos no disponibles'
    };
  });
};

// ========================================================================
// CONTRACT UTILITIES
// ========================================================================

/**
 * Determina si un contrato puede ser editado
 */
export const canEditContract = (contractData: any): boolean => {
  return contractData?.status === 'draft' || !contractData;
};

/**
 * Determina si un contrato puede ser descargado
 */
export const canDownloadContract = (contractData: any): boolean => {
  return contractData?.signed_contract_url || contractData?.contract_html;
};

// ========================================================================
// TYPE GUARDS
// ========================================================================

/**
 * Type guard para verificar si un objeto es una postulación válida
 */
export const isValidApplication = (application: any): boolean => {
  return application &&
         typeof application === 'object' &&
         application.id &&
         application.property_id &&
         application.applicant_id;
};

/**
 * Type guard para verificar si un contrato es válido
 */
export const isValidContract = (contract: any): boolean => {
  return contract &&
         typeof contract === 'object' &&
         contract.application_id;
};
