import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed. Use POST.' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body
    const { contract_id, action, notes } = await req.json();

    if (!contract_id || !action) {
      return new Response(
        JSON.stringify({ error: 'contract_id and action are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate action
    const validActions = ['cancel', 'approve', 'send_to_signature'];
    if (!validActions.includes(action)) {
      return new Response(
        JSON.stringify({ error: `Invalid action. Must be one of: ${validActions.join(', ')}` }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create Supabase client with user authentication
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header is required' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Set the auth token
    supabase.auth.setAuth(authHeader.replace('Bearer ', ''));

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get contract and verify ownership
    const { data: contract, error: contractError } = await supabase
      .from('rental_contracts')
      .select(`
        id,
        status,
        applications (
          properties (
            owner_id
          )
        )
      `)
      .eq('id', contract_id)
      .single();

    if (contractError || !contract) {
      return new Response(
        JSON.stringify({ error: 'Contract not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if user is the property owner
    const isOwner = contract.applications.properties.owner_id === user.id;
    if (!isOwner) {
      return new Response(
        JSON.stringify({ error: 'Access denied. Only property owners can update contract status.' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate status transitions
    const currentStatus = contract.status;
    let newStatus: string;
    let updateData: any = {};

    switch (action) {
      case 'cancel':
        if (currentStatus === 'fully_signed') {
          return new Response(
            JSON.stringify({ error: 'Cannot cancel a fully signed contract' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
        newStatus = 'cancelled';
        break;

      case 'approve':
        if (currentStatus !== 'draft') {
          return new Response(
            JSON.stringify({ error: 'Can only approve contracts in draft status' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
        newStatus = 'approved';
        updateData.approved_at = new Date().toISOString();
        updateData.approved_by = user.id;
        break;

      case 'send_to_signature':
        if (currentStatus !== 'approved') {
          return new Response(
            JSON.stringify({ error: 'Can only send to signature contracts in approved status' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
        newStatus = 'sent_to_signature';
        updateData.sent_to_signature_at = new Date().toISOString();
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
    }

    // Update contract status
    const { error: updateError } = await supabase
      .from('rental_contracts')
      .update({
        status: newStatus,
        ...updateData,
        notes: notes ? `${contract.notes || ''}\n[${new Date().toISOString()}] ${action.toUpperCase()}: ${notes}`.trim() : contract.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', contract_id);

    if (updateError) {
      console.error('Error updating contract status:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update contract status' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Contract ${action} successful`,
        contract_id,
        new_status: newStatus
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in update-contract-status function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
