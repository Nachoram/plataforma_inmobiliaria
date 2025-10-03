import { supabase } from '@/lib/supabase';

/**
 * Genera un nuevo informe HTML usando la Edge Function get-workflow-html
 * @param workflowId - Identificador único del tipo de workflow
 * @param propertyId - ID opcional de la propiedad relacionada
 * @returns Promise<string> - Path del archivo en Storage donde se guardó el HTML
 */
export const generateWorkflowOutput = async (workflowId: string, propertyId?: string): Promise<string> => {
  try {
    console.log(`🚀 Generando informe para workflow: ${workflowId}`, propertyId ? `propiedad: ${propertyId}` : '');

    const { data, error } = await supabase.functions.invoke('get-workflow-html', {
      body: { workflowId, propertyId },
    });

    if (error) {
      console.error('❌ Error en Edge Function:', error);
      throw new Error(`Error en Edge Function: ${error.message}`);
    }

    if (!data?.success || !data.storagePath) {
      console.error('❌ Respuesta inválida de Edge Function:', data);
      throw new Error('La generación del workflow falló - respuesta inválida');
    }

    console.log(`✅ Informe generado exitosamente: ${data.storagePath}`);
    return data.storagePath;
  } catch (error) {
    console.error('❌ Error generando workflow output:', error);
    throw error;
  }
};

/**
 * Descarga el contenido HTML desde Storage
 * @param storagePath - Path del archivo en el bucket workflow-outputs
 * @returns Promise<string> - Contenido HTML del archivo
 */
export const getHtmlContentFromStorage = async (storagePath: string): Promise<string> => {
  try {
    console.log(`📥 Descargando HTML desde: ${storagePath}`);

    const { data, error } = await supabase.storage
      .from('workflow-outputs')
      .download(storagePath);

    if (error) {
      console.error('❌ Error descargando archivo:', error);
      throw new Error(`Error al descargar el informe: ${error.message}`);
    }

    if (!data) {
      throw new Error('No se pudo obtener el contenido del archivo');
    }

    const content = await data.text();
    console.log(`✅ HTML descargado exitosamente (${content.length} caracteres)`);
    return content;
  } catch (error) {
    console.error('❌ Error obteniendo HTML desde storage:', error);
    throw error;
  }
};

/**
 * Obtiene la lista de informes generados por el usuario actual
 * @param limit - Número máximo de resultados (default: 20)
 * @returns Promise<Array> - Lista de informes con metadatos
 */
