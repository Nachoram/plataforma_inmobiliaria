import { supabase } from './supabase';

export interface ApplicationData {
  id: string;
  snapshot_applicant_first_name: string;
  snapshot_applicant_paternal_last_name: string;
  snapshot_applicant_maternal_last_name: string;
  snapshot_applicant_rut: string;
  snapshot_applicant_email: string;
  snapshot_applicant_phone: string;
  properties: {
    id: string;
    address_street: string;
    address_number: string;
    address_department: string | null;
    address_commune: string;
    address_region: string;
    description: string | null;
    owner_id: string;
    profiles: {
      first_name: string;
      paternal_last_name: string;
      maternal_last_name: string;
      rut: string;
      email: string;
      phone: string;
    };
  };
}

export interface ContractConditions {
  contract_duration_months: number;
  monthly_payment_day: number;
  final_rent_price: number;
  brokerage_commission: number;
  guarantee_amount: number;
  official_communication_email: string;
  accepts_pets: boolean;
  dicom_clause: boolean;
  additional_conditions: string;
  // Propiedades adicionales para compatibilidad
  lease_term_months?: number;
  payment_day?: number;
  final_price_clp?: number;
  broker_commission_clp?: number;
  guarantee_amount_clp?: number;
}

/**
 * Función helper para asegurar compatibilidad con nombres antiguos de propiedades
 */
function normalizeContractConditions(conditions: ContractConditions): ContractConditions {
  return {
    ...conditions,
    // Compatibilidad hacia atrás - usar nuevos nombres como primarios
    lease_term_months: conditions.contract_duration_months || conditions.lease_term_months,
    payment_day: conditions.monthly_payment_day || conditions.payment_day,
    final_price_clp: conditions.final_rent_price || conditions.final_price_clp,
    broker_commission_clp: conditions.brokerage_commission || conditions.broker_commission_clp,
    guarantee_amount_clp: conditions.guarantee_amount || conditions.guarantee_amount_clp,
    // Asegurar que las nuevas propiedades estén presentes
    contract_duration_months: conditions.contract_duration_months || conditions.lease_term_months || 12,
    monthly_payment_day: conditions.monthly_payment_day || conditions.payment_day || 1,
    final_rent_price: conditions.final_rent_price || conditions.final_price_clp || 0,
    brokerage_commission: conditions.brokerage_commission || conditions.broker_commission_clp || 0,
    guarantee_amount: conditions.guarantee_amount || conditions.guarantee_amount_clp || 0,
  };
}

export interface ContractSection {
  id: string;
  title: string;
  content: string;
  editable: boolean;
}

/**
 * Genera el contenido inicial de un contrato basado en los datos de la aplicación y condiciones
 */
