import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('🚀 Applying property type enum migration...');

    // Create the enum type
    const { error: enumError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$ BEGIN
          CREATE TYPE IF NOT EXISTS tipo_propiedad_enum AS ENUM ('Casa', 'Departamento', 'Oficina');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `
    });

    if (enumError) {
      console.error('❌ Error creating enum:', enumError);
      return;
    }

    // Add the column if it doesn't exist
    const { error: columnError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.properties
        ADD COLUMN IF NOT EXISTS tipo_propiedad tipo_propiedad_enum;
      `
    });

    if (columnError) {
      console.error('❌ Error adding column:', columnError);
      return;
    }

    console.log('✅ Migration applied successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

applyMigration();
