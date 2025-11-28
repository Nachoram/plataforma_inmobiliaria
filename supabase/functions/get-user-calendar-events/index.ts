import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  all_day: boolean;
  event_type: string;
  priority: string;
  status: string;
  related_entity_type: string;
  related_entity_id: string;
  location: string;
  color: string;
  created_at: string;
  updated_at: string;
}

serve(async (req: Request) => {
  const { method } = req;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle CORS preflight requests
  if (method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Solo permitir POST
  if (method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // Crear cliente de Supabase con service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Obtener el usuario autenticado
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Crear la función SQL si no existe
    const createFunctionSQL = `
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

        -- =====================================================
        -- EVENTOS DE PLAZOS DE OFERTAS (deadline_date)
        -- =====================================================
        RETURN QUERY
        SELECT
          'offer-deadline-' || pso.id::TEXT as id,
          'Plazo oferta: ' || COALESCE(p.title, 'Propiedad') as title,
          CASE
            WHEN pso.buyer_name IS NOT NULL
            THEN 'Oferta de ' || pso.buyer_name || ' vence el ' ||
                 to_char(pso.deadline_date, 'DD/MM/YYYY') ||
                 ' - $' || COALESCE(pso.offer_amount::TEXT, 'N/A')
            ELSE 'Oferta vence el ' || to_char(pso.deadline_date, 'DD/MM/YYYY') ||
                 ' - $' || COALESCE(pso.offer_amount::TEXT, 'N/A')
          END as description,
          pso.deadline_date::TIMESTAMPTZ as start_date,
          pso.deadline_date::TIMESTAMPTZ + INTERVAL '23 hours 59 minutes' as end_date,
          true as all_day,
          'deadline'::TEXT as event_type,
          CASE
            WHEN pso.deadline_date <= CURRENT_DATE + INTERVAL '3 days' THEN 'urgent'
            WHEN pso.deadline_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'high'
            ELSE 'normal'
          END as priority,
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
          '#EF4444'::TEXT as color,
          pso.created_at,
          pso.updated_at
        FROM property_sale_offers pso
        JOIN properties p ON pso.property_id = p.id
        WHERE p.owner_id = user_id
        AND pso.deadline_date IS NOT NULL
        AND pso.status IN ('pendiente', 'en_revision', 'info_solicitada', 'contraoferta')
        AND pso.deadline_date >= CURRENT_DATE;

      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    // Ejecutar SQL para crear la función
    const { error: createFunctionError } = await supabaseClient.rpc('exec_sql', {
      sql: createFunctionSQL
    });

    if (createFunctionError) {
      console.error('Error creating function:', createFunctionError);
      // Si la función rpc no existe, intentar ejecutar SQL directamente
      try {
        const { error: directError } = await supabaseClient
          .from('pg_proc')
          .select('*')
          .limit(1);

        if (directError) {
          return new Response(
            JSON.stringify({
              error: 'Database connection issue',
              details: 'Function may need to be created manually in Supabase Dashboard'
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (directQueryError) {
        console.log('Direct query failed, function may already exist');
      }
    }

    // Llamar a la función para obtener eventos
    const { data: events, error: functionError } = await supabaseClient
      .rpc('get_user_calendar_events', { user_id: user.id });

    if (functionError) {
      console.error('Error calling function:', functionError);
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch calendar events',
          details: functionError.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Transformar eventos para el frontend
    const transformedEvents: CalendarEvent[] = (events || []).map((event: any) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      startDate: event.start_date,
      endDate: event.end_date,
      allDay: event.all_day,
      eventType: event.event_type,
      priority: event.priority,
      status: event.status,
      relatedEntityType: event.related_entity_type,
      relatedEntityId: event.related_entity_id,
      location: event.location,
      color: event.color,
      createdAt: event.created_at,
      updatedAt: event.updated_at
    }));

    console.log(`📅 Found ${transformedEvents.length} calendar events for user ${user.id}`);

    return new Response(
      JSON.stringify({
        events: transformedEvents,
        total: transformedEvents.length,
        userId: user.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
