import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://phnkervuiijqmapgswkc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w'
);

(async () => {
  console.log('=== APPLYING GUARANTORS MIGRATION ===');

  // SQL statements to execute
  const sqlStatements = [
    // PASO 1: Agregar nuevas columnas si no existen
    `ALTER TABLE guarantors
     ADD COLUMN IF NOT EXISTS full_name text,
     ADD COLUMN IF NOT EXISTS contact_email text,
     ADD COLUMN IF NOT EXISTS contact_phone text,
     ADD COLUMN IF NOT EXISTS company text,
     ADD COLUMN IF NOT EXISTS monthly_income numeric,
     ADD COLUMN IF NOT EXISTS work_seniority_years integer,
     ADD COLUMN IF NOT EXISTS address_id uuid,
     ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now()`,

    // PASO 2: Migrar datos (simplified - just set defaults since table is empty)
    `UPDATE guarantors SET full_name = 'Migrated Name' WHERE full_name IS NULL`,
    `UPDATE guarantors SET contact_email = 'migrated@example.com' WHERE contact_email IS NULL`,

    // PASO 3: Hacer NOT NULL las columnas críticas
    `ALTER TABLE guarantors ALTER COLUMN full_name SET NOT NULL`,
    `ALTER TABLE guarantors ALTER COLUMN contact_email SET NOT NULL`,

    // PASO 4: Crear índices
    `CREATE INDEX IF NOT EXISTS idx_guarantors_contact_email ON guarantors(contact_email)`,
    `CREATE INDEX IF NOT EXISTS idx_guarantors_rut ON guarantors(rut)`,

    // PASO 5: Agregar trigger (simplified)
    `CREATE OR REPLACE FUNCTION update_guarantors_updated_at()
     RETURNS TRIGGER AS $$
     BEGIN
       NEW.updated_at = now();
       RETURN NEW;
     END;
     $$ LANGUAGE plpgsql`,

    `DROP TRIGGER IF EXISTS guarantors_updated_at_trigger ON guarantors`,
    `CREATE TRIGGER guarantors_updated_at_trigger
       BEFORE UPDATE ON guarantors
       FOR EACH ROW
       EXECUTE FUNCTION update_guarantors_updated_at()`,

    // PASO 6: Agregar comentarios
    `COMMENT ON COLUMN guarantors.full_name IS 'Nombre completo del garante'`,
    `COMMENT ON COLUMN guarantors.contact_email IS 'Email de contacto del garante'`,
    `COMMENT ON COLUMN guarantors.contact_phone IS 'Teléfono de contacto del garante'`,
    `COMMENT ON COLUMN guarantors.company IS 'Empresa donde trabaja el garante'`,
    `COMMENT ON COLUMN guarantors.monthly_income IS 'Ingreso mensual del garante'`,
    `COMMENT ON COLUMN guarantors.work_seniority_years IS 'Años de antigüedad laboral'`
  ];

  for (let i = 0; i < sqlStatements.length; i++) {
    const sql = sqlStatements[i];
    console.log(`\n--- Executing statement ${i + 1}/${sqlStatements.length} ---`);
    console.log(sql.substring(0, 100) + (sql.length > 100 ? '...' : ''));

    try {
      // Try to execute via RPC first
      const { data, error } = await supabase.rpc('exec_sql', { sql });

      if (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error);
        // Don't stop on error, continue with other statements
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`);
      }
    } catch (err) {
      console.error(`❌ Exception executing statement ${i + 1}:`, err);
    }
  }

  // Verify the migration worked
  console.log('\n=== VERIFYING MIGRATION ===');
  const { data: verifyData, error: verifyError } = await supabase
    .from('guarantors')
    .select('full_name, contact_email, contact_phone, rut')
    .limit(1);

  if (verifyError) {
    console.error('❌ Error verifying migration:', verifyError);
  } else {
    console.log('✅ Verification successful. Columns exist.');
  }
})();
