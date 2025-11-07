import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with hardcoded values from env.example.txt
const supabaseUrl = 'https://phnkervuiijqmapgswkc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugEditing() {
  console.log('🔍 Debugging property editing...\n');

  try {
    // Get a property to simulate editing
    const { data: properties, error: findError } = await supabase
      .from('properties')
      .select('*')
      .limit(1);

    if (findError || !properties || properties.length === 0) {
      console.error('❌ No properties found to test with');
      return;
    }

    const property = properties[0];
    console.log('📋 Testing with property:', property.titulo, '(ID:', property.id + ')');
    console.log('Current storage/parking values:');
    console.log('- tiene_bodega:', property.tiene_bodega);
    console.log('- metros_bodega:', property.metros_bodega);
    console.log('- ubicacion_bodega:', property.ubicacion_bodega);
    console.log('- ubicacion_estacionamiento:', property.ubicacion_estacionamiento);
    console.log('- parking_location:', property.parking_location);
    console.log('- numero_bodega:', property.numero_bodega);
    console.log('- storage_number:', property.storage_number);

    // Simulate form data that would be sent during editing
    const formData = {
      tipoPropiedad: 'Oficina',
      tieneBodega: 'Sí',
      metrosBodega: '25',
      ubicacionBodega: 'TEST - Subsuelo Nivel -2',
      ubicacionEstacionamiento: 'TEST - E-01, E-02 (Planta Baja)',
      estacionamientos: '2'
    };

    console.log('\n📝 Simulating form data that would be sent:');
    console.log(JSON.stringify(formData, null, 2));

    // Simulate propertyData construction for office type
    const propertyData = {
      tipo_propiedad: formData.tipoPropiedad,
      tiene_bodega: formData.tieneBodega === 'Sí',
      metros_bodega: parseFloat(formData.metrosBodega) || null,
      ubicacion_bodega: formData.ubicacionBodega || null,
      ubicacion_estacionamiento: formData.estacionamientos !== '0' ? formData.ubicacionEstacionamiento || null : null,
    };

    console.log('\n🏠 PropertyData that would be sent to update:');
    console.log(JSON.stringify(propertyData, null, 2));

    // Test the update
    console.log('\n📤 Testing update...');
    const { data: updatedProperty, error: updateError } = await supabase
      .from('properties')
      .update(propertyData)
      .eq('id', property.id)
      .select('id, tiene_bodega, metros_bodega, ubicacion_bodega, ubicacion_estacionamiento, numero_bodega, storage_number')
      .single();

    if (updateError) {
      console.error('❌ Update failed:', updateError.message);
      return;
    }

    console.log('✅ Update successful!');
    console.log('Updated values:');
    console.log('- tiene_bodega:', updatedProperty.tiene_bodega);
    console.log('- metros_bodega:', updatedProperty.metros_bodega);
    console.log('- ubicacion_bodega:', updatedProperty.ubicacion_bodega);
    console.log('- ubicacion_estacionamiento:', updatedProperty.ubicacion_estacionamiento);
    console.log('- numero_bodega:', updatedProperty.numero_bodega);
    console.log('- storage_number:', updatedProperty.storage_number);

    // Verify the values match what we sent
    const expected = {
      tiene_bodega: true,
      metros_bodega: 25,
      ubicacion_bodega: 'TEST - Subsuelo Nivel -2',
      ubicacion_estacionamiento: 'TEST - E-01, E-02 (Planta Baja)'
    };

    console.log('\n🔍 Verification:');
    console.log('Expected vs Actual:');
    console.log('- tiene_bodega:', expected.tiene_bodega, 'vs', updatedProperty.tiene_bodega, expected.tiene_bodega === updatedProperty.tiene_bodega ? '✅' : '❌');
    console.log('- metros_bodega:', expected.metros_bodega, 'vs', updatedProperty.metros_bodega, expected.metros_bodega === updatedProperty.metros_bodega ? '✅' : '❌');
    console.log('- ubicacion_bodega:', expected.ubicacion_bodega, 'vs', updatedProperty.ubicacion_bodega, expected.ubicacion_bodega === updatedProperty.ubicacion_bodega ? '✅' : '❌');
    console.log('- ubicacion_estacionamiento:', expected.ubicacion_estacionamiento, 'vs', updatedProperty.ubicacion_estacionamiento, expected.ubicacion_estacionamiento === updatedProperty.ubicacion_estacionamiento ? '✅' : '❌');

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

debugEditing();
