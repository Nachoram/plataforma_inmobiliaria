// Script para verificar las condiciones contractuales guardadas
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyContractConditions() {
  try {
    console.log('🔍 Verificando condiciones contractuales...\n');

    // 1. Verificar tabla rental_contract_conditions
    console.log('1️⃣ Tabla rental_contract_conditions:');
    const { data: conditions, error: conditionsError } = await supabase
      .from('rental_contract_conditions')
      .select('*')
      .limit(5);

    if (conditionsError) {
      console.error('❌ Error consultando rental_contract_conditions:', conditionsError.message);
    } else {
      console.log(`✅ Encontrados ${conditions.length} registros:`);
      conditions.forEach((cond, index) => {
        console.log(`   ${index + 1}. App ID: ${cond.application_id}`);
        console.log(`      - Plazo: ${cond.lease_term_months} meses`);
        console.log(`      - Precio: $${cond.final_price_clp?.toLocaleString()}`);
        console.log(`      - Garantía: $${cond.guarantee_amount_clp?.toLocaleString()}`);
        console.log(`      - Mascotas: ${cond.accepts_pets ? 'Sí' : 'No'}`);
        console.log(`      - Email comunicación: ${cond.official_communication_email}`);
        console.log('');
      });
    }

    // 2. Verificar tabla rental_contracts
    console.log('2️⃣ Tabla rental_contracts:');
    const { data: contracts, error: contractsError } = await supabase
      .from('rental_contracts')
      .select('id, application_id, status, created_at')
      .limit(5);

    if (contractsError) {
      console.error('❌ Error consultando rental_contracts:', contractsError.message);
    } else {
      console.log(`✅ Encontrados ${contracts.length} contratos:`);
      contracts.forEach((contract, index) => {
        console.log(`   ${index + 1}. ID: ${contract.id}`);
        console.log(`      - App ID: ${contract.application_id}`);
        console.log(`      - Estado: ${contract.status}`);
        console.log(`      - Creado: ${new Date(contract.created_at).toLocaleDateString()}`);
        console.log('');
      });
    }

    // 3. Verificar aplicaciones con condiciones
    console.log('3️⃣ Aplicaciones con condiciones contractuales:');
    const { data: appsWithConditions, error: appsError } = await supabase
      .from('applications')
      .select(`
        id,
        status,
        rental_contract_conditions (
          lease_term_months,
          final_price_clp,
          accepts_pets
        )
      `)
      .not('rental_contract_conditions', 'is', null)
      .limit(3);

    if (appsError) {
      console.error('❌ Error consultando aplicaciones:', appsError.message);
    } else {
      console.log(`✅ Encontradas ${appsWithConditions.length} aplicaciones con condiciones:`);
      appsWithConditions.forEach((app, index) => {
        console.log(`   ${index + 1}. App ID: ${app.id} (Estado: ${app.status})`);
        if (app.rental_contract_conditions) {
          console.log(`      - Condiciones: ${JSON.stringify(app.rental_contract_conditions, null, 2)}`);
        }
        console.log('');
      });
    }

    console.log('✅ Verificación completada');

  } catch (error) {
    console.error('❌ Error en verificación:', error);
  }
}

verifyContractConditions();