export function generateContractContent(
  application: ApplicationData,
  conditions: ContractConditions
): ContractSection[] {
  // Normalizar las condiciones para compatibilidad
  const normalizedConditions = normalizeContractConditions(conditions);

  const property = application.properties;
  const owner = property.profiles;

  // Construct full address from components
  const fullAddress = `${property.address_street} ${property.address_number}${property.address_department ? `, ${property.address_department}` : ''}, ${property.address_commune}, ${property.address_region}`;

  // Use description as title, or construct one from address if no description
  const propertyTitle = property.description || `Propiedad en ${property.address_commune}`;

  const tenant = {
    first_name: application.snapshot_applicant_first_name,
    paternal_last_name: application.snapshot_applicant_paternal_last_name,
    maternal_last_name: application.snapshot_applicant_maternal_last_name,
    rut: application.snapshot_applicant_rut,
    email: application.snapshot_applicant_email,
    phone: application.snapshot_applicant_phone
  };

  // For now, use only snapshot data since structured data relationships have issues
  const structuredApplicant = null; // application.applicants;
  const structuredGuarantor = null; // application.guarantors;

  // Prioritize structured data over snapshot data
  const tenantData = structuredApplicant ? {
    first_name: structuredApplicant.full_name.split(' ')[0] || '',
    paternal_last_name: structuredApplicant.full_name.split(' ')[1] || '',
    maternal_last_name: structuredApplicant.full_name.split(' ').slice(2).join(' ') || '',
    rut: structuredApplicant.rut,
    email: structuredApplicant.contact_email,
    phone: structuredApplicant.contact_phone || ''
  } : tenant;

  const guarantor = structuredGuarantor ? {
    first_name: structuredGuarantor.full_name.split(' ')[0] || '',
    paternal_last_name: structuredGuarantor.full_name.split(' ')[1] || '',
    maternal_last_name: structuredGuarantor.full_name.split(' ').slice(2).join(' ') || '',
    rut: structuredGuarantor.rut,
    email: structuredGuarantor.contact_email || '',
    phone: structuredGuarantor.contact_phone || ''
  } : null;

  return [
    {
      id: 'header',
      title: 'ENCABEZADO DEL CONTRATO',
      content: `
        <h1 style="text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 20px;">
          CONTRATO DE ARRENDAMIENTO DE VIVIENDA
        </h1>
        <p style="text-align: center; margin-bottom: 30px;">
          Celebrado entre las partes que al final se individualizan, al amparo de lo dispuesto en la ley N° 18.101 sobre Arrendamiento de Bienes Raíces.
        </p>
        <p style="text-align: center; margin-bottom: 20px;">
          En Santiago de Chile, a ${new Date().toLocaleDateString('es-CL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      `,
      editable: false
    },
    {
      id: 'parties',
      title: 'PARTES CONTRATANTES',
      content: `
        <h3>PRIMERA: EL ARRENDADOR (PROPIETARIO)</h3>
        <p><strong>Nombre:</strong> ${owner.first_name} ${owner.paternal_last_name} ${owner.maternal_last_name || ''}</p>
        <p><strong>RUT:</strong> ${owner.rut}</p>
        <p><strong>Domicilio:</strong> ${fullAddress}</p>
        <p><strong>Email:</strong> ${owner.email}</p>
        <p><strong>Teléfono:</strong> ${owner.phone || 'No especificado'}</p>

        <h3 style="margin-top: 20px;">SEGUNDA: EL ARRENDATARIO</h3>
        <p><strong>Nombre:</strong> ${tenantData.first_name} ${tenantData.paternal_last_name} ${tenantData.maternal_last_name || ''}</p>
        <p><strong>RUT:</strong> ${tenantData.rut}</p>
        <p><strong>Email:</strong> ${tenantData.email}</p>
        <p><strong>Teléfono:</strong> ${tenantData.phone || 'No especificado'}</p>

        ${guarantor ? `
        <h3 style="margin-top: 20px;">TERCERA: EL AVAL O GARANTE</h3>
        <p><strong>Nombre:</strong> ${guarantor.first_name} ${guarantor.paternal_last_name} ${guarantor.maternal_last_name || ''}</p>
        <p><strong>RUT:</strong> ${guarantor.rut}</p>
        <p><strong>Email:</strong> ${guarantor.email}</p>
        <p><strong>Teléfono:</strong> ${guarantor.phone || 'No especificado'}</p>
        ` : ''}
      `,
      editable: false
    },
    {
      id: 'property',
      title: 'TERCERA: BIEN ARRENDADO',
      content: `
        <p>El ARRENDADOR da en arriendo al ARRENDATARIO y este lo toma, el siguiente inmueble:</p>
        <p><strong>Dirección:</strong> ${fullAddress}</p>
        <p><strong>Tipo:</strong> ${propertyTitle}</p>
        <p><strong>Uso:</strong> Vivienda</p>
        <p><strong>Estado de entrega:</strong> En buen estado de conservación y funcionamiento.</p>
      `,
      editable: true
    },
    {
      id: 'conditions',
      title: 'CUARTA: PLAZO Y CONDICIONES',
      content: `
        <h4>Plazo del contrato</h4>
        <p>El presente contrato se celebra por un plazo de ${normalizedConditions.lease_term_months} meses, contados desde la fecha de entrega de las llaves.</p>

        <h4 style="margin-top: 15px;">Precio y forma de pago</h4>
        <p>El precio mensual del arriendo es de ${formatPrice(normalizedConditions.final_price_clp)}, pagadero por adelantado el día ${normalizedConditions.payment_day} de cada mes.</p>

        <h4 style="margin-top: 15px;">Garantía</h4>
        <p>Se deja en garantía la cantidad de ${formatPrice(normalizedConditions.guarantee_amount_clp)}, equivalente a un mes de arriendo.</p>

        ${normalizedConditions.broker_commission_clp > 0 ? `
        <h4 style="margin-top: 15px;">Comisión corredor</h4>
        <p>Se deja constancia que el corredor inmobiliario recibe una comisión de ${formatPrice(normalizedConditions.broker_commission_clp)}.</p>
        ` : ''}

        <h4 style="margin-top: 15px;">Comunicaciones oficiales</h4>
        <p>Todas las comunicaciones oficiales se realizarán al email: ${normalizedConditions.official_communication_email}</p>

        <h4 style="margin-top: 15px;">Condiciones especiales</h4>
        <ul>
          <li>Mascotas: ${normalizedConditions.accepts_pets ? 'Se permite el ingreso de mascotas al inmueble.' : 'No se permite el ingreso de mascotas al inmueble.'}</li>
          <li>DICOM: ${normalizedConditions.dicom_clause ? 'Se incluye cláusula DICOM (Derecho a Crédito por Cobranza Indebida).' : 'No se incluye cláusula DICOM.'}</li>
          ${normalizedConditions.additional_conditions ? `<li>${normalizedConditions.additional_conditions}</li>` : ''}
        </ul>
      `,
      editable: true
    },
    {
      id: 'obligations',
      title: 'QUINTA: DERECHOS Y OBLIGACIONES',
      content: `
        <h4>Obligaciones del ARRENDADOR:</h4>
        <ol>
          <li>Entregar el inmueble en buen estado de conservación y funcionamiento.</li>
          <li>Realizar las reparaciones necesarias para mantener el inmueble en condiciones habitables.</li>
          <li>Respetar el derecho a la intimidad y tranquilidad del arrendatario.</li>
          <li>Permitir el uso pacífico del inmueble durante el plazo del contrato.</li>
        </ol>

        <h4 style="margin-top: 15px;">Obligaciones del ARRENDATARIO:</h4>
        <ol>
          <li>Pagar puntualmente el precio del arriendo en la forma convenida.</li>
          <li>Usar el inmueble únicamente para vivienda, no pudiendo destinarlo a otros usos sin autorización escrita.</li>
          <li>Conservar el inmueble en buen estado, haciéndose cargo de los daños que cause por su culpa o negligencia.</li>
          <li>No realizar modificaciones o mejoras sin autorización previa del ARRENDADOR.</li>
          <li>Permitir el acceso al inmueble para inspecciones cuando sea necesario, con previo aviso.</li>
          <li>Respetar las normas de convivencia y no perturbar la tranquilidad de los vecinos.</li>
          <li>Informar inmediatamente cualquier desperfecto o necesidad de reparación.</li>
        </ol>
      `,
      editable: true
    },
    {
      id: 'termination',
      title: 'SEXTA: TERMINACIÓN DEL CONTRATO',
      content: `
        <p>El contrato podrá terminarse por las siguientes causales:</p>
        <ol>
          <li>Por mutuo acuerdo entre las partes.</li>
          <li>Por vencimiento del plazo pactado.</li>
          <li>Por incumplimiento de cualquiera de las obligaciones establecidas en este contrato.</li>
          <li>Por necesidad del ARRENDADOR de usar el inmueble para sí o su familia directa.</li>
        </ol>

        <h4 style="margin-top: 15px;">Resolución anticipada</h4>
        <p>En caso de terminación anticipada por parte del ARRENDATARIO, este deberá pagar una indemnización equivalente a 1 mes de arriendo, salvo que medie acuerdo en contrario.</p>

        <p>En caso de terminación anticipada por parte del ARRENDADOR por causales no imputables al ARRENDATARIO, deberá indemnizar con un monto equivalente a 1 mes de arriendo.</p>
      `,
      editable: true
    },
    {
      id: 'legal',
      title: 'SÉPTIMA: NORMAS LEGALES',
      content: `
        <p>Las partes declaran conocer y aceptar las disposiciones contenidas en la ley N° 18.101 sobre Arrendamiento de Bienes Raíces y en el Código Civil en lo relativo a arrendamiento de bienes.</p>

        <p>Para todos los efectos legales derivados de este contrato, las partes fijan domicilio en los señalados en la cláusula primera, donde se entenderán todas las notificaciones judiciales y extrajudiciales.</p>

        <p>En caso de controversias, las partes se someten a la jurisdicción de los tribunales de justicia de Santiago.</p>
      `,
      editable: true
    },
    {
      id: 'signatures',
      title: 'FIRMAS',
      content: `
        <div style="display: flex; justify-content: space-between; margin-top: 50px; page-break-inside: avoid;">
          <div style="width: 30%; text-align: center; border-top: 1px solid #000; padding-top: 10px;">
            <p><strong>ARRENDADOR</strong></p>
            <p>${owner.first_name} ${owner.paternal_last_name}</p>
            <p>RUT: ${owner.rut}</p>
            <p style="margin-top: 20px; font-size: 10px; color: #666;">Firma electrónica</p>
          </div>
          <div style="width: 30%; text-align: center; border-top: 1px solid #000; padding-top: 10px;">
            <p><strong>ARRENDATARIO</strong></p>
            <p>${tenantData.first_name} ${tenantData.paternal_last_name}</p>
            <p>RUT: ${tenantData.rut}</p>
            <p style="margin-top: 20px; font-size: 10px; color: #666;">Firma electrónica</p>
          </div>
          ${guarantor ? `
          <div style="width: 30%; text-align: center; border-top: 1px solid #000; padding-top: 10px;">
            <p><strong>AVAL</strong></p>
            <p>${guarantor.first_name} ${guarantor.paternal_last_name}</p>
            <p>RUT: ${guarantor.rut}</p>
            <p style="margin-top: 20px; font-size: 10px; color: #666;">Firma electrónica</p>
          </div>
          ` : ''}
        </div>
      `,
      editable: false
    }
  ];
}

