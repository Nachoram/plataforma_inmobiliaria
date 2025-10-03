import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verificar método HTTP
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed. Use POST.' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Crear cliente Supabase con permisos de administrador
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Validar webhook secret (seguridad básica)
    const webhookSecret = req.headers.get('x-webhook-secret');
    const expectedSecret = Deno.env.get('WEBHOOK_SECRET');

    if (expectedSecret && webhookSecret !== expectedSecret) {
      console.warn('❌ Webhook secret inválido');
      return new Response(
        JSON.stringify({ error: 'Invalid webhook secret' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parsear payload del webhook
    const payload = await req.json();
    console.log('📦 Payload recibido:', JSON.stringify(payload, null, 2));

    // Validar estructura del payload
    const {
      html,
      contractId,
      workflowId = 'contrato_n8n',
      userId,
      propertyId,
      applicationId,
      metadata = {}
    } = payload;

    if (!html) {
      return new Response(
        JSON.stringify({ error: 'El campo "html" es requerido en el payload' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'El campo "userId" es requerido en el payload' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`🎯 Recibiendo contrato desde N8N - Usuario: ${userId}, Workflow: ${workflowId}`);

    // Crear blob con el contenido HTML
    const htmlBlob = new Blob([html], { type: 'text/html' });

    // Crear path único para el archivo
    const timestamp = Date.now();
    const contractSuffix = contractId ? `-${contractId}` : '';
    const filePath = `${userId}/${workflowId}${contractSuffix}-${timestamp}.html`;

    console.log(`📁 Subiendo contrato a: ${filePath} (${htmlBlob.size} bytes)`);

    // Subir archivo a Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from('workflow-outputs')
      .upload(filePath, htmlBlob, {
        contentType: 'text/html',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Error uploading contract file:', uploadError);
      return new Response(
        JSON.stringify({
          error: `Error al subir contrato: ${uploadError.message}`,
          success: false
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`✅ Contrato subido exitosamente`);

    // Registrar metadatos en la base de datos
    const { data: insertedRecord, error: dbError } = await supabaseAdmin
      .from('workflow_outputs')
      .insert({
        user_id: userId,
        property_id: propertyId || null,
        workflow_type: workflowId,
        output_storage_path: filePath,
        file_size_bytes: htmlBlob.size,
        metadata: {
          contract_id: contractId,
          application_id: applicationId,
          source: 'n8n_webhook',
          received_at: new Date().toISOString(),
          ...metadata
        }
      })
      .select()
      .single();

    if (dbError) {
      console.error('❌ Error inserting contract metadata:', dbError);
      // Intentar limpiar el archivo subido si falla la inserción en BD
      await supabaseAdmin.storage
        .from('workflow-outputs')
        .remove([filePath]);

      return new Response(
        JSON.stringify({
          error: `Error al guardar metadatos del contrato: ${dbError.message}`,
          success: false
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`✅ Metadatos del contrato guardados exitosamente - ID: ${insertedRecord.id}`);

    // Si hay applicationId, crear/actualizar el rental_contract
    let rentalContractId = null;
    if (applicationId) {
      console.log(`📝 Creando/actualizando rental_contract para application_id: ${applicationId}`);

      // Verificar si ya existe un contrato para esta aplicación
      const { data: existingContract } = await supabaseAdmin
        .from('rental_contracts')
        .select('id')
        .eq('application_id', applicationId)
        .single();

      if (existingContract) {
        // Actualizar contrato existente
        console.log(`🔄 Actualizando contrato existente: ${existingContract.id}`);
        const { data: updatedContract, error: updateError } = await supabaseAdmin
          .from('rental_contracts')
          .update({
            contract_html: html,
            contract_format: 'html',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingContract.id)
          .select()
          .single();

        if (updateError) {
          console.error('❌ Error actualizando rental_contract:', updateError);
        } else {
          rentalContractId = updatedContract.id;
          console.log(`✅ Rental contract actualizado: ${rentalContractId}`);
        }
      } else {
        // Crear nuevo contrato
        console.log(`➕ Creando nuevo rental_contract`);
        const { data: newContract, error: createError } = await supabaseAdmin
          .from('rental_contracts')
          .insert({
            application_id: applicationId,
            contract_html: html,
            contract_format: 'html',
            status: 'draft',
            created_by: userId,
            contract_content: null // Permitir NULL
          })
          .select()
          .single();

        if (createError) {
          console.error('❌ Error creando rental_contract:', createError);
        } else {
          rentalContractId = newContract.id;
          console.log(`✅ Rental contract creado: ${rentalContractId}`);
        }
      }
    }

    // Retornar respuesta exitosa con información del contrato recibido
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Contrato recibido y almacenado exitosamente',
        contractId: insertedRecord.id,
        rentalContractId: rentalContractId,
        storagePath: filePath,
        fileSize: htmlBlob.size,
        workflowId: workflowId,
        userId: userId,
        applicationId: applicationId,
        receivedAt: new Date().toISOString(),
        // Información adicional para debugging en N8N
        debug: {
          filePath: filePath,
          recordId: insertedRecord.id,
          rentalContractId: rentalContractId,
          fileSize: htmlBlob.size,
          workflowType: workflowId,
          hasApplicationId: !!applicationId
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ Error en Edge Function receive-contract-webhook:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        success: false,
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
