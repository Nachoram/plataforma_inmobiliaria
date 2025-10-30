// Script para aplicar la migración de relación guarantors-properties
// Fecha: 2025-10-30

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno faltantes. Asegúrate de tener SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY configuradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🚀 Iniciando migración: Relación directa guarantors-properties');

  try {
    // =====================================================
    // STEP 1: AGREGAR COLUMNA PROPERTY_ID A GUARANTORS
    // =====================================================
    console.log('📝 Paso 1: Agregando columna property_id a guarantors...');

    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE guarantors
        ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES properties(id) ON DELETE CASCADE;
      `
    });

    if (alterError) {
      console.error('❌ Error en paso 1:', alterError);
      return;
    }

    // Agregar comentario
    await supabase.rpc('exec_sql', {
      sql: `COMMENT ON COLUMN guarantors.property_id IS 'ID de la propiedad que este garante respalda directamente';`
    });

    console.log('✅ Paso 1 completado');

    // =====================================================
    // STEP 2: ACTUALIZAR DATOS EXISTENTES
    // =====================================================
    console.log('📝 Paso 2: Actualizando datos existentes...');

    const { error: updateError } = await supabase.rpc('exec_sql', {
      sql: `
        UPDATE guarantors
        SET property_id = applications.property_id
        FROM applications
        WHERE guarantors.id = applications.guarantor_id
        AND guarantors.property_id IS NULL;
      `
    });

    if (updateError) {
      console.error('❌ Error en paso 2:', updateError);
      return;
    }

    console.log('✅ Paso 2 completado');

    // =====================================================
    // STEP 3: CREAR ÍNDICES
    // =====================================================
    console.log('📝 Paso 3: Creando índices...');

    await supabase.rpc('exec_sql', {
      sql: `CREATE INDEX IF NOT EXISTS idx_guarantors_property_id ON guarantors(property_id);`
    });

    await supabase.rpc('exec_sql', {
      sql: `CREATE INDEX IF NOT EXISTS idx_guarantors_property_created ON guarantors(property_id, created_at);`
    });

    console.log('✅ Paso 3 completado');

    // =====================================================
    // STEP 4: ACTUALIZAR POLÍTICAS RLS
    // =====================================================
    console.log('📝 Paso 4: Actualizando políticas RLS...');

    // Eliminar políticas anteriores
    await supabase.rpc('exec_sql', {
      sql: `DROP POLICY IF EXISTS "Users can view guarantors for their applications" ON guarantors;`
    });

    await supabase.rpc('exec_sql', {
      sql: `DROP POLICY IF EXISTS "Users can update guarantors for their applications" ON guarantors;`
    });

    // Crear nuevas políticas
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Property owners can view guarantors for their properties"
          ON guarantors FOR SELECT
          TO authenticated
          USING (
            property_id IN (
              SELECT id FROM properties WHERE owner_id = auth.uid()
            )
          );
      `
    });

    await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Applicants can view guarantors for their applications"
          ON guarantors FOR SELECT
          TO authenticated
          USING (
            id IN (
              SELECT guarantor_id FROM applications
              WHERE applicant_id = auth.uid()
            )
          );
      `
    });

    await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Users can insert guarantors"
          ON guarantors FOR INSERT
          TO authenticated
          WITH CHECK (true);
      `
    });

    await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Property owners can update guarantors for their properties"
          ON guarantors FOR UPDATE
          TO authenticated
          USING (
            property_id IN (
              SELECT id FROM properties WHERE owner_id = auth.uid()
            )
          )
          WITH CHECK (
            property_id IN (
              SELECT id FROM properties WHERE owner_id = auth.uid()
            )
          );
      `
    });

    await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Applicants can update guarantors for their applications"
          ON guarantors FOR UPDATE
          TO authenticated
          USING (
            id IN (
              SELECT guarantor_id FROM applications
              WHERE applicant_id = auth.uid()
            )
          );
      `
    });

    console.log('✅ Paso 4 completado');

    // =====================================================
    // STEP 5: CREAR FUNCIÓN HELPER
    // =====================================================
    console.log('📝 Paso 5: Creando función helper...');

    const { error: functionError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION get_guarantors_for_property(property_uuid uuid)
        RETURNS TABLE (
          id uuid,
          first_name text,
          paternal_last_name text,
          maternal_last_name text,
          rut varchar(12),
          profession text,
          monthly_income_clp bigint,
          address_street text,
          address_number varchar(10),
          address_department varchar(10),
          address_commune text,
          address_region text,
          created_at timestamptz,
          applications_count bigint
        ) AS $$
        BEGIN
          RETURN QUERY
          SELECT
            g.id,
            g.first_name,
            g.paternal_last_name,
            g.maternal_last_name,
            g.rut,
            g.profession,
            g.monthly_income_clp,
            g.address_street,
            g.address_number,
            g.address_department,
            g.address_commune,
            g.address_region,
            g.created_at,
            COUNT(a.id)::bigint as applications_count
          FROM guarantors g
          LEFT JOIN applications a ON g.id = a.guarantor_id
          WHERE g.property_id = property_uuid
          GROUP BY g.id, g.first_name, g.paternal_last_name, g.maternal_last_name, g.rut,
                   g.profession, g.monthly_income_clp, g.address_street, g.address_number,
                   g.address_department, g.address_commune, g.address_region, g.created_at
          ORDER BY g.created_at DESC;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    });

    if (functionError) {
      console.error('❌ Error creando función:', functionError);
      return;
    }

    // Otorgar permisos
    await supabase.rpc('exec_sql', {
      sql: `GRANT EXECUTE ON FUNCTION get_guarantors_for_property(uuid) TO authenticated;`
    });

    console.log('✅ Paso 5 completado');

    // =====================================================
    // STEP 6: ACTUALIZAR VISTA
    // =====================================================
    console.log('📝 Paso 6: Actualizando vista...');

    await supabase.rpc('exec_sql', {
      sql: `DROP VIEW IF EXISTS applications_complete_view;`
    });

    const { error: viewError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE VIEW applications_complete_view AS
        SELECT
          a.id,
          a.property_id,
          a.applicant_id,
          a.guarantor_id,
          a.status,
          a.message,
          a.created_at,
          -- Property information
          CONCAT(p.address_street, ' ', p.address_number, ', ', p.address_commune) as property_address,
          p.price_clp as property_price,
          p.listing_type,
          -- Applicant information
          CONCAT(prof.first_name, ' ', prof.paternal_last_name) as applicant_name,
          prof.email as applicant_email,
          prof.phone as applicant_phone,
          a.snapshot_applicant_profession,
          a.snapshot_applicant_monthly_income_clp,
          -- Guarantor information (ahora con property_id directo)
          g.first_name as guarantor_first_name,
          g.paternal_last_name as guarantor_last_name,
          g.rut as guarantor_rut,
          g.profession as guarantor_profession,
          g.monthly_income_clp as guarantor_income,
          g.property_id as guarantor_property_id
        FROM applications a
        LEFT JOIN properties p ON a.property_id = p.id
        LEFT JOIN profiles prof ON a.applicant_id = prof.id
        LEFT JOIN guarantors g ON a.guarantor_id = g.id;
      `
    });

    if (viewError) {
      console.error('❌ Error actualizando vista:', viewError);
      return;
    }

    console.log('✅ Paso 6 completado');

    // =====================================================
    // STEP 7: VALIDACIÓN
    // =====================================================
    console.log('📝 Paso 7: Creando validación...');

    const { error: triggerFunctionError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION validate_guarantor_property_consistency()
        RETURNS TRIGGER AS $$
        BEGIN
          -- Si se está insertando/actualizando una application con guarantor_id
          IF NEW.guarantor_id IS NOT NULL THEN
            -- Verificar que el guarantor pertenezca a la misma propiedad
            IF NOT EXISTS (
              SELECT 1 FROM guarantors
              WHERE id = NEW.guarantor_id
              AND property_id = NEW.property_id
            ) THEN
              RAISE EXCEPTION 'El garante debe pertenecer a la misma propiedad de la postulación';
            END IF;
          END IF;

          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `
    });

    if (triggerFunctionError) {
      console.error('❌ Error creando función de validación:', triggerFunctionError);
      return;
    }

    await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE TRIGGER validate_guarantor_application_consistency
          BEFORE INSERT OR UPDATE ON applications
          FOR EACH ROW
          EXECUTE FUNCTION validate_guarantor_property_consistency();
      `
    });

    console.log('✅ Paso 7 completado');

    // =====================================================
    // STEP 8: COMENTARIOS
    // =====================================================
    console.log('📝 Paso 8: Actualizando comentarios...');

    await supabase.rpc('exec_sql', {
      sql: `COMMENT ON TABLE guarantors IS 'Garante/co-signer information linked directly to properties and applications';`
    });

    await supabase.rpc('exec_sql', {
      sql: `COMMENT ON COLUMN guarantors.property_id IS 'Direct reference to the property this guarantor supports';`
    });

    await supabase.rpc('exec_sql', {
      sql: `COMMENT ON FUNCTION get_guarantors_for_property(uuid) IS 'Obtiene todos los garantes asociados a una propiedad específica junto con el conteo de postulaciones';`
    });

    console.log('✅ Paso 8 completado');

    // =====================================================
    // VERIFICACIÓN
    // =====================================================
    console.log('🔍 Verificando migración...');

    // Verificar que la columna existe
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'guarantors')
      .eq('column_name', 'property_id');

    if (columnsError) {
      console.error('❌ Error verificando columnas:', columnsError);
      return;
    }

    if (columns.length === 0) {
      console.error('❌ La columna property_id no fue creada correctamente');
      return;
    }

    // Verificar que la función existe
    const { data: functions, error: functionsError } = await supabase
      .from('information_schema.routines')
      .select('routine_name')
      .eq('routine_name', 'get_guarantors_for_property');

    if (functionsError) {
      console.error('❌ Error verificando funciones:', functionsError);
      return;
    }

    console.log('🎉 Migración completada exitosamente!');
    console.log('');
    console.log('📋 Resumen de cambios:');
    console.log('✅ Nueva columna: guarantors.property_id');
    console.log('✅ Nuevos índices para optimización');
    console.log('✅ Políticas RLS actualizadas');
    console.log('✅ Nueva función: get_guarantors_for_property(uuid)');
    console.log('✅ Vista actualizada: applications_complete_view');
    console.log('✅ Validación de consistencia implementada');
    console.log('');
    console.log('🔗 Ahora los guarantors están ligados directamente con properties');
    console.log('🔗 y el UUID correspondiente está ligado con la postulación correspondiente.');

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  }
}

// Ejecutar la migración
applyMigration();
