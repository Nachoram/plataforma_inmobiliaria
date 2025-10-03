import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const generateHtmlReport = (workflowId: string, userId: string, propertyId?: string): string => {
  const propertyInfo = propertyId ? `<p>Propiedad ID: ${propertyId}</p>` : '';
  return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Informe ${workflowId}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 2rem;
            max-width: 800px;
            margin: 0 auto;
            line-height: 1.6;
            color: #333;
        }
        .header {
            border-bottom: 3px solid #007bff;
            padding-bottom: 1rem;
            margin-bottom: 2rem;
        }
        h1 {
            color: #007bff;
            margin-bottom: 0.5rem;
            font-size: 2.5rem;
        }
        .metadata {
            background-color: #f8f9fa;
            padding: 1rem;
            border-radius: 8px;
            margin: 1rem 0;
            border-left: 4px solid #007bff;
        }
        .metadata p {
            margin: 0.5rem 0;
            font-size: 0.9rem;
        }
        .content {
            background-color: #ffffff;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .footer {
            margin-top: 2rem;
            padding-top: 1rem;
            border-top: 1px solid #dee2e6;
            font-size: 0.8rem;
            color: #6c757d;
            text-align: center;
        }
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Informe: ${workflowId}</h1>
        <p>Reporte generado por el sistema de workflows</p>
    </div>

    <div class="metadata">
        <p><strong>Usuario ID:</strong> ${userId}</p>
        ${propertyInfo}
        <p><strong>Tipo de Workflow:</strong> ${workflowId}</p>
        <p><strong>Fecha de Generación:</strong> ${new Date().toLocaleString('es-CL')}</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
    </div>

    <div class="content">
        <h2>Contenido del Informe</h2>
        <p>Este es un informe generado automáticamente por el sistema de workflows de la plataforma inmobiliaria.</p>

        <h3>Detalles del Proceso</h3>
        <ul>
            <li>Workflow ejecutado: ${workflowId}</li>
            <li>Usuario solicitante: ${userId}</li>
            <li>Estado: Completado exitosamente</li>
            <li>Formato: HTML para visualización en canvas</li>
        </ul>

        <h3>Información Adicional</h3>
        <p>Este documento puede ser visualizado directamente en el navegador o convertido a imagen usando html2canvas para su integración en aplicaciones frontend.</p>
    </div>

    <div class="footer">
        <p>Generado por Plataforma Inmobiliaria - ${new Date().getFullYear()}</p>
        <p class="no-print">Este documento es confidencial y está protegido por políticas RLS</p>
    </div>
</body>
</html>`;
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
        JSON.stringify({ error: 'Method not allowed' }),
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

    // Verificar autenticación del usuario
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Crear cliente para verificar usuario
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuario no autenticado' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parsear payload
    const { workflowId, propertyId } = await req.json();

    // Validar parámetros requeridos
    if (!workflowId) {
      return new Response(
        JSON.stringify({ error: 'El parámetro workflowId es requerido' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`🎯 Generando informe para workflow: ${workflowId}, usuario: ${user.id}`);

    // Generar contenido HTML del informe
    const htmlContent = generateHtmlReport(workflowId, user.id, propertyId);
    const htmlBlob = new Blob([htmlContent], { type: 'text/html' });

    // Crear path único para el archivo
    const timestamp = Date.now();
    const filePath = `${user.id}/${workflowId}-${timestamp}.html`;

    console.log(`📁 Subiendo archivo a: ${filePath}`);

    // Subir archivo a Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from('workflow-outputs')
      .upload(filePath, htmlBlob, {
        contentType: 'text/html',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return new Response(
        JSON.stringify({ error: `Error al subir archivo: ${uploadError.message}` }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`✅ Archivo subido exitosamente, tamaño: ${htmlBlob.size} bytes`);

    // Registrar metadatos en la base de datos
    const { error: dbError } = await supabaseAdmin
      .from('workflow_outputs')
      .insert({
        user_id: user.id,
        property_id: propertyId || null,
        workflow_type: workflowId,
        output_storage_path: filePath,
        file_size_bytes: htmlBlob.size,
      });

    if (dbError) {
      console.error('Error inserting metadata:', dbError);
      // Intentar limpiar el archivo subido si falla la inserción en BD
      await supabaseAdmin.storage
        .from('workflow-outputs')
        .remove([filePath]);

      return new Response(
        JSON.stringify({ error: `Error al guardar metadatos: ${dbError.message}` }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`✅ Metadatos guardados exitosamente`);

    // Retornar respuesta exitosa
    return new Response(
      JSON.stringify({
        success: true,
        storagePath: filePath,
        fileSize: htmlBlob.size,
        workflowId: workflowId,
        generatedAt: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Error en Edge Function get-workflow-html:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
