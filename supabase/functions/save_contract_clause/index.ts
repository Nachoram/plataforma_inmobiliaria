import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ClauseData {
  contract_id: string
  clause_number: string
  clause_title: string
  clause_content: string
  canvas_section?: 'header' | 'conditions' | 'obligations' | 'termination' | 'signatures'
  sort_order?: number
  created_by_system?: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Parse request body
    const clauseData: ClauseData = await req.json()

    // Validate required fields
    if (!clauseData.contract_id || !clauseData.clause_number || !clauseData.clause_title || !clauseData.clause_content) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: contract_id, clause_number, clause_title, clause_content'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Set defaults
    const clauseToInsert = {
      contract_id: clauseData.contract_id,
      clause_number: clauseData.clause_number,
      clause_title: clauseData.clause_title,
      clause_content: clauseData.clause_content,
      canvas_section: clauseData.canvas_section || 'obligations',
      sort_order: clauseData.sort_order || 0,
      created_by_system: clauseData.created_by_system || 'n8n'
    }

    // Insert clause
    const { data, error } = await supabaseClient
      .from('contract_clauses')
      .insert(clauseToInsert)
      .select()
      .single()

    if (error) {
      console.error('Error inserting clause:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Sync canvas content after inserting clause
    const { error: syncError } = await supabaseClient.rpc('sync_contract_canvas_content', {
      contract_uuid: clauseData.contract_id
    })

    if (syncError) {
      console.error('Error syncing canvas content:', syncError)
      // Don't fail the request, just log the error
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: data,
        message: 'Clause saved successfully and canvas content synced'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
