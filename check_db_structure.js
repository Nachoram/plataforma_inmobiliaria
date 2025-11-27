import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://phnkervuiijqmapgswkc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDatabaseStructure() {
  console.log('🔍 Verificando estructura de la base de datos...\n');

  // Verificar columnas de properties
  console.log('📋 Columnas de la tabla properties:');
  const { data: propertyColumns, error: propError } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type, is_nullable')
    .eq('table_schema', 'public')
    .eq('table_name', 'properties')
    .order('ordinal_position');

  if (propError) {
    console.error('❌ Error obteniendo columnas de properties:', propError.message);
  } else {
    propertyColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(required)'}`);
    });
  }

  console.log('\n📋 Columnas de la tabla property_sale_offers:');
  const { data: offerColumns, error: offerError } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type, is_nullable')
    .eq('table_schema', 'public')
    .eq('table_name', 'property_sale_offers')
    .order('ordinal_position');

  if (offerError) {
    console.error('❌ Error obteniendo columnas de property_sale_offers:', offerError.message);
  } else {
    offerColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(required)'}`);
    });
  }

  console.log('\n📋 Columnas de la tabla profiles:');
  const { data: profileColumns, error: profileError } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type, is_nullable')
    .eq('table_schema', 'public')
    .eq('table_name', 'profiles')
    .order('ordinal_position');

  if (profileError) {
    console.error('❌ Error obteniendo columnas de profiles:', profileError.message);
  } else {
    profileColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(required)'}`);
    });
  }

  // Verificar datos existentes
  console.log('\n📊 Datos existentes:');
  const { data: properties, error: propDataError } = await supabase
    .from('properties')
    .select('*')
    .limit(1);

  if (propDataError) {
    console.log('❌ Error consultando properties:', propDataError.message);
  } else {
    console.log(`  - Properties: ${properties?.length || 0} registros`);
  }

  const { data: offers, error: offerDataError } = await supabase
    .from('property_sale_offers')
    .select('*')
    .limit(1);

  if (offerDataError) {
    console.log('❌ Error consultando property_sale_offers:', offerDataError.message);
  } else {
    console.log(`  - Property Sale Offers: ${offers?.length || 0} registros`);
  }

  const { data: profiles, error: profileDataError } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);

  if (profileDataError) {
    console.log('❌ Error consultando profiles:', profileDataError.message);
  } else {
    console.log(`  - Profiles: ${profiles?.length || 0} registros`);
  }
}

checkDatabaseStructure();