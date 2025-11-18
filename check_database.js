const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  try {
    console.log('🔍 Verificando conexión a Supabase...');

    // Verificar conexión básica
    const { data: connectionTest, error: connectionError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (connectionError) {
      console.error('❌ Error de conexión:', connectionError);
      return;
    }

    console.log('✅ Conexión exitosa');

    // Verificar si existe la función RPC
    console.log('🔍 Verificando función RPC get_portfolio_with_postulations...');
    const { data: rpcTest, error: rpcError } = await supabase.rpc('get_portfolio_with_postulations', {
      user_id_param: '00000000-0000-0000-0000-000000000000'
    });

    if (rpcError) {
      console.error('❌ Error en función RPC:', rpcError);
    } else {
      console.log('✅ Función RPC existe y funciona');
      console.log('📊 Tipo de resultado:', typeof rpcTest);
      console.log('📊 Longitud del resultado:', Array.isArray(rpcTest) ? rpcTest.length : 'No es array');
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

checkDatabase();
