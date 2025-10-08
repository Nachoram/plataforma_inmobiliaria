import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://phnkervuiijqmapgswkc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createCanvasContractExample() {
  try {
    console.log('🎨 Creando contrato de ejemplo con formato Canvas optimizado...');

    // Ejemplo del formato JSONB optimizado que pidió el usuario
    const contractContent = {
      arrendador: {
        nombre: "Martín Ignacio Pérez López",
        rut: "20.456.789-1",
        domicilio: "Santa Isabel 345 Depto. 1201, Santiago"
      },
      arrendatario: {
        nombre: "María José González Castro",
        rut: "15.123.456-7",
        domicilio: "Providencia 1234, Santiago"
      },
      aval: {
        nombre: "Javiera Paz Muñoz Díaz",
        rut: "13.054.363-4",
        domicilio: "Av. Irarrázaval 3050 Depto. 607, ñuñoa"
      },
      clausulas: [
        {
          titulo: "PRIMERO: PROPIEDAD ARRENDADA",
          contenido: "El Arrendador da en arrendamiento al Arrendatario el inmueble ubicado en Suecia 1234 Casa A, Providencia. Se deja constancia que la propiedad se arrienda con sus servicios de luz, agua, gas y gastos comunes al día."
        },
        {
          titulo: "SEGUNDO: RENTA DE ARRENDAMIENTO",
          contenido: "La renta mensual de arrendamiento será la suma de $1.600.000. El Arrendatario se obliga a pagar dicha renta por mesadas anticipadas, dentro de los primeros cinco días de cada mes, mediante transferencia electrónica a la cuenta que el Arrendador indique."
        },
        {
          titulo: "TERCERO: DURACIÓN DEL CONTRATO",
          contenido: "El presente contrato de arrendamiento tendrá una duración de 12 meses. Este contrato se renovará tácita y sucesivamente por períodos iguales si ninguna de las partes manifestare su voluntad de ponerle término mediante carta certificada con una anticipación de a lo menos 60 días al vencimiento del período respectivo."
        },
        {
          titulo: "CUARTO: GARANTÍA",
          contenido: "A fin de garantizar la conservación de la propiedad, el Arrendatario entrega en este acto al Arrendador a título de garantía la suma de $1.600.000, equivalente a un mes de renta, la cual será devuelta dentro de los 30 días siguientes a la restitución del inmueble, una vez verificado el estado del mismo y el pago total de las cuentas de servicios y gastos."
        },
        {
          titulo: "QUINTO: OBLIGACIONES DEL ARRENDADOR",
          contenido: "EL ARRENDADOR debe entregar la propiedad en buenas condiciones de habitación y uso. En caso de que se produzca algún desperfecto en la propiedad de naturaleza diferente a los que corresponde reparar a EL ARRENDATARIO, EL ARRENDADOR queda obligado a efectuarlos, incluyendo reparaciones a las instalaciones de suministros de agua, electricidad, gas y alcantarillado. Los trabajos de reparación deberán iniciarse dentro de los diez días siguientes al aviso que le sea dado por EL ARRENDATARIO; en caso de no hacerlo, autoriza desde luego a EL ARRENDATARIO para efectuar a su cargo las reparaciones, descontando su importe de las rentas mensuales siguientes, debiendo respaldar la naturaleza y el valor de la reparación con los comprobantes respectivos."
        },
        {
          titulo: "SEXTO: OBLIGACIONES DEL ARRENDATARIO",
          contenido: "El Arrendatario se obliga a restituir la propiedad al término del presente contrato, en el mismo estado en que la hubiere recibido, considerándose su desgaste natural conforme al uso y goce legítimo. EL ARRENDATARIO se obliga a hacer las reparaciones locativas y a mantener en buen estado las llaves de los artefactos, válvulas, enchufes, interruptores, etc. También se obliga al pago de los servicios y consumos de energía eléctrica, gas, agua, y gastos comunes. Cualquier mora o simple retraso en el pago de dichos servicios facultará al ARRENDADOR para notificar del término anticipado del contrato."
        },
        {
          titulo: "SÉPTIMO: PROHIBICIONES",
          contenido: "Queda expresamente prohibido al arrendatario: a) Ceder, subarrendar, o transferir a cualquier título el presente contrato. b) Destinar el inmueble a un objeto diferente al de habitación. c) Ejecutar obra alguna en la propiedad, sin previa autorización escrita del arrendador. d) Clavar o agujerear paredes, o introducir materiales explosivos o inflamables. e) No dar cumplimiento a lo dispuesto en el Reglamento de Convivencia Interno del Condominio."
        },
        {
          titulo: "OCTAVO: DERECHO DE VISITA",
          contenido: "EL ARRENDATARIO se obliga a dar las facilidades necesarias a EL ARRENDADOR para que durante el último mes de arriendo pueda visitar el inmueble y mostrarlo a terceros interesados, a lo menos durante dos días a la semana, dos horas por día. El Arrendador podrá, una vez en cada semestre, previo aviso a El Arrendatario dado con a lo menos una semana de anticipación, visitar la propiedad sólo con el objeto de ver el estado en que se encuentra."
        },
        {
          titulo: "NOVENO: AUTORIZACIÓN DE INFORMES COMERCIALES",
          contenido: "EL ARRENDATARIO faculta irrevocable al ARRENDADOR para que pueda dar a conocer la morosidad en el pago de las rentas de arrendamiento, gastos comunes y consumos del inmueble, proporcionando dicha información a cualquier registro o banco de datos personales como DICOM, relevando al arrendador de cualquier responsabilidad que se pueda derivar al efecto."
        },
        {
          titulo: "DÉCIMO: TÉRMINO ANTICIPADO DEL CONTRATO",
          contenido: "Serán motivos plausibles para que el arrendador desahucie el contrato de arrendamiento, los generales previstos en la ley, y especialmente los siguientes: cuando el arrendatario incumpla su obligación de pago de la renta, cuando tengan lugar actividades molestas, insalubres, nocivas, peligrosas o ilícitas, y cuando se incumpla por parte del arrendatario cualquiera de las cláusulas del presente contrato."
        },
        {
          titulo: "DÉCIMO PRIMERO: CODEUDOR SOLIDARIO (AVAL)",
          contenido: "Comparece como codeudor solidario de todas las obligaciones del Arrendatario, Javiera Paz Muñoz Díaz, cédula de identidad N° 13.054.363-4, domiciliado en Av. Irarrázaval 3050 Depto. 607, ñuñoa, quien se obliga como fiador y codeudor solidario, renunciando al beneficio de excusión. Su responsabilidad se extenderá por todo el período que el Arrendatario ocupe el inmueble."
        },
        {
          titulo: "DÉCIMO SEGUNDO: DOMICILIO",
          contenido: "El arrendatario y su aval se obligan a informar al arrendador cualquier cambio de domicilio o datos de contacto. Para todos los efectos legales, las partes fijan su domicilio en la ciudad de Santiago y se someten a la Jurisdicción de sus Tribunales de Justicia."
        }
      ]
    };

    // Crear contrato usando solo contract_content (formato optimizado)
    const { data, error } = await supabase
      .from('rental_contracts')
      .insert({
        contract_content: contractContent,
        contract_number: 'CANVAS-EXAMPLE-001',
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
        // NOTA: No incluimos contract_html - se genera automáticamente
      })
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Contrato Canvas creado exitosamente!');
    console.log('📋 ID del contrato:', data.id);
    console.log('🏷️  Número del contrato:', data.contract_number);
    console.log('🎨 Tipo: Formato Canvas optimizado (solo JSONB)');
    console.log('📊 Tamaño del payload: ~' + JSON.stringify(contractContent).length + ' caracteres');

    console.log('\n💡 El contrato se puede editar usando el ContractCanvasEditor');
    console.log('🔄 El HTML se genera automáticamente cuando se visualiza');

    return data;

  } catch (error) {
    console.error('❌ Error al crear contrato Canvas:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  createCanvasContractExample().then(() => {
    console.log('\n🚀 Contrato Canvas listo para usar!');
  }).catch((error) => {
    console.error('💥 Error en el script:', error);
    process.exit(1);
  });
}

export { createCanvasContractExample };