/**
 * Crea un contrato automáticamente basado en una aplicación aprobada con condiciones
 */
export async function generateContractForApplication(
  applicationId: string
): Promise<string | null> {
  try {
    // Obtener datos de la aplicación con condiciones
    const { data: applicationData, error: appError } = await supabase
      .from('applications')
      .select(`
        id,
        snapshot_applicant_first_name,
        snapshot_applicant_paternal_last_name,
        snapshot_applicant_maternal_last_name,
        snapshot_applicant_rut,
        snapshot_applicant_email,
        snapshot_applicant_phone,
        properties (
          id,
          address_street,
          address_number,
          address_department,
          address_commune,
          address_region,
          description,
          owner_id,
          profiles!owner_id (
            first_name,
            paternal_last_name,
            maternal_last_name,
            rut,
            email,
            phone
          )
        ),
        rental_contract_conditions (*)
      `)
      .eq('id', applicationId)
      .single();

    if (appError) throw appError;
    if (!applicationData.rental_contract_conditions) {
      throw new Error('No se encontraron condiciones del contrato para esta aplicación');
    }

    // Verificar si ya existe un contrato
    const { data: existingContracts, error: checkError } = await supabase
      .from('rental_contracts')
      .select('id')
      .eq('application_id', applicationId)
      .limit(1);

    if (checkError) {
      console.warn('Error checking for existing contract:', checkError);
      // Continue with creation instead of failing
    } else if (existingContracts && existingContracts.length > 0) {
      return existingContracts[0].id;
    }

    // Generar contenido del contrato
    const contractSections = generateContractContent(
      applicationData as ApplicationData,
      applicationData.rental_contract_conditions as ContractConditions
    );

    const contractContent = {
      sections: contractSections,
      lastModified: new Date().toISOString(),
      version: 1,
      generatedAt: new Date().toISOString()
    };

    // Get current user for created_by field
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Usuario no autenticado');
    }

    console.log('🔍 Contract creation debug info:');
    console.log('  - Current user ID:', user.id);
    console.log('  - Application ID:', applicationId);
    console.log('  - Property owner ID:', applicationData.properties.owner_id);
    console.log('  - Is user property owner?', user.id === applicationData.properties.owner_id);

    // Check application ownership
    console.log('  - Application applicant ID:', applicationData.applicant_id);
    console.log('  - Application guarantor ID:', applicationData.guarantor_id);
    console.log('  - Is user applicant?', user.id === applicationData.applicant_id);
    console.log('  - Is user guarantor?', user.id === applicationData.guarantor_id);

    // Crear el contrato
    const contractData = {
      application_id: applicationId,
      contract_content: contractContent,
      status: 'draft',
      created_by: user.id  // Current user creates the contract
    };

    console.log('📄 Contract data to insert:', contractData);

    const { data: contract, error: contractError } = await supabase
      .from('rental_contracts')
      .insert(contractData)
      .select()
      .single();

    if (contractError) throw contractError;

    return contract.id;
  } catch (error) {
    console.error('Error generating contract:', error);
    return null;
  }
}

/**
 * Formatea un precio en pesos chilenos
 */
function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP'
  }).format(price);
}
