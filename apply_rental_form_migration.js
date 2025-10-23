#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://phnkervuiijqmapgswkc.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN3oCSVQlaYaPkPmXS2w';

// Crear cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    console.log('🚀 Aplicando migración de formulario de arriendo...');

    // Leer el archivo de migración
    const migrationPath = join(__dirname, 'supabase', 'migrations', '20251025_fix_rental_publication_form_inconsistencies.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('📄 Migración cargada, ejecutando...');

    // Ejecutar la migración usando rpc (función SQL)
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      console.error('❌ Error ejecutando migración:', error);

      // Si rpc no funciona, intentar ejecutar consultas individuales
      console.log('🔄 Intentando ejecutar consultas individuales...');

      // Dividir la migración en sentencias individuales
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (const statement of statements) {
        if (statement.trim()) {
          console.log('⚡ Ejecutando:', statement.substring(0, 50) + '...');

          const { error: stmtError } = await supabase.rpc('exec_sql', {
            sql: statement + ';'
          });

          if (stmtError) {
            console.error('❌ Error en statement:', stmtError);
            // Continuar con el siguiente statement
          } else {
            console.log('✅ Statement ejecutado correctamente');
          }
        }
      }
    } else {
      console.log('✅ Migración aplicada exitosamente:', data);
    }

    // Verificar que las columnas se crearon
    console.log('🔍 Verificando columnas creadas...');

    const columnsToCheck = [
      'numero_bodega', 'storage_number', 'metros_bodega',
      'ubicacion_bodega', 'ubicacion_estacionamiento', 'tiene_bodega'
    ];

    for (const column of columnsToCheck) {
      const { data: columnData, error: columnError } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_name', 'properties')
        .eq('column_name', column)
        .single();

      if (columnError) {
        console.log(`❌ Columna ${column} no encontrada`);
      } else {
        console.log(`✅ Columna ${column} creada correctamente`);
      }
    }

  } catch (error) {
    console.error('❌ Error general:', error);

    // Alternativa: intentar crear las tablas usando el cliente normal
    console.log('🔄 Intentando método alternativo con consultas directas...');

    try {
      // Verificar si podemos hacer consultas básicas
      const { data: testData, error: testError } = await supabase
        .from('properties')
        .select('id')
        .limit(1);

      if (testError) {
        console.error('❌ No se puede acceder a la tabla properties:', testError);
        return;
      }

      console.log('✅ Conexión a Supabase OK');

    } catch (altError) {
      console.error('❌ Método alternativo también falló:', altError);
    }
  }
}

// Ejecutar la migración
applyMigration();
