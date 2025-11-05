// Apply legal entity migration to rental_owners table
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://phnkervuiijqmapgswkc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBobmtlcnZ1aWlqcW1hcGdzd2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNzQ2MjUsImV4cCI6MjA3MjY1MDYyNX0.va6jOCJN6MnbHSbbDFJaO2rN_3oCSVQlaYaPkPmXS2w';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    console.log('🚀 Applying legal entity fields migration...');

    // Read the migration file
    const migrationSQL = fs.readFileSync('migration_to_apply.sql', 'utf8');

    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📄 Executing ${statements.length} SQL statements...`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });

        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error);
          // Continue with other statements
        }
      }
    }

    console.log('✅ Migration completed!');

    // Verify the changes
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'rental_owners')
      .in('column_name', ['owner_type', 'constitution_type', 'constitution_date', 'cve_code', 'notary_name', 'repertory_number']);

    if (columnsError) {
      console.error('❌ Error verifying columns:', columnsError);
    } else {
      console.log('📋 New columns found:', columns.map(c => c.column_name));
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

applyMigration();


