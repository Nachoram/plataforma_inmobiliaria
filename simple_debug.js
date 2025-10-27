import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://phnkervuiijqmapgswkc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w'
);

async function checkRentalOwners() {
  try {
    console.log('🔍 Verificando tabla rental_owners...\n');

    // Intentar consultar directamente la tabla rental_owners
    console.log('Intentando consultar rental_owners...');

    // Verificar datos existentes
    const { data: owners, error: ownersError } = await supabase
      .from('rental_owners')
      .select('*')
      .limit(5);

    if (ownersError) {
      console.error('❌ Error consultando rental_owners:', ownersError.message);
      return;
    }

    if (!owners || owners.length === 0) {
      console.log('ℹ️ No hay datos en rental_owners');
    } else {
      console.log(`📊 Se encontraron ${owners.length} registros:`);
      owners.forEach((owner, index) => {
        console.log(`  ${index + 1}. ${owner.first_name} ${owner.paternal_last_name} - RUT: ${owner.rut}`);
      });
    }

    // Verificar propiedades recientes
    const { data: properties, error: propError } = await supabase
      .from('properties')
      .select('id, listing_type, created_at')
      .order('created_at', { ascending: false })
      .limit(3);

    if (propError) {
      console.error('❌ Error consultando propiedades:', propError.message);
      return;
    }

    if (properties && properties.length > 0) {
      console.log('\n🏠 Propiedades recientes:');
      for (const prop of properties) {
        console.log(`  - ID: ${prop.id}, Tipo: ${prop.listing_type}, Creada: ${prop.created_at}`);

        // Verificar si tiene propietario
        const { data: owner, error: ownerCheck } = await supabase
          .from('rental_owners')
          .select('id')
          .eq('property_id', prop.id)
          .maybeSingle();

        if (owner) {
          console.log(`    ✅ Tiene propietario en rental_owners`);
        } else {
          console.log(`    ⚠️ NO tiene propietario en rental_owners`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

checkRentalOwners();
