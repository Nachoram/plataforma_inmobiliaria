import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://phnkervuiijqmapgswkc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w'
);

(async () => {
  console.log('=== POPULATING CHARACTERISTICS TABLES WITH REAL DATA ===');

  try {
    // First, populate rental_owner_characteristics from rental_owners
    console.log('\n📋 Populating rental_owner_characteristics from rental_owners...');

    const { data: rentalOwners, error: ownersError } = await supabase
      .from('rental_owners')
      .select(`
        id,
        first_name,
        paternal_last_name,
        maternal_last_name,
        rut,
        email,
        phone,
        address_street,
        address_number,
        address_commune,
        rental_owner_characteristic_id
      `);

    if (ownersError) {
      console.error('❌ Error fetching rental_owners:', ownersError);
      return;
    }

    console.log(`Found ${rentalOwners.length} rental owners to process`);

    for (const owner of rentalOwners) {
      const fullName = `${owner.first_name} ${owner.paternal_last_name}${owner.maternal_last_name ? ' ' + owner.maternal_last_name : ''}`.trim();
      const address = owner.address_street && owner.address_number ?
        `${owner.address_street} ${owner.address_number}, ${owner.address_commune || ''}`.trim() :
        null;

      // Check if this owner already has a characteristic record
      const { data: existingChar, error: charCheckError } = await supabase
        .from('rental_owner_characteristics')
        .select('id')
        .eq('id', owner.rental_owner_characteristic_id)
        .maybeSingle();

      if (charCheckError && charCheckError.code !== 'PGRST116') {
        console.error(`❌ Error checking existing characteristic for owner ${owner.id}:`, charCheckError);
        continue;
      }

      if (existingChar) {
        console.log(`✅ Characteristic already exists for owner ${fullName} (${owner.rut})`);
        continue;
      }

      // Create new characteristic record
      const { data: newChar, error: insertError } = await supabase
        .from('rental_owner_characteristics')
        .insert({
          id: owner.rental_owner_characteristic_id || undefined, // Use existing ID if available
          name: fullName,
          rut: owner.rut,
          email: owner.email,
          phone: owner.phone,
          address: address
        })
        .select()
        .single();

      if (insertError) {
        console.error(`❌ Error creating characteristic for owner ${fullName}:`, insertError);
      } else {
        console.log(`✅ Created characteristic for owner ${fullName} (${owner.rut})`);

        // Update the rental_owner with the characteristic_id if it didn't have one
        if (!owner.rental_owner_characteristic_id && newChar) {
          const { error: updateError } = await supabase
            .from('rental_owners')
            .update({ rental_owner_characteristic_id: newChar.id })
            .eq('id', owner.id);

          if (updateError) {
            console.error(`❌ Error updating rental_owner with characteristic_id:`, updateError);
          }
        }
      }
    }

    // Now populate property_type_characteristics from existing property types
    console.log('\n🏠 Populating property_type_characteristics from property types...');

    // Get distinct property types from properties table
    const { data: propertyTypes, error: propTypesError } = await supabase
      .from('properties')
      .select('property_type')
      .not('property_type', 'is', null);

    if (propTypesError) {
      console.error('❌ Error fetching property types:', propTypesError);
    } else {
      const uniqueTypes = [...new Set(propertyTypes.map(p => p.property_type))];
      console.log(`Found property types: ${uniqueTypes.join(', ')}`);

      const typeDescriptions = {
        'Casa': 'Vivienda unifamiliar independiente',
        'Departamento': 'Unidad habitacional dentro de un edificio',
        'Oficina': 'Espacio destinado a actividades administrativas o comerciales',
        'Local Comercial': 'Espacio destinado a actividades comerciales',
        'Bodega': 'Espacio destinado al almacenamiento',
        'Estacionamiento': 'Espacio destinado al estacionamiento de vehículos'
      };

      for (const typeName of uniqueTypes) {
        const { data: existingType, error: typeCheckError } = await supabase
          .from('property_type_characteristics')
          .select('id')
          .eq('name', typeName)
          .maybeSingle();

        if (typeCheckError && typeCheckError.code !== 'PGRST116') {
          console.error(`❌ Error checking existing type ${typeName}:`, typeCheckError);
          continue;
        }

        if (existingType) {
          console.log(`✅ Property type already exists: ${typeName}`);
          continue;
        }

        // Create new property type characteristic
        const { error: insertTypeError } = await supabase
          .from('property_type_characteristics')
          .insert({
            name: typeName,
            description: typeDescriptions[typeName] || `Tipo de propiedad: ${typeName}`
          });

        if (insertTypeError) {
          console.error(`❌ Error creating property type ${typeName}:`, insertTypeError);
        } else {
          console.log(`✅ Created property type characteristic: ${typeName}`);
        }
      }
    }

    // Final verification
    console.log('\n🔍 Final verification...');

    const { data: finalOwnerChars, error: finalOwnerError } = await supabase
      .from('rental_owner_characteristics')
      .select('id, name, rut');

    const { data: finalPropTypes, error: finalPropError } = await supabase
      .from('property_type_characteristics')
      .select('id, name, description');

    if (finalOwnerError) {
      console.error('❌ Error verifying rental_owner_characteristics:', finalOwnerError);
    } else {
      console.log(`✅ rental_owner_characteristics: ${finalOwnerChars.length} records`);
    }

    if (finalPropError) {
      console.error('❌ Error verifying property_type_characteristics:', finalPropError);
    } else {
      console.log(`✅ property_type_characteristics: ${finalPropTypes.length} records`);
    }

    console.log('\n🎉 Characteristics tables populated successfully!');
    console.log('\nThe contract generation should now work without PGRST205 errors.');

  } catch (error) {
    console.error('❌ General error:', error);
  }
})();
