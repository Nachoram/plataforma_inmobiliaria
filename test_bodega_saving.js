import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with hardcoded values from env.example.txt
const supabaseUrl = 'https://phnkervuiijqmapgswkc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBodegaSaving() {
  console.log('🧪 Testing bodega fields saving for different property types...\n');

  try {
    // Get an existing property to update
    const { data: properties, error: findError } = await supabase
      .from('properties')
      .select('id, titulo, tipo_propiedad, tiene_bodega, metros_bodega, ubicacion_bodega')
      .limit(1);

    if (findError || !properties || properties.length === 0) {
      console.error('❌ No properties found to test with');
      return;
    }

    const property = properties[0];
    console.log('📋 Testing with property:', property.titulo, '(ID:', property.id + ')');

    // Test different property types
    const testCases = [
      {
        tipo_propiedad: 'Casa',
        description: 'Casa with bodega'
      },
      {
        tipo_propiedad: 'Departamento',
        description: 'Departamento with bodega'
      },
      {
        tipo_propiedad: 'Oficina',
        description: 'Oficina with bodega'
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n🏠 Testing ${testCase.description}...`);

      const updateData = {
        tipo_propiedad: testCase.tipo_propiedad,
        titulo: `TEST - ${testCase.description}`,
        descripcion: `Testing bodega saving for ${testCase.tipo_propiedad}`,
        precio: 1000000,
        address_street: 'Test Street',
        address_number: '123',

        // Bodega fields
        tiene_bodega: true,
        metros_bodega: 20,
        ubicacion_bodega: `TEST - Bodega para ${testCase.tipo_propiedad}`,

        // Required fields
        property_characteristic_id: 'TEST' + testCase.tipo_propiedad.slice(0, 3).toUpperCase() + Date.now().toString().slice(-6)
      };

      const { data: updatedProperty, error: updateError } = await supabase
        .from('properties')
        .update(updateData)
        .eq('id', property.id)
        .select('id, tipo_propiedad, tiene_bodega, metros_bodega, ubicacion_bodega')
        .single();

      if (updateError) {
        console.error(`❌ Error updating ${testCase.tipo_propiedad}:`, updateError.message);
        continue;
      }

      console.log(`✅ ${testCase.tipo_propiedad} updated successfully`);
      console.log('   - tipo_propiedad:', updatedProperty.tipo_propiedad);
      console.log('   - tiene_bodega:', updatedProperty.tiene_bodega);
      console.log('   - metros_bodega:', updatedProperty.metros_bodega);
      console.log('   - ubicacion_bodega:', updatedProperty.ubicacion_bodega);
    }

    console.log('\n🎉 Bodega testing completed!');

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

testBodegaSaving();