export const getUserWorkflowOutputs = async (limit: number = 20) => {
  try {
    console.log(`📋 Obteniendo informes del usuario (límite: ${limit})`);

    const { data, error } = await supabase
      .from('workflow_outputs')
      .select(`
        id,
        workflow_type,
        output_storage_path,
        file_size_bytes,
        created_at,
        property_id,
        properties (
          id,
          title,
          address_street,
          address_number,
          address_commune
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Error obteniendo informes del usuario:', error);
      throw new Error(`Error al obtener informes: ${error.message}`);
    }

    console.log(`✅ Obtenidos ${data?.length || 0} informes del usuario`);
    return data || [];
  } catch (error) {
    console.error('❌ Error obteniendo workflow outputs del usuario:', error);
    throw error;
  }
};

/**
 * Elimina un informe específico
 * @param workflowOutputId - ID del registro en workflow_outputs
 * @returns Promise<void>
 */
export const deleteWorkflowOutput = async (workflowOutputId: string): Promise<void> => {
  try {
    console.log(`🗑️ Eliminando informe: ${workflowOutputId}`);

    // Primero obtener el path del archivo
    const { data: outputData, error: fetchError } = await supabase
      .from('workflow_outputs')
      .select('output_storage_path')
      .eq('id', workflowOutputId)
      .single();

    if (fetchError) {
      throw new Error(`Error al obtener datos del informe: ${fetchError.message}`);
    }

    // Eliminar archivo de Storage
    const { error: storageError } = await supabase.storage
      .from('workflow-outputs')
      .remove([outputData.output_storage_path]);

    if (storageError) {
      console.warn('⚠️ Error eliminando archivo de storage:', storageError);
      // Continuar con la eliminación de BD aunque falle storage
    }

    // Eliminar registro de base de datos
    const { error: dbError } = await supabase
      .from('workflow_outputs')
      .delete()
      .eq('id', workflowOutputId);

    if (dbError) {
      throw new Error(`Error al eliminar registro: ${dbError.message}`);
    }

    console.log(`✅ Informe eliminado exitosamente: ${workflowOutputId}`);
  } catch (error) {
    console.error('❌ Error eliminando workflow output:', error);
    throw error;
  }
};

/**
 * Workflow types disponibles en el sistema
 */
export const WORKFLOW_TYPES = {
  INFORME_MENSUAL_PROPIEDAD: 'informe_mensual_propiedad',
  REPORTE_FINANCIERO: 'reporte_financiero',
  ANALISIS_MERCADO: 'analisis_mercado',
  ESTADO_CUENTA: 'estado_cuenta',
  HISTORIAL_TRANSACCIONES: 'historial_transacciones'
} as const;

export type WorkflowType = typeof WORKFLOW_TYPES[keyof typeof WORKFLOW_TYPES];

/**
 * Tipos de contratos que pueden ser generados con N8N
 */
export const CONTRACT_WORKFLOW_TYPES = {
  CONTRATO_ARRIENDO: 'contrato_arriendo_n8n',
  CONTRATO_VENTA: 'contrato_venta_n8n',
  CONTRATO_PENDIENTE: 'contrato_pendiente_n8n'
} as const;

export type ContractWorkflowType = typeof CONTRACT_WORKFLOW_TYPES[keyof typeof CONTRACT_WORKFLOW_TYPES];

/**
 * Envía datos del contrato a N8N para que genere el contrato completo
 * @param contractData - Datos completos del contrato para N8N
 * @returns Promise<boolean> - true si se envió correctamente
 */
export const sendContractToN8N = async (contractData: {
  contractId: string;
  userId: string;
  propertyId?: string;
  applicationId?: string;
  tenantName: string;
  tenantLastName: string;
  propertyAddress: string;
  propertyCommune: string;
  propertyRegion: string;
}): Promise<boolean> => {
  try {
    console.log(`🚀 Enviando contrato a N8N para generación: ${contractData.contractId}`);

    // Aquí puedes usar webhook, HTTP Request, etc. para enviar a N8N
    // Por ahora simulamos que N8N recibe los datos
    const n8nWebhookUrl = process.env.VITE_N8N_CONTRACT_WEBHOOK_URL ||
                         'https://tu-n8n-instance.com/webhook/generate-contract';

    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VITE_WEBHOOK_SECRET || 'secret'}`
      },
      body: JSON.stringify({
        action: 'generate_contract',
        timestamp: new Date().toISOString(),
        data: contractData
      })
    });

    if (!response.ok) {
      console.warn(`⚠️ N8N webhook respondió con ${response.status}`);
      // No lanzamos error, ya que N8N puede procesar async
    }

    console.log(`✅ Datos enviados a N8N para contrato: ${contractData.contractId}`);
    return true;
  } catch (error) {
    console.error('❌ Error enviando contrato a N8N:', error);
    // No lanzamos error para no bloquear la UI
    return false;
  }
};

/**
 * Verifica si un contrato generado por N8N está completo
 * @param workflowOutputId - ID del registro en workflow_outputs
 * @returns Promise<boolean> - true si el contrato está completo
 */
