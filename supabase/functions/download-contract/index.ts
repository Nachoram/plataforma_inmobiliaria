import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Only allow GET requests
    if (req.method !== 'GET') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed. Use GET.' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get contract ID from URL parameters
    const url = new URL(req.url);
    const contractId = url.searchParams.get('contract_id');

    if (!contractId) {
      return new Response(
        JSON.stringify({ error: 'Contract ID is required' }),
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

    // Verify user is authenticated and has access to this contract
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

    // Check if user has access to this contract
    const { data: contract, error: contractError } = await supabase
      .from('rental_contracts')
      .select(`
        id,
        signed_contract_url,
        contract_html,
        status,
        applications (
          id,
          applicant_id,
          properties (
            owner_id
          )
        )
      `)
      .eq('id', contractId)
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

    // Check permissions: user must be owner, applicant, or guarantor
    const application = contract.applications;
    const isOwner = application.properties.owner_id === user.id;
    const isApplicant = application.applicant_id === user.id;

    // Check if user is a guarantor (this would need additional logic for guarantor_id)
    // For now, we'll allow owner and applicant to download

    if (!isOwner && !isApplicant) {
      // Check if user is a guarantor
      const { data: guarantorCheck, error: guarantorError } = await supabase
        .from('applications')
        .select('guarantor_id')
        .eq('id', application.id)
        .eq('guarantor_id', user.id)
        .single();

      if (guarantorError || !guarantorCheck) {
        return new Response(
          JSON.stringify({ error: 'Access denied. You do not have permission to download this contract.' }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // If contract has signed_contract_url, redirect to it
    if (contract.signed_contract_url) {
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': contract.signed_contract_url,
        }
      });
    }

    // If contract has HTML content, return it as a downloadable file
    if (contract.contract_html) {
      return new Response(contract.contract_html, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html',
          'Content-Disposition': `attachment; filename="contrato_${contractId.slice(-8)}.html"`,
        }
      });
    }

    // No downloadable content available
    return new Response(
      JSON.stringify({ error: 'No downloadable contract content available' }),
      {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in download-contract function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
