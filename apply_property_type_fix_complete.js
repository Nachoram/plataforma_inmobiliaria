import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyFix() {
  console.log('🔧 Applying complete property_type fix...');

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'fix_property_type_issue_complete.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split into individual statements (basic approach)
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📋 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });

        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error);
          // Continue with other statements
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      }
    }

    console.log('🎉 Property type fix completed!');
    console.log('🔄 Please refresh your application to test the fix.');

  } catch (error) {
    console.error('❌ Error applying fix:', error);
    process.exit(1);
  }
}

// Alternative approach: execute the entire SQL as one query
async function applyFixAlternative() {
  console.log('🔧 Applying complete property_type fix (alternative method)...');

  try {
    const sqlPath = path.join(__dirname, 'fix_property_type_issue_complete.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Remove comments and clean up
    const cleanSql = sql
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n')
      .replace(/\s+/g, ' ')
      .trim();

    console.log('📋 Executing complete SQL fix...');

    // Try to execute as raw SQL using the REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      },
      body: JSON.stringify({ sql: cleanSql })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Fix applied successfully:', result);

  } catch (error) {
    console.error('❌ Error with alternative method:', error);
    console.log('🔄 Falling back to manual application...');
    console.log('📋 Please copy and paste the contents of fix_property_type_issue_complete.sql into your Supabase SQL Editor');
  }
}

// Run the fix
applyFixAlternative();
