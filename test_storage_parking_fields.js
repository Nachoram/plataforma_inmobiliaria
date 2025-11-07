import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with hardcoded values from env.example.txt
const supabaseUrl = 'https://phnkervuiijqmapgswkc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testStorageParkingFields() {
  console.log('🧪 Testing storage and parking fields saving...\n');

  try {
    // Get an existing property to update
    console.log('🔍 Finding an existing property to test with...');

    const { data: existingProperties, error: findError } = await supabase
      .from('properties')
      .select('id, titulo, tipo_propiedad, tiene_bodega, ubicacion_bodega, ubicacion_estacionamiento')
      .limit(1);

    if (findError || !existingProperties || existingProperties.length === 0) {
      console.error('❌ No existing properties found to test with');
      return;
    }

    const testProperty = existingProperties[0];
    console.log('📋 Using existing property:', testProperty.titulo, '(ID:', testProperty.id + ')');

    // Test data - update storage and parking fields
    const updateData = {
      // Storage fields
      tiene_bodega: true,
      metros_bodega: 35,
      ubicacion_bodega: 'TEST - Subsuelo Nivel -2, Bodega T35',
      numero_bodega: 'T35',

      // Parking location field
      ubicacion_estacionamiento: 'TEST - E-15, E-16 (Planta Baja)',
    };

    console.log('📝 Updating property with test storage and parking data...');
    console.log('Update data:', JSON.stringify(updateData, null, 2));

    const { data: updatedProperty, error: updateError } = await supabase
      .from('properties')
      .update(updateData)
      .eq('id', testProperty.id)
      .select('id, tiene_bodega, metros_bodega, ubicacion_bodega, numero_bodega, ubicacion_estacionamiento')
      .single();

    if (updateError) {
      console.error('❌ Error updating test property:', updateError.message);
      return;
    }

    console.log('✅ Property updated successfully!');

    // Verify the data was saved correctly
    console.log('\n🔍 Verifying saved data...');

    const { data: savedProperty, error: selectError } = await supabase
      .from('properties')
      .select(`
        id,
        tipo_propiedad,
        tiene_bodega,
        metros_bodega,
        ubicacion_bodega,
        numero_bodega,
        storage_number,
        estacionamientos,
        ubicacion_estacionamiento
      `)
      .eq('id', insertedProperty.id)
      .single();

    if (selectError) {
      console.error('❌ Error retrieving saved property:', selectError.message);
      return;
    }

    console.log('📊 Saved property data:');
    console.log(JSON.stringify(savedProperty, null, 2));

    // Check if all fields are correctly saved
    const checks = [
      { field: 'tiene_bodega', expected: true, actual: savedProperty.tiene_bodega },
      { field: 'metros_bodega', expected: 25, actual: savedProperty.metros_bodega },
      { field: 'ubicacion_bodega', expected: 'Subsuelo - Bodega A15', actual: savedProperty.ubicacion_bodega },
      { field: 'numero_bodega', expected: 'A15', actual: savedProperty.numero_bodega },
      { field: 'storage_number', expected: 'A15', actual: savedProperty.storage_number },
      { field: 'estacionamientos', expected: 2, actual: savedProperty.estacionamientos },
      { field: 'ubicacion_estacionamiento', expected: 'E-01, E-02 (Planta baja)', actual: savedProperty.ubicacion_estacionamiento }
    ];

    console.log('\n✅ Field verification results:');
    let allPassed = true;

    checks.forEach(check => {
      const passed = check.actual === check.expected;
      console.log(`${passed ? '✅' : '❌'} ${check.field}: expected "${check.expected}", got "${check.actual}"`);
      if (!passed) allPassed = false;
    });

    if (allPassed) {
      console.log('\n🎉 All storage and parking fields are saving correctly!');
    } else {
      console.log('\n⚠️ Some fields are not saving correctly.');
    }

    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('properties')
      .delete()
      .eq('id', insertedProperty.id);

    if (deleteError) {
      console.warn('⚠️ Warning: Could not delete test property:', deleteError.message);
    } else {
      console.log('✅ Test property deleted successfully');
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

testStorageParkingFields();