export const isContractComplete = async (workflowOutputId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('workflow_outputs')
      .select('output_storage_path, file_size_bytes')
      .eq('id', workflowOutputId)
      .single();

    if (error) {
      console.error('❌ Error verificando estado del contrato:', error);
      return false;
    }

    const isComplete = data.output_storage_path && data.file_size_bytes;
    console.log(`🔍 Contrato ${workflowOutputId} completo: ${isComplete}`);
    return !!isComplete;
  } catch (error) {
    console.error('❌ Error verificando completitud del contrato:', error);
    return false;
  }
};

/**
 * Obtiene contratos pendientes que N8N debe procesar
 * @returns Promise<Array> - Lista de contratos pendientes
 */
export const getPendingContractsForN8N = async () => {
  try {
    console.log('🔍 Buscando contratos pendientes para N8N...');

    const { data, error } = await supabase
      .from('workflow_outputs')
      .select(`
        id,
        user_id,
        property_id,
        workflow_type,
        created_at,
        metadata,
        profiles:user_id (
          first_name,
          paternal_last_name,
          email
        ),
        properties:property_id (
          title,
          address_street,
          address_number,
          address_commune
        )
      `)
      .eq('workflow_type', CONTRACT_WORKFLOW_TYPES.CONTRATO_PENDIENTE)
      .is('output_storage_path', null)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error obteniendo contratos pendientes:', error);
      throw new Error(`Error obteniendo contratos pendientes: ${error.message}`);
    }

    console.log(`📋 Encontrados ${data?.length || 0} contratos pendientes`);
    return data || [];
  } catch (error) {
    console.error('❌ Error obteniendo contratos pendientes para N8N:', error);
    throw error;
  }
};

/**
 * Función que N8N usa para crear contratos completos en la base de datos
 * @param contractData - Datos completos del contrato
 * @param htmlContent - Contenido HTML generado
 * @returns Promise<string> - ID del contrato creado
 */
export const createCompleteContractFromN8N = async (
  contractData: {
    contractId: string;
    userId: string;
    propertyId?: string;
    applicationId?: string;
    tenantName: string;
    tenantLastName: string;
    propertyAddress: string;
    propertyCommune: string;
    propertyRegion: string;
  },
  htmlContent: string
): Promise<string> => {
  try {
    console.log(`📝 N8N creando contrato completo para: ${contractData.contractId}`);

    // Crear path único para el archivo
    const timestamp = Date.now();
    const filePath = `n8n-contracts/${contractData.contractId}-${timestamp}.html`;

    // Subir HTML a Storage
    const { error: uploadError } = await supabase.storage
      .from('workflow-outputs')
      .upload(filePath, htmlContent, {
        contentType: 'text/html',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Error subiendo HTML del contrato:', uploadError);
      throw new Error(`Error subiendo archivo: ${uploadError.message}`);
    }

    // Insertar registro completo en BD
    const { data, error: insertError } = await supabase
      .from('workflow_outputs')
      .insert({
        user_id: contractData.userId,
        property_id: contractData.propertyId || null,
        workflow_type: CONTRACT_WORKFLOW_TYPES.CONTRATO_ARRIENDO,
        output_storage_path: filePath,
        file_size_bytes: htmlContent.length,
        metadata: {
          contract_id: contractData.contractId,
          application_id: contractData.applicationId,
          source: 'n8n_complete',
          generated_at: new Date().toISOString(),
          tenant_name: contractData.tenantName,
          tenant_lastname: contractData.tenantLastName,
          property_address: contractData.propertyAddress,
          property_commune: contractData.propertyCommune,
          property_region: contractData.propertyRegion,
          status: 'completed'
        }
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('❌ Error insertando contrato completo:', insertError);
      // Intentar limpiar el archivo subido
      await supabase.storage.from('workflow-outputs').remove([filePath]);
      throw new Error(`Error insertando registro: ${insertError.message}`);
    }

    console.log(`✅ Contrato completo creado por N8N: ${data.id}`);
    return data.id;
  } catch (error) {
    console.error('❌ Error creando contrato completo desde N8N:', error);
    throw error;
  }
};