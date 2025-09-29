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
    title: string;
    address: string;
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
  guarantors: Array<{
    guarantor_id: string;
    profiles: {
      first_name: string;
      paternal_last_name: string;
      maternal_last_name: string;
      rut: string;
      email: string;
      phone: string;
    };
  }>;
}

export interface ContractConditions {
  lease_term_months: number;
  payment_day: number;
  final_price_clp: number;
  broker_commission_clp: number;
  guarantee_amount_clp: number;
  official_communication_email: string;
  accepts_pets: boolean;
  dicom_clause: boolean;
  additional_conditions: string;
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
  const property = application.properties;
  const owner = property.profiles;
  const tenant = {
    first_name: application.snapshot_applicant_first_name,
    paternal_last_name: application.snapshot_applicant_paternal_last_name,
    maternal_last_name: application.snapshot_applicant_maternal_last_name,
    rut: application.snapshot_applicant_rut,
    email: application.snapshot_applicant_email,
    phone: application.snapshot_applicant_phone
  };
  const guarantor = application.guarantors?.[0]?.profiles;

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
        <p><strong>Domicilio:</strong> ${property.address}</p>
        <p><strong>Email:</strong> ${owner.email}</p>
        <p><strong>Teléfono:</strong> ${owner.phone || 'No especificado'}</p>

        <h3 style="margin-top: 20px;">SEGUNDA: EL ARRENDATARIO</h3>
        <p><strong>Nombre:</strong> ${tenant.first_name} ${tenant.paternal_last_name} ${tenant.maternal_last_name || ''}</p>
        <p><strong>RUT:</strong> ${tenant.rut}</p>
        <p><strong>Email:</strong> ${tenant.email}</p>
        <p><strong>Teléfono:</strong> ${tenant.phone || 'No especificado'}</p>

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
        <p><strong>Dirección:</strong> ${property.address}</p>
        <p><strong>Tipo:</strong> ${property.title}</p>
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
        <p>El presente contrato se celebra por un plazo de ${conditions.lease_term_months} meses, contados desde la fecha de entrega de las llaves.</p>

        <h4 style="margin-top: 15px;">Precio y forma de pago</h4>
        <p>El precio mensual del arriendo es de ${formatPrice(conditions.final_price_clp)}, pagadero por adelantado el día ${conditions.payment_day} de cada mes.</p>

        <h4 style="margin-top: 15px;">Garantía</h4>
        <p>Se deja en garantía la cantidad de ${formatPrice(conditions.guarantee_amount_clp)}, equivalente a un mes de arriendo.</p>

        ${conditions.broker_commission_clp > 0 ? `
        <h4 style="margin-top: 15px;">Comisión corredor</h4>
        <p>Se deja constancia que el corredor inmobiliario recibe una comisión de ${formatPrice(conditions.broker_commission_clp)}.</p>
        ` : ''}

        <h4 style="margin-top: 15px;">Comunicaciones oficiales</h4>
        <p>Todas las comunicaciones oficiales se realizarán al email: ${conditions.official_communication_email}</p>

        <h4 style="margin-top: 15px;">Condiciones especiales</h4>
        <ul>
          <li>Mascotas: ${conditions.accepts_pets ? 'Se permite el ingreso de mascotas al inmueble.' : 'No se permite el ingreso de mascotas al inmueble.'}</li>
          <li>DICOM: ${conditions.dicom_clause ? 'Se incluye cláusula DICOM (Derecho a Crédito por Cobranza Indebida).' : 'No se incluye cláusula DICOM.'}</li>
          ${conditions.additional_conditions ? `<li>${conditions.additional_conditions}</li>` : ''}
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
            <p>${tenant.first_name} ${tenant.paternal_last_name}</p>
            <p>RUT: ${tenant.rut}</p>
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
          title,
          address,
          owner_id,
          profiles!properties_owner_id_fkey (
            first_name,
            paternal_last_name,
            maternal_last_name,
            rut,
            email,
            phone
          )
        ),
        guarantors (
          guarantor_id,
          profiles!guarantors_guarantor_id_fkey (
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
    const { data: existingContract } = await supabase
      .from('rental_contracts')
      .select('id')
      .eq('application_id', applicationId)
      .single();

    if (existingContract) {
      return existingContract.id;
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

    // Crear el contrato
    const { data: contract, error: contractError } = await supabase
      .from('rental_contracts')
      .insert({
        application_id: applicationId,
        contract_content: contractContent,
        status: 'draft',
        created_by: applicationData.properties.owner_id
      })
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
