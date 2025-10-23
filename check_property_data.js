import { createClient } from '@supabase/supabase-js';

// Usar las mismas variables que están en supabase.ts
const supabaseUrl = 'https://phnkervuiijqmapgswkc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkPropertyData() {
  try {
    console.log('🔍 Verificando datos de propiedades en la base de datos...\n');

    // Verificar esquema de la tabla properties
    console.log('📋 Esquema de la tabla properties:');
    const { data: schema, error: schemaError } = await supabase
      .from('properties')
      .select('*')
      .limit(1);

    if (schemaError) {
      console.error('❌ Error al consultar esquema:', schemaError);
      return;
    }

    if (schema && schema.length > 0) {
      console.log('Columnas disponibles:', Object.keys(schema[0]).join(', '));
      console.log('¿Tiene property_type?', Object.keys(schema[0]).includes('property_type') ? '✅ Sí' : '❌ No');
    }

    // Obtener todas las propiedades con sus tipos
    const { data: properties, error } = await supabase
      .from('properties')
      .select('id, property_type, address_street, status')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error al consultar propiedades:', error);
      return;
    }

    console.log(`\n📊 Total de propiedades encontradas: ${properties.length}\n`);

    // Analizar tipos de propiedad
    const typeCounts = {};
    const nullOrUndefined = [];

    properties.forEach((prop, index) => {
      const type = prop.property_type;
      if (type === null || type === undefined) {
        nullOrUndefined.push(prop.id);
      } else {
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      }

      console.log(`${index + 1}. ID: ${prop.id}`);
      console.log(`   Dirección: ${prop.address_street || 'N/A'}`);
      console.log(`   Tipo: "${type}"`);
      console.log(`   Estado: ${prop.status}`);
      console.log('');
    });

    console.log('📈 Resumen de tipos de propiedad:');
    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} propiedades`);
    });

    console.log(`\n⚠️ Propiedades sin tipo definido: ${nullOrUndefined.length}`);
    if (nullOrUndefined.length > 0) {
      console.log('IDs:', nullOrUndefined.join(', '));
    }

    // Verificar valores únicos de tipos de propiedad
    console.log('\n🔍 Tipos únicos encontrados en la BD:');
    const uniqueTypes = [...new Set(properties.map(p => p.property_type).filter(Boolean))];
    console.log(uniqueTypes.join(', '));

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

checkPropertyData();
