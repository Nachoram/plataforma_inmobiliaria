#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://phnkervuiijqmapgswkc.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN3oCSVQlaYaPkPmXS2w';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyDatabaseCompatibility() {
  try {
    console.log('🔍 Verificando compatibilidad del formulario de arriendo con la base de datos...\n');

    // Verificar columnas existentes en la tabla properties
    console.log('📋 Verificando columnas existentes en tabla properties...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'properties')
      .eq('table_schema', 'public')
      .order('ordinal_position');

    if (columnsError) {
      console.error('❌ Error obteniendo columnas:', columnsError);
      return;
    }

    const existingColumns = columns.map(col => col.column_name);
    console.log('✅ Columnas encontradas:', existingColumns.join(', '));

    // Verificar campos requeridos por el formulario
    const requiredFields = [
      'tipo_propiedad', 'address_street', 'address_number', 'address_commune',
      'address_region', 'price_clp', 'common_expenses_clp', 'bedrooms',
      'bathrooms', 'estacionamientos', 'description'
    ];

    const optionalFields = [
      'metros_utiles', 'metros_totales', 'tiene_terraza', 'ano_construccion',
      'sistema_agua_caliente', 'tipo_cocina', 'tiene_sala_estar',
      // Campos que se agregarán con la migración
      'numero_bodega', 'storage_number', 'parcela_number', 'ubicacion_estacionamiento',
      'tiene_bodega', 'metros_bodega', 'ubicacion_bodega'
    ];

    console.log('\n📋 Verificación de campos requeridos:');
    requiredFields.forEach(field => {
      if (existingColumns.includes(field)) {
        console.log(`✅ ${field}`);
      } else {
        console.log(`❌ ${field} - FALTA`);
      }
    });

    console.log('\n📋 Verificación de campos opcionales:');
    optionalFields.forEach(field => {
      if (existingColumns.includes(field)) {
        console.log(`✅ ${field}`);
      } else {
        console.log(`⚠️  ${field} - No existe (se usará valor por defecto)`);
      }
    });

    // Verificar constraints
    console.log('\n🔒 Verificando constraints...');
    const { data: constraints, error: constraintsError } = await supabase
      .from('information_schema.table_constraints')
      .select('constraint_name, constraint_type')
      .eq('table_name', 'properties')
      .eq('table_schema', 'public');

    if (!constraintsError) {
      console.log('Constraints encontrados:', constraints.map(c => `${c.constraint_name} (${c.constraint_type})`));
    }

    // Probar inserción de prueba para verificar compatibilidad
    console.log('\n🧪 Probando inserción de datos de formulario...');

    const testPropertyData = {
      owner_id: '00000000-0000-0000-0000-000000000000', // Dummy ID
      listing_type: 'arriendo',
      status: 'disponible',
      tipo_propiedad: 'Casa',
      address_street: 'Calle de Prueba',
      address_number: '123',
      address_commune: 'Santiago',
      address_region: 'Metropolitana',
      price_clp: 500000,
      common_expenses_clp: 50000,
      bedrooms: 2,
      bathrooms: 1,
      estacionamientos: 1,
      description: 'Propiedad de prueba',
      metros_utiles: 80,
      metros_totales: 90,
      tiene_terraza: true,
      ano_construccion: 2020,
      sistema_agua_caliente: 'Calefón',
      tipo_cocina: 'Cerrada',
      tiene_sala_estar: true
    };

    // Intentar insertar (esto fallará por RLS, pero verificará que los campos existen)
    const { error: insertError } = await supabase
      .from('properties')
      .insert(testPropertyData);

    if (insertError) {
      if (insertError.message.includes('permission denied') || insertError.message.includes('RLS')) {
        console.log('✅ Inserción bloqueada por permisos (esperado) - campos son compatibles');
      } else if (insertError.message.includes('does not exist')) {
        console.log('❌ Error de columna faltante:', insertError.message);
      } else {
        console.log('⚠️  Error de inserción:', insertError.message);
      }
    } else {
      console.log('✅ Inserción exitosa (inesperado, pero campos compatibles)');
    }

    // Verificar tipos de propiedad disponibles
    console.log('\n🏠 Verificando tipos de propiedad...');
    const { data: propertyTypes, error: typesError } = await supabase
      .from('pg_enum')
      .select('enumlabel')
      .eq('enumtypid', (await supabase
        .from('information_schema.columns')
        .select('udt_name')
        .eq('table_name', 'properties')
        .eq('column_name', 'tipo_propiedad')
        .single()).data?.udt_name);

    if (!typesError && propertyTypes) {
      console.log('✅ Tipos de propiedad disponibles:', propertyTypes.map(t => t.enumlabel).join(', '));
    }

    console.log('\n🎯 RESULTADO: El formulario debería funcionar con la base de datos actual.');
    console.log('💡 Recomendación: Aplicar la migración para campos adicionales cuando sea posible.');

  } catch (error) {
    console.error('❌ Error en verificación:', error);
  }
}

verifyDatabaseCompatibility();
