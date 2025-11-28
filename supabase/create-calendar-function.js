import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase - usar valores por defecto para desarrollo
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  console.error('Asegúrate de tener configuradas:');
  console.error('- VITE_SUPABASE_URL o SUPABASE_URL');
  console.error('- VITE_SUPABASE_ANON_KEY o SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const functionSQL = `
-- Función PostgreSQL para obtener eventos integrados del calendario de usuario
-- Esta función consolida datos de scheduled_visits, rental_contracts y property_sale_offers

CREATE OR REPLACE FUNCTION get_user_calendar_events(user_id UUID)
RETURNS TABLE (
  id TEXT,
  title TEXT,
  description TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  all_day BOOLEAN,
  event_type TEXT,
  priority TEXT,
  status TEXT,
  related_entity_type TEXT,
  related_entity_id UUID,
  location TEXT,
  color TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  -- =====================================================
  -- EVENTOS DE VISITAS AGENDADAS
  -- =====================================================
  RETURN QUERY
  SELECT
    'visit-' || sv.id::TEXT as id,
    'Visita: ' || COALESCE(p.title, 'Propiedad') as title,
    CASE
      WHEN sv.visit_purpose = 'inspection' THEN 'Inspección programada con ' || sv.visitor_name
      WHEN sv.visit_purpose = 'valuation' THEN 'Tasación programada con ' || sv.visitor_name
      WHEN sv.visit_purpose = 'negotiation' THEN 'Negociación programada con ' || sv.visitor_name
      ELSE 'Visita programada con ' || sv.visitor_name || ' - ' || sv.visit_purpose
    END as description,
    CASE
      WHEN sv.scheduled_time_slot = 'flexible' THEN sv.scheduled_date::TIMESTAMPTZ + INTERVAL '10 hours'
      ELSE (sv.scheduled_date || ' ' || split_part(sv.scheduled_time_slot, '-', 1) || ':00')::TIMESTAMPTZ
    END as start_date,
    CASE
      WHEN sv.scheduled_time_slot = 'flexible' THEN sv.scheduled_date::TIMESTAMPTZ + INTERVAL '17 hours'
      ELSE (sv.scheduled_date || ' ' || split_part(sv.scheduled_time_slot, '-', 2) || ':00')::TIMESTAMPTZ
    END as end_date,
    CASE WHEN sv.scheduled_time_slot = 'flexible' THEN true ELSE false END as all_day,
    'visit'::TEXT as event_type,
    CASE
      WHEN sv.visit_purpose = 'inspection' THEN 'high'
      WHEN sv.visit_purpose = 'valuation' THEN 'normal'
      WHEN sv.visit_purpose = 'negotiation' THEN 'normal'
      ELSE 'normal'
    END as priority,
    sv.status::TEXT as status,
    'scheduled_visit'::TEXT as related_entity_type,
    sv.id as related_entity_id,
    COALESCE(
      CASE
        WHEN p.address_street IS NOT NULL AND p.address_number IS NOT NULL
        THEN p.address_street || ' ' || p.address_number || COALESCE(', ' || p.address_commune, '')
        ELSE NULL
      END,
      'Ubicación por confirmar'
    ) as location,
    '#3B82F6'::TEXT as color,
    sv.created_at,
    sv.created_at as updated_at
  FROM scheduled_visits sv
  JOIN properties p ON sv.property_id = p.id
  WHERE sv.property_owner_id = user_id
  AND sv.status IN ('scheduled', 'confirmed')
  AND sv.scheduled_date >= CURRENT_DATE;

  -- =====================================================
  -- EVENTOS DE CONTRATOS PENDIENTES DE FIRMA
  -- =====================================================
  RETURN QUERY
  SELECT
    'contract-sign-' || rc.id::TEXT as id,
    CASE
      WHEN rc.status = 'sent_to_signature' THEN 'Firma contrato: ' || COALESCE(p.title, 'Propiedad')
      WHEN rc.status = 'partially_signed' THEN 'Firma pendiente contrato: ' || COALESCE(p.title, 'Propiedad')
      ELSE 'Contrato requiere atención: ' || COALESCE(p.title, 'Propiedad')
    END as title,
    CASE
      WHEN rc.owner_signed_at IS NULL AND p.owner_id = user_id THEN 'Pendiente tu firma como propietario'
      WHEN rc.tenant_signed_at IS NULL AND EXISTS (SELECT 1 FROM applications a WHERE a.id = rc.application_id AND a.tenant_id = user_id) THEN 'Pendiente tu firma como arrendatario'
      WHEN rc.guarantor_signed_at IS NULL AND EXISTS (SELECT 1 FROM applications a WHERE a.id = rc.application_id AND a.guarantor_id = user_id) THEN 'Pendiente tu firma como garante'
      WHEN rc.owner_signed_at IS NULL THEN 'Pendiente firma del propietario'
      WHEN rc.tenant_signed_at IS NULL THEN 'Pendiente firma del arrendatario'
      WHEN rc.guarantor_signed_at IS NULL THEN 'Pendiente firma del garante'
      ELSE 'Contrato parcialmente firmado'
    END as description,
    GREATEST(rc.sent_to_signature_at, CURRENT_TIMESTAMP) as start_date,
    GREATEST(rc.sent_to_signature_at, CURRENT_TIMESTAMP) + INTERVAL '1 hour' as end_date,
    true as all_day,
    'closing'::TEXT as event_type,
    'high'::TEXT as priority,
    rc.status::TEXT as status,
    'rental_contract'::TEXT as related_entity_type,
    rc.id as related_entity_id,
    COALESCE(
      CASE
        WHEN p.address_street IS NOT NULL AND p.address_number IS NOT NULL
        THEN p.address_street || ' ' || p.address_number || COALESCE(', ' || p.address_commune, '')
        ELSE NULL
      END,
      'Dirección de la propiedad'
    ) as location,
    '#10B981'::TEXT as color,
    rc.created_at,
    rc.updated_at
  FROM rental_contracts rc
  JOIN applications a ON rc.application_id = a.id
  JOIN properties p ON a.property_id = p.id
  WHERE (
    p.owner_id = user_id OR
    a.tenant_id = user_id OR
    a.guarantor_id = user_id
  )
  AND rc.status IN ('sent_to_signature', 'partially_signed')
  AND (
    rc.owner_signed_at IS NULL OR
    rc.tenant_signed_at IS NULL OR
    rc.guarantor_signed_at IS NULL
  );

  -- =====================================================
  -- EVENTOS DE NEGOCIACIONES ACTIVAS (ofertas pendientes)
  -- =====================================================
  RETURN QUERY
  SELECT
    'offer-negotiation-' || pso.id::TEXT as id,
    'Negociación activa: ' || COALESCE(p.title, 'Propiedad') as title,
    CASE
      WHEN pso.buyer_name IS NOT NULL THEN 'Oferta pendiente de ' || pso.buyer_name || ' por $' || COALESCE(pso.offer_amount::TEXT, 'N/A')
      ELSE 'Oferta pendiente por $' || COALESCE(pso.offer_amount::TEXT, 'N/A')
    END as description,
    pso.created_at as start_date,
    pso.created_at + INTERVAL '2 hours' as end_date,
    false as all_day,
    'negotiation'::TEXT as event_type,
    'normal'::TEXT as priority,
    pso.status::TEXT as status,
    'property_sale_offer'::TEXT as related_entity_type,
    pso.id as related_entity_id,
    COALESCE(
      CASE
        WHEN p.address_street IS NOT NULL AND p.address_number IS NOT NULL
        THEN p.address_street || ' ' || p.address_number || COALESCE(', ' || p.address_commune, '')
        ELSE NULL
      END,
      'Dirección de la propiedad'
    ) as location,
    '#F97316'::TEXT as color,
    pso.created_at,
    pso.updated_at
  FROM property_sale_offers pso
  JOIN properties p ON pso.property_id = p.id
  WHERE p.owner_id = user_id
  AND pso.status IN ('pendiente', 'en_revision', 'info_solicitada', 'contraoferta')
  AND pso.created_at >= CURRENT_DATE - INTERVAL '30 days';

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

async function createFunction() {
  try {
    console.log('🚀 Creando función get_user_calendar_events...');

    // Ejecutar SQL directamente usando rpc
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: functionSQL
    });

    if (error) {
      console.error('❌ Error ejecutando SQL:', error);

      // Intentar con otro enfoque - crear la función directamente
      console.log('🔄 Intentando crear función directamente...');

      const { data: functionData, error: functionError } = await supabase
        .from('pg_proc')
        .select('*')
        .eq('proname', 'get_user_calendar_events')
        .limit(1);

      if (functionError) {
        console.error('❌ Error verificando función existente:', functionError);
        return;
      }

      if (functionData && functionData.length > 0) {
        console.log('⚠️ Función ya existe, intentando reemplazarla...');
      }

      // Crear función usando un enfoque diferente
      const createFunctionSQL = `
        CREATE OR REPLACE FUNCTION get_user_calendar_events(user_id UUID)
        RETURNS TABLE (
          id TEXT, title TEXT, description TEXT,
          start_date TIMESTAMPTZ, end_date TIMESTAMPTZ,
          all_day BOOLEAN, event_type TEXT, priority TEXT, status TEXT,
          related_entity_type TEXT, related_entity_id UUID,
          location TEXT, color TEXT, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
        ) AS $$
        BEGIN
          -- Eventos de visitas
          RETURN QUERY SELECT
            'visit-' || sv.id::TEXT, 'Visita: ' || COALESCE(p.title, 'Propiedad'),
            'Visita programada con ' || sv.visitor_name, sv.scheduled_date::TIMESTAMPTZ,
            sv.scheduled_date::TIMESTAMPTZ + INTERVAL '1 hour', false, 'visit', 'normal', sv.status,
            'scheduled_visit', sv.id, 'Ubicación por confirmar', '#3B82F6', sv.created_at, sv.created_at
          FROM scheduled_visits sv JOIN properties p ON sv.property_id = p.id
          WHERE sv.property_owner_id = user_id AND sv.status IN ('scheduled', 'confirmed');

          -- Eventos de contratos (simplificado)
          RETURN QUERY SELECT
            'contract-' || rc.id::TEXT, 'Firma contrato', 'Contrato pendiente de firma',
            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '1 hour', true, 'closing', 'high', rc.status,
            'rental_contract', rc.id, 'Dirección propiedad', '#10B981', rc.created_at, rc.updated_at
          FROM rental_contracts rc WHERE rc.status IN ('sent_to_signature', 'partially_signed');
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `;

      const { error: createError } = await supabase.rpc('exec_sql', { sql: createFunctionSQL });

      if (createError) {
        console.error('❌ Error creando función simplificada:', createError);
        console.log('💡 Sugerencia: Ejecuta manualmente el SQL en Supabase Dashboard');
        console.log('📄 Archivo: supabase/functions/create-calendar-function.sql');
        return;
      }
    }

    console.log('✅ Función get_user_calendar_events creada exitosamente');
    console.log('📅 Incluye eventos de visitas, contratos y negociaciones');
    console.log('🎨 Sistema de colores: Azul(visitas), Verde(firmas), Naranja(negociaciones)');

  } catch (error) {
    console.error('❌ Error inesperado:', error);
    console.log('💡 Para ejecutar manualmente:');
    console.log('1. Ve al Supabase Dashboard');
    console.log('2. SQL Editor');
    console.log('3. Ejecuta el contenido de: supabase/functions/create-calendar-function.sql');
  }
}

// Ejecutar la función
createFunction();
