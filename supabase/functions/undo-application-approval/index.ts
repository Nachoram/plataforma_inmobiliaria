import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface UndoApprovalPayload {
  application_id: string;
  undo_reason?: string;
  undo_requested_by: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verificar método HTTP
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Crear cliente de Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parsear payload
    const payload: UndoApprovalPayload = await req.json()

    // Validar payload requerido
    if (!payload.application_id || !payload.undo_requested_by) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: application_id and undo_requested_by are required'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('🔄 [undo-application-approval] Starting undo process for application:', payload.application_id)
    console.log('👤 Requested by:', payload.undo_requested_by)

    // 1. Verificar que la aplicación existe y está en estado 'aprobada'
    const { data: application, error: fetchError } = await supabase
      .from('applications')
      .select('id, status, property_id, applicant_id')
      .eq('id', payload.application_id)
      .single()

    if (fetchError) {
      console.error('❌ Error fetching application:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Application not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (application.status !== 'aprobada') {
      console.log('⚠️ Application is not in approved state:', application.status)
      return new Response(
        JSON.stringify({
          error: 'Application is not in approved state',
          current_status: application.status
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // 2. Verificar que NO existe un contrato firmado
    const { data: contract, error: contractError } = await supabase
      .from('rental_contracts')
      .select('id, status')
      .eq('application_id', payload.application_id)
      .maybeSingle()

    if (contractError) {
      console.error('❌ Error checking contract:', contractError)
      return new Response(
        JSON.stringify({ error: 'Error checking contract status' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Si existe un contrato que no está en estado 'draft', no permitir deshacer
    if (contract && contract.status !== 'draft') {
      console.log('🚫 Contract exists and is signed:', contract.status)
      return new Response(
        JSON.stringify({
          error: 'Cannot undo approval: Contract is already signed',
          contract_status: contract.status
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // 3. Revertir el estado de la aplicación a 'pendiente'
    const { data: updatedApplication, error: updateError } = await supabase
      .from('applications')
      .update({
        status: 'pendiente',
        updated_at: new Date().toISOString(),
        // TODO: Agregar campos de auditoría cuando estén disponibles en la BD
        // undo_date: new Date().toISOString(),
        // undo_requested_by: payload.undo_requested_by,
        // undo_reason: payload.undo_reason || null,
      })
      .eq('id', payload.application_id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Error updating application status:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update application status' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // 4. Registrar evento de auditoría (si la tabla existe)
    try {
      // Verificar si existe la tabla de auditoría antes de intentar insertar
      const { error: auditCheckError } = await supabase
        .from('application_audit_log')
        .select('id')
        .limit(1);

      if (!auditCheckError) {
        // La tabla existe, registrar el evento
        const { error: auditError } = await supabase.rpc('log_application_audit', {
          p_application_id: payload.application_id,
          p_property_id: application.property_id,
          p_user_id: payload.undo_requested_by,
          p_action_type: 'undo_approval',
          p_previous_status: 'aprobada',
          p_new_status: 'pendiente',
          p_action_details: {
            reason: payload.undo_reason || 'Deshacer aprobación desde panel administrativo',
            contract_existed: !!contract,
            contract_status: contract?.status || null,
            requested_by: payload.undo_requested_by
          },
          p_notes: `Deshacer aprobación: ${payload.undo_reason || 'Solicitado desde panel administrativo'}`
        });

        if (auditError) {
          console.warn('⚠️ No se pudo registrar en auditoría:', auditError);
          // No fallar la operación principal por error de auditoría
        } else {
          console.log('✅ Evento de auditoría registrado');
        }
      }
    } catch (auditError) {
      console.warn('⚠️ Error al verificar/intentar auditoría:', auditError);
      // Continuar sin fallar la operación principal
    }

    console.log('✅ [undo-application-approval] Successfully reverted application status')
    console.log('📊 New status: pendiente')

    // 5. TODO: Enviar notificación al postulante sobre la reversión
    // await sendUndoNotification(updatedApplication, payload.undo_requested_by)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Application approval successfully undone',
        application_id: payload.application_id,
        previous_status: 'aprobada',
        new_status: 'pendiente',
        undo_requested_by: payload.undo_requested_by,
        timestamp: new Date().toISOString(),
        contract_exists: !!contract,
        contract_status: contract?.status || null
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ [undo-application-approval] Unexpected error:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
