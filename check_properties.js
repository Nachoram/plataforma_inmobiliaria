// Verificar datos en tabla properties
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://phnkervuiijqmapgswkc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w'
);

async function checkProperties() {
  console.log('🔍 Verificando datos en tabla properties...');

  try {
    const { data, error } = await supabase
      .from('properties')
      .select('id, property_type, tipo_propiedad, address_street, owner_id')
      .limit(10);

    if (error) {
      console.log('❌ Error:', error);
    } else {
      console.log('📊 Propiedades encontradas:', data ? data.length : 0);

      if (data && data.length > 0) {
        console.log('📋 Detalles de propiedades:');
        data.forEach((p, i) => {
          console.log(`${i+1}. ${p.address_street || 'Sin dirección'}`);
          console.log(`   property_type: "${p.property_type}"`);
          console.log(`   tipo_propiedad: "${p.tipo_propiedad}"`);
          console.log(`   owner_id: ${p.owner_id}`);
          console.log('');
        });

        // Analizar los tipos
        const tiposPropertyType = data.map(p => p.property_type).filter(Boolean);
        const tiposTipoPropiedad = data.map(p => p.tipo_propiedad).filter(Boolean);

        console.log('📊 Análisis:');
        console.log('property_type únicos:', [...new Set(tiposPropertyType)]);
        console.log('tipo_propiedad únicos:', [...new Set(tiposTipoPropiedad)]);

        if (tiposPropertyType.every(t => t === 'Casa') && tiposPropertyType.length > 0) {
          console.log('⚠️  ¡PROBLEMA! Todos los property_type son "Casa"');
        }

        if (tiposTipoPropiedad.every(t => t === 'Casa') && tiposTipoPropiedad.length > 0) {
          console.log('⚠️  ¡PROBLEMA! Todos los tipo_propiedad son "Casa"');
        }

      } else {
        console.log('⚠️  No hay propiedades en la base de datos');
        console.log('💡 Necesitas crear datos de prueba o usar propiedades existentes');
      }
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

checkProperties();
