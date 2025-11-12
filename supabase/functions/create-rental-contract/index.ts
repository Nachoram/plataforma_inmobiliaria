import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ContractCreationRequest {
  application_id: string
  // Form data
  contract_start_date: string
  duration: number
  final_rent_price: number
  warranty_amount: number
  payment_day: number
  property_type_characteristics_id: string
  broker_name?: string
  broker_rut?: string
  broker_commission?: number
  allows_pets?: boolean
  dicom_clause?: boolean
  notification_email: string
  bank_name?: string
  account_type?: string
  account_number?: string
  account_holder_name?: string
  account_holder_rut?: string
  special_conditions_house?: string
  sublease?: string
  max_occupants?: number
  allowed_use?: string
  access_clause?: string
  payment_method?: 'transferencia_bancaria' | 'plataforma'
}

serve(async (req) => {
  // Handle CORS preflight requests
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

    // Get the current user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Usuario no autenticado' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse request body
    const contractData: ContractCreationRequest = await req.json()

    // Validate required fields
    if (!contractData.application_id) {
      return new Response(
        JSON.stringify({ error: 'ID de aplicación es requerido' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!contractData.contract_start_date || !contractData.final_rent_price || !contractData.notification_email) {
      return new Response(
        JSON.stringify({ error: 'Datos requeridos faltantes: fecha de inicio, precio final y email de notificación' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verify application exists and user has access
    const { data: application, error: appError } = await supabaseClient
      .from('applications')
      .select(`
        id,
        property_id,
        properties!inner (
          id,
          owner_id
        )
      `)
      .eq('id', contractData.application_id)
      .single()

    if (appError || !application) {
      return new Response(
        JSON.stringify({ error: 'Aplicación no encontrada o no tienes acceso' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if user is the property owner
    if (application.properties.owner_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Solo el propietario puede crear contratos para esta propiedad' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if contract already exists for this application
    const { data: existingContract, error: checkError } = await supabaseClient
      .from('rental_contracts')
      .select('id')
      .eq('application_id', contractData.application_id)
      .maybeSingle()

    if (checkError) {
      return new Response(
        JSON.stringify({ error: 'Error al verificar contratos existentes' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (existingContract) {
      return new Response(
        JSON.stringify({ error: 'Ya existe un contrato para esta aplicación' }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get application data for emails and other details
    const { data: applicationDetails, error: appDetailsError } = await supabaseClient
      .from('applications')
      .select(`
        id,
        applicant_id,
        profiles!applications_applicant_id_fkey (
          email
        )
      `)
      .eq('id', contractData.application_id)
      .single()

    if (appDetailsError) {
      return new Response(
        JSON.stringify({ error: 'Error al obtener datos de la aplicación' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get landlord email from rental_owners table
    const { data: landlordData, error: landlordError } = await supabaseClient
      .from('rental_owners')
      .select('email')
      .eq('property_id', application.properties.id)
      .single()

    if (landlordError) {
      return new Response(
        JSON.stringify({ error: 'Error al obtener datos del propietario' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Prepare contract data with all required fields
    const contractInsertData = {
      application_id: contractData.application_id,
      status: 'draft',

      // Basic contract information
      start_date: contractData.contract_start_date,
      validity_period_months: contractData.duration,
      final_amount: contractData.final_rent_price,
      guarantee_amount: contractData.warranty_amount,

      // Currency fields (defaults to CLP)
      final_amount_currency: 'clp',
      guarantee_amount_currency: 'clp',

      // Payment information
      payment_day: contractData.payment_day,

      // Banking information
      account_holder_name: contractData.account_holder_name || null,
      account_number: contractData.account_number || null,
      account_bank: contractData.bank_name || null,
      account_type: contractData.account_type === 'Cuenta Corriente' ? 'corriente' :
                   contractData.account_type === 'Cuenta Vista' ? 'vista' :
                   contractData.account_type === 'Cuenta de Ahorro' ? 'ahorro' : null,

      // Broker information
      has_brokerage_commission: !!(contractData.broker_commission && contractData.broker_commission > 0),
      broker_name: contractData.broker_name || null,
      broker_amount: contractData.broker_commission || null,
      broker_rut: contractData.broker_rut || null,

      // Special conditions
      allows_pets: contractData.allows_pets || false,
      is_furnished: false, // Default value
      has_dicom_clause: contractData.dicom_clause || false,

      // Emails from application data
      tenant_email: applicationDetails.profiles?.email || null,
      landlord_email: landlordData.email || contractData.notification_email,

      // Metadata
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1,
      notes: `Contrato generado desde formulario de condiciones el ${new Date().toLocaleString('es-CL')}`,

      // Fields that should be null/empty as per requirements
      contract_content: null,
      contract_html: null
    }

    // Create the rental contract
    const { data: newContract, error: insertError } = await supabaseClient
      .from('rental_contracts')
      .insert(contractInsertData)
      .select('id, contract_characteristic_id, contract_number, status')
      .single()

    if (insertError) {
      console.error('Error creating contract:', insertError)
      return new Response(
        JSON.stringify({
          error: 'Error al crear el contrato',
          details: insertError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Contrato creado exitosamente',
        contract: {
          id: newContract.id,
          contract_characteristic_id: newContract.contract_characteristic_id,
          contract_number: newContract.contract_number,
          status: newContract.status
        }
      }),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({
        error: 'Error interno del servidor',
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

